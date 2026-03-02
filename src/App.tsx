import React, { useEffect, useState } from "react";

import { useAuth } from "./context/AuthContext";
import CollaboratorsSection from "./features/collaborators/CollaboratorsSection";
import JsonSection from "./features/data-export/JsonSection";
import BudgetSection from "./features/budget/BudgetSection";
import GuestsSection from "./features/guests/GuestsSection";
import TablesSection from "./features/tables/TablesSection";
import TasksSection from "./features/tasks/TasksSection";
import VendorsSection from "./features/vendors/VendorsSection";
import { useSync } from "./hooks/useSync";
import { useWeddingData } from "./hooks/useWeddingData";
import { useWorkspace } from "./hooks/useWorkspace";
import AuthPanel from "./shared/components/AuthPanel";
import Header from "./shared/components/Header";
import { downloadJson } from "./utils/storage";
import type { CollapseSignal, SyncState } from "./types/wedding";

function getSyncLabel(syncState: SyncState): string {
  switch (syncState) {
    case "saving": return "Saving...";
    case "saved": return "Saved";
    case "dirty": return "Unsaved changes";
    case "error": return "Save error";
    default: return "";
  }
}

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [statusMessage, setStatusMessage] = useState("");
  const [collapseSignal, setCollapseSignal] = useState<CollapseSignal>({ mode: null, seq: 0 });

  const weddingData = useWeddingData();
  const workspace = useWorkspace(user, {
    onServerState: weddingData.applyServerState,
    setStatusMessage,
    getWeddingTitle: () => weddingData.data.meta.title,
  });
  const { syncState } = useSync(workspace.workspaceId, weddingData.data, weddingData.hasPendingSave, weddingData.dirtyDomains, {
    onServerState: weddingData.applyServerState,
    onSaveClear: weddingData.clearPendingSave,
    setStatusMessage,
  });

  useEffect(() => {
    document.title = weddingData.data.meta.title || "Wedding Planner";
  }, [weddingData.data.meta.title]);

  if (!authLoading && !user) return <AuthPanel />;

  if (authLoading || workspace.workspaceLoading) {
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
            <button className="btn" type="button" onClick={workspace.retryLoad}>
              Retry
            </button>
            <button className="btn danger" type="button" onClick={signOut}>
              Sign Out
            </button>
          </div>
        </section>
      </main>
    );
  }

  const { data, stats } = weddingData;
  const syncLabel = getSyncLabel(syncState);

  return (
    <main className="page">
      <Header meta={data.meta} onMetaChange={weddingData.patchMeta} stats={stats} />

      <div className="global-actions">
        <button
          className="btn"
          type="button"
          onClick={() => setCollapseSignal((prev) => ({ mode: "expand", seq: prev.seq + 1 }))}
        >
          Open All
        </button>
        <button
          className="btn"
          type="button"
          onClick={() => setCollapseSignal((prev) => ({ mode: "collapse", seq: prev.seq + 1 }))}
        >
          Collapse All
        </button>
        <button className="btn secondary" type="button" onClick={workspace.refreshFromServer}>
          Refresh
        </button>
        <button className="btn secondary" type="button" onClick={signOut}>
          Sign Out
        </button>
      </div>

      <p className="muted sync-label">
        {syncLabel} {statusMessage ? `• ${statusMessage}` : ""}
      </p>

      <div className="stack">
        <CollaboratorsSection
          role={workspace.workspaceRole}
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
    </main>
  );
}
