import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "./components/Header";
import GuestsSection from "./components/GuestsSection";
import TablesSection from "./components/TablesSection";
import TasksSection from "./components/TasksSection";
import JsonSection from "./components/JsonSection";
import BudgetSection from "./components/BudgetSection";
import VendorsSection from "./components/VendorsSection";
import AuthPanel from "./components/AuthPanel";
import CollaboratorsSection from "./components/CollaboratorsSection";
import { useAuth } from "./context/AuthContext";
import {
  getOrCreateWorkspace,
  inviteMember,
  listMembers,
  refreshWedding,
  removeMember,
  subscribeWorkspace,
  updateWorkspace
} from "./services/weddingApi";
import { downloadJson, getDefaultData, normalizeData } from "./utils/storage";

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();

  const [data, setData] = useState(() => getDefaultData());
  const [collapseSignal, setCollapseSignal] = useState({ mode: null, seq: 0 });
  const [workspaceId, setWorkspaceId] = useState("");
  const [workspaceRole, setWorkspaceRole] = useState("editor");
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [appError, setAppError] = useState("");
  const [syncState, setSyncState] = useState("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [hasPendingSave, setHasPendingSave] = useState(false);
  const [lastServerData, setLastServerData] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState("");

  const saveTimerRef = useRef(null);
  const remoteApplyRef = useRef(false);
  const remoteNoticeTimerRef = useRef(null);
  const lastUpdatedAtRef = useRef("");
  const hasPendingSaveRef = useRef(false);
  const queuedRemoteUpdateRef = useRef(null);

  useEffect(() => {
    lastUpdatedAtRef.current = lastUpdatedAt;
  }, [lastUpdatedAt]);

  useEffect(() => {
    hasPendingSaveRef.current = hasPendingSave;
  }, [hasPendingSave]);

  useEffect(() => {
    document.title = data.meta.title || "Wedding Planner";
  }, [data.meta.title]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      if (remoteNoticeTimerRef.current) {
        clearTimeout(remoteNoticeTimerRef.current);
      }
    };
  }, []);

  const stats = useMemo(() => {
    const totalGuests = data.guests.length;
    const confirmedGuests = data.guests.filter((guest) => guest.rsvp === "Yes").length;
    const totalTables = data.tables.length;
    const totalCapacity = data.tables.reduce((sum, table) => sum + Math.max(0, Number(table.capacity) || 0), 0);
    const seatedGuests = new Set(data.tables.flatMap((table) => table.guestIds)).size;
    const openTasks = data.tasks.filter((task) => task.status !== "Done").length;
    const doneTasks = data.tasks.filter((task) => task.status === "Done").length;
    const tasksCompletion = data.tasks.length ? Math.round((doneTasks / data.tasks.length) * 100) : 0;
    const rsvpCompletion = totalGuests ? Math.round((confirmedGuests / totalGuests) * 100) : 0;
    const budgetPlanned = data.budget.reduce((sum, item) => sum + item.amount, 0);
    const budgetPaid = data.budget.filter((item) => item.paid).reduce((sum, item) => sum + item.amount, 0);
    const shortlistedVendors = data.vendors.filter((vendor) => vendor.status === "Shortlisted").length;
    const bookedVendors = data.vendors.filter((vendor) => vendor.status === "Booked").length;
    const activeDate = data.meta.weddingDate ? new Date(`${data.meta.weddingDate}T00:00:00`) : null;
    const today = new Date();
    const todayAtStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const daysToWedding = activeDate ? Math.ceil((activeDate.getTime() - todayAtStart.getTime()) / 86400000) : null;

    return {
      totalGuests,
      confirmedGuests,
      totalTables,
      openSeats: totalCapacity - seatedGuests,
      openTasks,
      tasksCompletion,
      rsvpCompletion,
      budgetPlanned,
      budgetLeft: budgetPlanned - budgetPaid,
      currency: "ILS",
      shortlistedVendors,
      bookedVendors,
      daysToWedding
    };
  }, [data]);

  function applyServerState(nextData, updatedAt = "") {
    remoteApplyRef.current = true;
    hasPendingSaveRef.current = false;
    const normalized = normalizeData(nextData);
    setData(normalized);
    setLastServerData(normalized);
    setHasPendingSave(false);
    setSyncState("idle");
    setLastUpdatedAt(updatedAt || "");
    window.setTimeout(() => {
      remoteApplyRef.current = false;
    }, 0);
  }

  function showRemoteNotice(message) {
    setStatusMessage(message);
    if (remoteNoticeTimerRef.current) {
      clearTimeout(remoteNoticeTimerRef.current);
    }
    remoteNoticeTimerRef.current = window.setTimeout(() => {
      setStatusMessage("");
    }, 2400);
  }

  async function loadWorkspace() {
    if (!user) {
      return;
    }

    setWorkspaceLoading(true);
    setAppError("");
    try {
      const workspace = await getOrCreateWorkspace(user);
      setWorkspaceId(workspace.weddingId);
      setWorkspaceRole(workspace.role || "editor");
      applyServerState(workspace.data, workspace.updatedAt || "");
      setStatusMessage("Workspace ready.");
    } catch (error) {
      setAppError(error?.message || "Failed to load workspace.");
    } finally {
      setWorkspaceLoading(false);
    }
  }

  async function loadMembers() {
    if (!workspaceId) {
      return;
    }

    setMembersLoading(true);
    try {
      const rows = await listMembers(workspaceId);
      setMembers(rows);
    } catch (error) {
      setStatusMessage(error?.message || "Failed to load collaborators.");
    } finally {
      setMembersLoading(false);
    }
  }

  useEffect(() => {
    if (!user) {
      setWorkspaceId("");
      setWorkspaceRole("editor");
      setMembers([]);
      setData(getDefaultData());
      setHasPendingSave(false);
      setSyncState("idle");
      setAppError("");
      return;
    }

    loadWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!workspaceId) {
      queuedRemoteUpdateRef.current = null;
      return undefined;
    }

    loadMembers();

    const unsubscribe = subscribeWorkspace(
      workspaceId,
      (payload) => {
        if (!payload?.data) {
          return;
        }
        if (payload.updatedAt && payload.updatedAt === lastUpdatedAtRef.current) {
          return;
        }

        if (hasPendingSaveRef.current) {
          queuedRemoteUpdateRef.current = payload;
          setStatusMessage("Remote update waiting. Save completes first.");
          return;
        }

        applyServerState(payload.data, payload.updatedAt || "");
        showRemoteNotice("Updated by collaborator.");
      },
      (status) => {
        if (status === "SUBSCRIBED") {
          setStatusMessage((prev) => prev || "Realtime connected.");
        }
      }
    );

    return unsubscribe;
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId || !hasPendingSave || remoteApplyRef.current) {
      return;
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    setSyncState("saving");
    saveTimerRef.current = window.setTimeout(async () => {
      try {
        const result = await updateWorkspace(workspaceId, data);
        setHasPendingSave(false);
        setLastServerData(result.data);
        setLastUpdatedAt(result.updatedAt || "");
        setSyncState("saved");
      } catch (error) {
        setSyncState("error");
        setStatusMessage(error?.message || "Save failed. Restored latest server copy.");
        if (lastServerData) {
          applyServerState(lastServerData, lastUpdatedAtRef.current);
        }
      }
    }, 280);
  }, [workspaceId, hasPendingSave, data, lastServerData]);

  useEffect(() => {
    if (hasPendingSave || !queuedRemoteUpdateRef.current) {
      return;
    }

    const queued = queuedRemoteUpdateRef.current;
    queuedRemoteUpdateRef.current = null;

    if (queued?.updatedAt && queued.updatedAt === lastUpdatedAtRef.current) {
      return;
    }

    applyServerState(queued.data, queued.updatedAt || "");
    showRemoteNotice("Updated by collaborator.");
  }, [hasPendingSave]);

  function mutateData(updater) {
    hasPendingSaveRef.current = true;
    setData((prev) => normalizeData(updater(prev)));
    setHasPendingSave(true);
    setSyncState("dirty");
    setStatusMessage("");
  }

  function patchMeta(key, value) {
    mutateData((prev) => ({ ...prev, meta: { ...prev.meta, [key]: value } }));
  }

  function addGuest(guest) {
    mutateData((prev) => ({
      ...prev,
      guests: [...prev.guests, { ...guest, name: String(guest.name || "").trim() || "Unnamed guest", id: uid("guest") }]
    }));
  }

  function patchGuest(guestId, patch) {
    mutateData((prev) => ({
      ...prev,
      guests: prev.guests.map((guest) => (guest.id === guestId ? { ...guest, ...patch } : guest))
    }));
  }

  function deleteGuest(guestId) {
    mutateData((prev) => ({
      ...prev,
      guests: prev.guests.filter((guest) => guest.id !== guestId),
      tables: prev.tables.map((table) => ({ ...table, guestIds: table.guestIds.filter((id) => id !== guestId) }))
    }));
  }

  function addTable(table) {
    mutateData((prev) => {
      const count = prev.tables.length;
      const safeCapacity = Math.max(1, Math.round(Number(table.capacity) || 8));
      const nextTable = {
        ...table,
        name: String(table.name || "").trim() || `Table ${count + 1}`,
        capacity: safeCapacity,
        guestIds: [],
        id: uid("table"),
        shape: table.shape === "rect" ? "rect" : "round",
        x: Number.isFinite(Number(table.x)) ? Number(table.x) : 20 + (count % 4) * 20,
        y: Number.isFinite(Number(table.y)) ? Number(table.y) : 25 + Math.floor(count / 4) * 22
      };
      return { ...prev, tables: [...prev.tables, nextTable] };
    });
  }

  function patchTable(tableId, patch) {
    mutateData((prev) => {
      const validGuestIds = new Set(prev.guests.map((guest) => guest.id));
      const targetTable = prev.tables.find((table) => table.id === tableId);
      if (!targetTable) {
        return prev;
      }

      const safeCapacity =
        patch.capacity === undefined
          ? targetTable.capacity
          : Math.max(1, Math.round(Number(patch.capacity) || targetTable.capacity));

      const requestedGuestIds = Array.isArray(patch.guestIds)
        ? [...new Set(patch.guestIds.map((id) => String(id)).filter((id) => validGuestIds.has(id)))]
        : null;
      const nextGuestIds = requestedGuestIds ? requestedGuestIds.slice(0, safeCapacity) : null;

      return {
        ...prev,
        tables: prev.tables.map((table) => {
          if (table.id !== tableId) {
            if (!nextGuestIds) {
              return table;
            }
            return { ...table, guestIds: table.guestIds.filter((id) => !nextGuestIds.includes(id)) };
          }

          const finalGuestIds = (nextGuestIds || table.guestIds).slice(0, safeCapacity);

          return {
            ...table,
            ...patch,
            name: patch.name === undefined ? table.name : String(patch.name ?? ""),
            capacity: safeCapacity,
            x:
              patch.x === undefined
                ? table.x
                : Number.isFinite(Number(patch.x))
                  ? Math.max(6, Math.min(94, Number(patch.x)))
                  : table.x,
            y:
              patch.y === undefined
                ? table.y
                : Number.isFinite(Number(patch.y))
                  ? Math.max(8, Math.min(92, Number(patch.y)))
                  : table.y,
            guestIds: finalGuestIds
          };
        })
      };
    });
  }

  function deleteTable(tableId) {
    mutateData((prev) => ({ ...prev, tables: prev.tables.filter((table) => table.id !== tableId) }));
  }

  function addTask(task) {
    mutateData((prev) => ({
      ...prev,
      tasks: [...prev.tasks, { ...task, title: String(task.title || "").trim() || "Untitled task", id: uid("task") }]
    }));
  }

  function patchTask(taskId, patch) {
    mutateData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task))
    }));
  }

  function deleteTask(taskId) {
    mutateData((prev) => ({ ...prev, tasks: prev.tasks.filter((task) => task.id !== taskId) }));
  }

  function addBudgetItem(item) {
    mutateData((prev) => ({
      ...prev,
      budget: [...prev.budget, { ...item, title: String(item.title || "").trim() || "Untitled item", id: uid("budget") }]
    }));
  }

  function patchBudgetItem(itemId, patch) {
    mutateData((prev) => ({
      ...prev,
      budget: prev.budget.map((item) => (item.id === itemId ? { ...item, ...patch } : item))
    }));
  }

  function deleteBudgetItem(itemId) {
    mutateData((prev) => ({ ...prev, budget: prev.budget.filter((item) => item.id !== itemId) }));
  }

  function addVendor(vendor) {
    mutateData((prev) => ({
      ...prev,
      vendors: [...prev.vendors, { ...vendor, name: String(vendor.name || "").trim() || "Unnamed vendor", id: uid("vendor") }]
    }));
  }

  function patchVendor(vendorId, patch) {
    mutateData((prev) => ({
      ...prev,
      vendors: prev.vendors.map((vendor) => (vendor.id === vendorId ? { ...vendor, ...patch } : vendor))
    }));
  }

  function deleteVendor(vendorId) {
    mutateData((prev) => ({ ...prev, vendors: prev.vendors.filter((vendor) => vendor.id !== vendorId) }));
  }

  function applyJson(text) {
    try {
      const parsed = JSON.parse(text);
      mutateData(() => normalizeData(parsed));
    } catch (_error) {
      window.alert("Invalid JSON. Please fix syntax and try again.");
    }
  }

  function resetAllData() {
    const confirmed = window.confirm("Reset all wedding data?");
    if (!confirmed) {
      return;
    }
    mutateData(() => getDefaultData());
  }

  function collapseAllSections() {
    setCollapseSignal((prev) => ({ mode: "collapse", seq: prev.seq + 1 }));
  }

  function expandAllSections() {
    setCollapseSignal((prev) => ({ mode: "expand", seq: prev.seq + 1 }));
  }

  async function refreshFromServer() {
    if (!workspaceId) {
      return;
    }
    try {
      const result = await refreshWedding(workspaceId);
      applyServerState(result.data, result.updatedAt || "");
      setStatusMessage("Workspace refreshed.");
    } catch (error) {
      setStatusMessage(error?.message || "Refresh failed.");
    }
  }

  async function handleInvite(email) {
    if (!workspaceId || !user) {
      return;
    }
    try {
      await inviteMember({ weddingId: workspaceId, email, invitedByUserId: user.id });
      await loadMembers();
      setStatusMessage("Invite created.");
    } catch (error) {
      setStatusMessage(error?.message || "Invite failed.");
    }
  }

  async function handleRemove(memberId) {
    try {
      await removeMember(memberId);
      await loadMembers();
      setStatusMessage("Member removed.");
    } catch (error) {
      setStatusMessage(error?.message || "Remove failed.");
    }
  }

  function getSyncLabel() {
    if (syncState === "saving") {
      return "Saving...";
    }
    if (syncState === "saved") {
      return "Saved";
    }
    if (syncState === "dirty") {
      return "Unsaved changes";
    }
    if (syncState === "error") {
      return "Save error";
    }
    return "";
  }

  if (!authLoading && !user) {
    return <AuthPanel />;
  }

  if (authLoading || workspaceLoading) {
    return (
      <main className="page">
        <section className="card section">
          <h1>Loading workspace...</h1>
          <p className="muted">Connecting to backend.</p>
        </section>
      </main>
    );
  }

  if (appError) {
    return (
      <main className="page">
        <section className="card section">
          <h1>Could not load workspace</h1>
          <p className="muted">{appError}</p>
          <div className="row-actions">
            <button className="btn" type="button" onClick={loadWorkspace}>
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

  return (
    <main className="page">
      <Header meta={data.meta} onMetaChange={patchMeta} stats={stats} />

      <div className="global-actions">
        <button className="btn" type="button" onClick={expandAllSections}>
          Open All
        </button>
        <button className="btn" type="button" onClick={collapseAllSections}>
          Collapse All
        </button>
        <button className="btn secondary" type="button" onClick={refreshFromServer}>
          Refresh
        </button>
        <button className="btn secondary" type="button" onClick={signOut}>
          Sign Out
        </button>
      </div>

      <p className="muted sync-label">{getSyncLabel()} {statusMessage ? `• ${statusMessage}` : ""}</p>

      <div className="stack">
        <CollaboratorsSection
          role={workspaceRole}
          userEmail={user?.email}
          members={members}
          loading={membersLoading}
          onInvite={handleInvite}
          onRemove={handleRemove}
          collapseSignal={collapseSignal}
          statusMessage={statusMessage}
        />
        <TasksSection tasks={data.tasks} onAddTask={addTask} onPatchTask={patchTask} onDeleteTask={deleteTask} collapseSignal={collapseSignal} />
        <VendorsSection
          vendors={data.vendors}
          currency="ILS"
          onAddVendor={addVendor}
          onPatchVendor={patchVendor}
          onDeleteVendor={deleteVendor}
          collapseSignal={collapseSignal}
        />
        <GuestsSection
          guests={data.guests}
          meta={data.meta}
          onAddGuest={addGuest}
          onPatchGuest={patchGuest}
          onDeleteGuest={deleteGuest}
          collapseSignal={collapseSignal}
        />
        <BudgetSection
          budget={data.budget}
          currency="ILS"
          onAddItem={addBudgetItem}
          onPatchItem={patchBudgetItem}
          onDeleteItem={deleteBudgetItem}
          collapseSignal={collapseSignal}
        />
        <TablesSection
          tables={data.tables}
          guests={data.guests}
          onAddTable={addTable}
          onPatchTable={patchTable}
          onDeleteTable={deleteTable}
          collapseSignal={collapseSignal}
        />
        <JsonSection
          data={data}
          onApplyJson={applyJson}
          onResetData={resetAllData}
          onExportJson={() => downloadJson(data)}
          collapseSignal={collapseSignal}
        />
      </div>
    </main>
  );
}
