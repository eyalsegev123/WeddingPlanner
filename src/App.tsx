import React, { useCallback, useEffect, useState } from "react";

import { useAuth } from "./context/AuthContext";
import AIChatPanel from "./features/ai-chat/AIChatPanel";
import CollaboratorsSection from "./features/collaborators/CollaboratorsSection";
import JsonSection from "./features/data-export/JsonSection";
import BudgetSection from "./features/budget/BudgetSection";
import GuestsSection from "./features/guests/GuestsSection";
import TablesSection from "./features/tables/TablesSection";
import TasksSection from "./features/tasks/TasksSection";
import VendorsSection from "./features/vendors/VendorsSection";
import { WorkspacePickerPage } from "./features/workspaces/WorkspacePickerPage";
import { useIsMobile } from "./hooks/useIsMobile";
import { useSync } from "./hooks/useSync";
import { useWeddingData } from "./hooks/useWeddingData";
import { useWorkspace } from "./hooks/useWorkspace";
import { acceptInvite, createWorkspaceForOwner, declineInvite, deleteWorkspace, listPendingInvites, listUserWorkspaces } from "./services/weddingApi";
import AuthPanel from "./shared/components/AuthPanel";
import Header from "./shared/components/Header";
import { downloadJson, getDefaultData } from "./utils/storage";
import type { CollapseSignal, PendingInvite, SyncState, WorkspaceRole, WorkspaceSummary } from "./types/wedding";

function getSyncLabel(syncState: SyncState): string {
  switch (syncState) {
    case "saving": return "Saving...";
    case "saved": return "Saved";
    case "dirty": return "Unsaved changes";
    case "error": return "Save error";
    default: return "";
  }
}

type AppView = "picker" | "workspace";
type MobileTab = "home" | "guests" | "tasks" | "budget" | "more";
type MobileSection = "home" | "guests" | "tasks" | "budget" | "venues" | "tables" | "collaborators" | "export";

const MORE_SECTIONS: MobileSection[] = ["venues", "tables", "collaborators", "export"];

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [statusMessage, setStatusMessage] = useState("");
  const [collapseSignal, setCollapseSignal] = useState<CollapseSignal>({ mode: null, seq: 0 });
  const [chatOpen, setChatOpen] = useState(false);
  const [activeMobileSection, setActiveMobileSection] = useState<MobileSection>("home");
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  const [view, setView] = useState<AppView>("picker");
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerError, setPickerError] = useState("");
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [selectedWorkspaceRole, setSelectedWorkspaceRole] = useState<WorkspaceRole>("editor");

  const weddingData = useWeddingData();
  const workspace = useWorkspace(user, selectedWorkspaceId, selectedWorkspaceRole, {
    onServerState: weddingData.applyServerState,
    setStatusMessage,
    getWeddingTitle: () => weddingData.data.meta.title,
  });
  const { syncState } = useSync(selectedWorkspaceId ?? "", weddingData.data, weddingData.hasPendingSave, weddingData.dirtyDomains, {
    onServerState: weddingData.applyServerState,
    onSaveClear: weddingData.clearPendingSave,
    setStatusMessage,
  });

  useEffect(() => {
    document.title = weddingData.data.meta.title || "Wedding Planner";
  }, [weddingData.data.meta.title]);

  const loadPickerWorkspaces = useCallback(async () => {
    if (!user) return;
    setPickerLoading(true);
    setPickerError("");
    try {
      const [list, invites] = await Promise.all([
        listUserWorkspaces(user.id),
        listPendingInvites(user.email ?? ""),
      ]);
      setWorkspaces(list);
      setPendingInvites(invites);
    } catch (err) {
      setPickerError(err instanceof Error ? err.message : "Failed to load workspaces.");
    } finally {
      setPickerLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setView("picker");
      setSelectedWorkspaceId(null);
      setSelectedWorkspaceRole("editor");
      setWorkspaces([]);
      setPendingInvites([]);
      return;
    }
    loadPickerWorkspaces();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSelectWorkspace(ws: WorkspaceSummary) {
    weddingData.applyServerState(getDefaultData());
    setSelectedWorkspaceId(ws.weddingId);
    setSelectedWorkspaceRole(ws.role);
    setView("workspace");
  }

  async function handleCreateWorkspace() {
    if (!user) return;
    try {
      const created = await createWorkspaceForOwner(user);
      await loadPickerWorkspaces();
      handleSelectWorkspace({
        weddingId: created.weddingId,
        role: created.role,
        title: "",
        partnerOne: "",
        partnerTwo: "",
      });
    } catch (err) {
      setPickerError(err instanceof Error ? err.message : "Failed to create workspace.");
    }
  }

  function handleBackToPicker() {
    weddingData.applyServerState(getDefaultData());
    setView("picker");
    setSelectedWorkspaceId(null);
    loadPickerWorkspaces();
  }

  async function handleAcceptInvite(memberId: string) {
    if (!user) return;
    try {
      await acceptInvite(memberId, user.id);
      await loadPickerWorkspaces();
    } catch (err) {
      setPickerError(err instanceof Error ? err.message : "Failed to accept invite.");
    }
  }

  async function handleDeclineInvite(memberId: string) {
    try {
      await declineInvite(memberId);
      await loadPickerWorkspaces();
    } catch (err) {
      setPickerError(err instanceof Error ? err.message : "Failed to decline invite.");
    }
  }

  async function handleDeleteWorkspace(weddingId: string) {
    try {
      await deleteWorkspace(weddingId);
      await loadPickerWorkspaces();
    } catch (err) {
      setPickerError(err instanceof Error ? err.message : "Failed to delete workspace.");
    }
  }

  if (!authLoading && !user) return <AuthPanel />;

  if (authLoading) {
    return (
      <main className="page">
        <section className="card section">
          <h1>Loading...</h1>
          <p className="muted">Connecting to backend.</p>
        </section>
      </main>
    );
  }

  if (view === "picker") {
    return (
      <WorkspacePickerPage
        workspaces={workspaces}
        pendingInvites={pendingInvites}
        loading={pickerLoading}
        error={pickerError}
        onSelect={handleSelectWorkspace}
        onCreate={handleCreateWorkspace}
        onSignOut={signOut}
        onAccept={handleAcceptInvite}
        onDecline={handleDeclineInvite}
        onDelete={handleDeleteWorkspace}
      />
    );
  }

  if (workspace.workspaceLoading) {
    return (
      <main className="page">
        <section className="card section">
          <h1>Loading workspace...</h1>
          <p className="muted">Connecting to backend.</p>
        </section>
      </main>
    );
  }

  if (workspace.appError) {
    return (
      <main className="page">
        <section className="card section">
          <h1>Could not load workspace</h1>
          <p className="muted">{workspace.appError}</p>
          <div className="row-actions">
            <button className="btn" type="button" onClick={workspace.retryLoad}>Retry</button>
            <button className="btn secondary" type="button" onClick={handleBackToPicker}>Back to Workspaces</button>
            <button className="btn danger" type="button" onClick={signOut}>Sign Out</button>
          </div>
        </section>
      </main>
    );
  }

  const { data, stats } = weddingData;
  const syncLabel = getSyncLabel(syncState);

  // ── Mobile layout ──────────────────────────────────────────────────
  if (isMobile) {
    const activeTab: MobileTab = MORE_SECTIONS.includes(activeMobileSection) ? "more" : activeMobileSection as MobileTab;

    function handleMobileTab(tab: MobileTab) {
      if (tab === "more") {
        setMoreSheetOpen(true);
      } else {
        setActiveMobileSection(tab);
        setMoreSheetOpen(false);
      }
    }

    function navigateToSection(section: MobileSection) {
      setActiveMobileSection(section);
      setMoreSheetOpen(false);
    }

    let mobileContent: React.ReactNode;
    switch (activeMobileSection) {
      case "home":
        mobileContent = (
          <>
            <Header meta={data.meta} onMetaChange={weddingData.patchMeta} stats={stats} />
            <p className="muted" style={{ fontSize: "0.8rem" }}>
              {syncLabel}{statusMessage ? ` • ${statusMessage}` : ""}
            </p>
          </>
        );
        break;
      case "guests":
        mobileContent = (
          <GuestsSection
            guests={data.guests}
            meta={data.meta}
            onAddGuest={weddingData.addGuest}
            onPatchGuest={weddingData.patchGuest}
            onDeleteGuest={weddingData.deleteGuest}
          />
        );
        break;
      case "tasks":
        mobileContent = (
          <TasksSection
            tasks={data.tasks}
            onAddTask={weddingData.addTask}
            onPatchTask={weddingData.patchTask}
            onDeleteTask={weddingData.deleteTask}
          />
        );
        break;
      case "budget":
        mobileContent = (
          <BudgetSection
            budget={data.budget}
            currency={data.meta.currency}
            onAddItem={weddingData.addBudgetItem}
            onPatchItem={weddingData.patchBudgetItem}
            onDeleteItem={weddingData.deleteBudgetItem}
          />
        );
        break;
      case "venues":
        mobileContent = (
          <VendorsSection
            vendors={data.vendors}
            currency={data.meta.currency}
            onAddVendor={weddingData.addVendor}
            onPatchVendor={weddingData.patchVendor}
            onDeleteVendor={weddingData.deleteVendor}
          />
        );
        break;
      case "tables":
        mobileContent = (
          <TablesSection
            tables={data.tables}
            guests={data.guests}
            onAddTable={weddingData.addTable}
            onPatchTable={weddingData.patchTable}
            onDeleteTable={weddingData.deleteTable}
          />
        );
        break;
      case "collaborators":
        mobileContent = (
          <CollaboratorsSection
            role={selectedWorkspaceRole}
            userEmail={user?.email}
            members={workspace.members}
            loading={workspace.membersLoading}
            onInvite={workspace.handleInvite}
            onRemove={workspace.handleRemove}
            statusMessage={statusMessage}
          />
        );
        break;
      case "export":
        mobileContent = (
          <JsonSection
            data={data}
            onApplyJson={weddingData.applyJson}
            onResetData={weddingData.resetAllData}
            onExportJson={() => downloadJson(data)}
          />
        );
        break;
    }

    const tabs: { id: MobileTab; label: string; icon: React.ReactNode }[] = [
      {
        id: "home",
        label: "Home",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9,22 9,12 15,12 15,22" />
          </svg>
        ),
      },
      {
        id: "guests",
        label: "Guests",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
        ),
      },
      {
        id: "tasks",
        label: "Tasks",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9,11 12,14 22,4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
        ),
      },
      {
        id: "budget",
        label: "Budget",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
          </svg>
        ),
      },
      {
        id: "more",
        label: "More",
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
          </svg>
        ),
      },
    ];

    return (
      <main className="page">
        {mobileContent}

        {!chatOpen && (
          <button className="ai-fab" type="button" aria-label="Open AI Assistant" onClick={() => setChatOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </button>
        )}

        {chatOpen && <AIChatPanel weddingData={data} onClose={() => setChatOpen(false)} />}

        {moreSheetOpen && (
          <div className="more-sheet-backdrop" onClick={() => setMoreSheetOpen(false)}>
            <div className="more-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="more-sheet-handle" />
              <button className="more-sheet-item" type="button" onClick={() => navigateToSection("venues")}>Venues</button>
              <button className="more-sheet-item" type="button" onClick={() => navigateToSection("tables")}>Seating</button>
              <button className="more-sheet-item" type="button" onClick={() => navigateToSection("collaborators")}>Collaborators</button>
              <button className="more-sheet-item" type="button" onClick={() => navigateToSection("export")}>Export / JSON</button>
              <hr className="more-sheet-divider" />
              <button className="more-sheet-item" type="button" onClick={() => { setMoreSheetOpen(false); workspace.refreshFromServer(); }}>Refresh</button>
              <button className="more-sheet-item" type="button" onClick={() => { setMoreSheetOpen(false); handleBackToPicker(); }}>Back to Workspaces</button>
              <button className="more-sheet-item danger" type="button" onClick={() => { setMoreSheetOpen(false); signOut(); }}>Sign Out</button>
            </div>
          </div>
        )}

        <nav className="mobile-tab-bar" aria-label="Main navigation">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`mobile-tab${activeTab === tab.id ? " active" : ""}`}
              type="button"
              aria-label={tab.label}
              onClick={() => handleMobileTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {activeTab === tab.id && <span className="mobile-tab-indicator" />}
            </button>
          ))}
        </nav>
      </main>
    );
  }

  // ── Desktop layout ─────────────────────────────────────────────────
  return (
    <main className="page">
      <Header meta={data.meta} onMetaChange={weddingData.patchMeta} stats={stats} />

      <div className="global-actions">
        <button className="btn secondary" type="button" onClick={() => setCollapseSignal((prev) => ({ mode: "collapse", seq: prev.seq + 1 }))}>
          Collapse All
        </button>
        <button className="btn secondary" type="button" onClick={workspace.refreshFromServer}>
          Refresh
        </button>
        <button className="btn secondary" type="button" onClick={handleBackToPicker}>
          Back to Workspaces
        </button>
        <button className="btn secondary" type="button" onClick={signOut}>
          Sign Out
        </button>
        <button className="btn" type="button" onClick={() => setCollapseSignal((prev) => ({ mode: "expand", seq: prev.seq + 1 }))}>
          Open All
        </button>
        <button className="btn ai-pill" type="button" onClick={() => setChatOpen((o) => !o)}>
          {chatOpen ? "Close Chat" : "AI Assistant"}
        </button>
      </div>

      <p className="muted sync-label">
        {syncLabel} {statusMessage ? `• ${statusMessage}` : ""}
      </p>

      <div className="stack">
        <CollaboratorsSection
          role={selectedWorkspaceRole}
          userEmail={user?.email}
          members={workspace.members}
          loading={workspace.membersLoading}
          onInvite={workspace.handleInvite}
          onRemove={workspace.handleRemove}
          collapseSignal={collapseSignal}
          statusMessage={statusMessage}
        />
        <TasksSection
          tasks={data.tasks}
          onAddTask={weddingData.addTask}
          onPatchTask={weddingData.patchTask}
          onDeleteTask={weddingData.deleteTask}
          collapseSignal={collapseSignal}
        />
        <VendorsSection
          vendors={data.vendors}
          currency={data.meta.currency}
          onAddVendor={weddingData.addVendor}
          onPatchVendor={weddingData.patchVendor}
          onDeleteVendor={weddingData.deleteVendor}
          collapseSignal={collapseSignal}
        />
        <GuestsSection
          guests={data.guests}
          meta={data.meta}
          onAddGuest={weddingData.addGuest}
          onPatchGuest={weddingData.patchGuest}
          onDeleteGuest={weddingData.deleteGuest}
          collapseSignal={collapseSignal}
        />
        <BudgetSection
          budget={data.budget}
          currency={data.meta.currency}
          onAddItem={weddingData.addBudgetItem}
          onPatchItem={weddingData.patchBudgetItem}
          onDeleteItem={weddingData.deleteBudgetItem}
          collapseSignal={collapseSignal}
        />
        <TablesSection
          tables={data.tables}
          guests={data.guests}
          onAddTable={weddingData.addTable}
          onPatchTable={weddingData.patchTable}
          onDeleteTable={weddingData.deleteTable}
          collapseSignal={collapseSignal}
        />
        <JsonSection
          data={data}
          onApplyJson={weddingData.applyJson}
          onResetData={weddingData.resetAllData}
          onExportJson={() => downloadJson(data)}
          collapseSignal={collapseSignal}
        />
      </div>

      {chatOpen && <AIChatPanel weddingData={data} onClose={() => setChatOpen(false)} />}
    </main>
  );
}
