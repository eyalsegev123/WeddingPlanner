import { useMemo, useState } from "react";

import type {
  BudgetItem,
  Guest,
  Task,
  Vendor,
  WeddingData,
  WeddingMeta,
  WeddingStats,
  WeddingTable,
} from "../types/wedding";
import { createId, getDefaultData, normalizeData } from "../utils/storage";

export interface WeddingDataHook {
  data: WeddingData;
  hasPendingSave: boolean;
  stats: WeddingStats;
  applyServerState: (nextData: WeddingData) => void;
  clearPendingSave: () => void;
  patchMeta: (key: keyof WeddingMeta, value: string) => void;
  addGuest: (guest: Omit<Guest, "id">) => void;
  patchGuest: (id: string, patch: Partial<Guest>) => void;
  deleteGuest: (id: string) => void;
  addTask: (task: Omit<Task, "id">) => void;
  patchTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addBudgetItem: (item: Omit<BudgetItem, "id">) => void;
  patchBudgetItem: (id: string, patch: Partial<BudgetItem>) => void;
  deleteBudgetItem: (id: string) => void;
  addVendor: (vendor: Omit<Vendor, "id">) => void;
  patchVendor: (id: string, patch: Partial<Vendor>) => void;
  deleteVendor: (id: string) => void;
  addTable: (table: Omit<WeddingTable, "id">) => void;
  patchTable: (id: string, patch: Partial<WeddingTable>) => void;
  deleteTable: (id: string) => void;
  applyJson: (text: string) => { error: string | null };
  resetAllData: (confirmed: boolean) => void;
}

export function useWeddingData(): WeddingDataHook {
  const [data, setData] = useState<WeddingData>(() => getDefaultData());
  const [hasPendingSave, setHasPendingSave] = useState(false);

  function mutateData(updater: (prev: WeddingData) => WeddingData): void {
    setData((prev) => normalizeData(updater(prev)));
    setHasPendingSave(true);
  }

  function applyServerState(nextData: WeddingData): void {
    setData(normalizeData(nextData));
    setHasPendingSave(false);
  }

  function clearPendingSave(): void {
    setHasPendingSave(false);
  }

  const stats = useMemo<WeddingStats>(() => {
    const totalGuests = data.guests.length;
    const confirmedGuests = data.guests.filter((g) => g.rsvp === "Yes").length;
    const totalTables = data.tables.length;
    const totalCapacity = data.tables.reduce((sum, t) => sum + Math.max(0, t.capacity), 0);
    const seatedGuests = new Set(data.tables.flatMap((t) => t.guestIds)).size;
    const openTasks = data.tasks.filter((t) => t.status !== "Done").length;
    const doneTasks = data.tasks.filter((t) => t.status === "Done").length;
    const tasksCompletion = data.tasks.length
      ? Math.round((doneTasks / data.tasks.length) * 100)
      : 0;
    const rsvpCompletion = totalGuests
      ? Math.round((confirmedGuests / totalGuests) * 100)
      : 0;
    const budgetPlanned = data.budget.reduce((sum, item) => sum + item.amount, 0);
    const budgetPaid = data.budget
      .filter((item) => item.paid)
      .reduce((sum, item) => sum + item.amount, 0);
    const shortlistedVendors = data.vendors.filter((v) => v.status === "Shortlisted").length;
    const bookedVendors = data.vendors.filter((v) => v.status === "Booked").length;
    const activeDate = data.meta.weddingDate
      ? new Date(`${data.meta.weddingDate}T00:00:00`)
      : null;
    const today = new Date();
    const todayAtStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const daysToWedding = activeDate
      ? Math.ceil((activeDate.getTime() - todayAtStart.getTime()) / 86400000)
      : null;

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
      currency: data.meta.currency,
      shortlistedVendors,
      bookedVendors,
      daysToWedding,
    };
  }, [data]);

  function patchMeta(key: keyof WeddingMeta, value: string): void {
    mutateData((prev) => ({ ...prev, meta: { ...prev.meta, [key]: value } }));
  }

  function addGuest(guest: Omit<Guest, "id">): void {
    mutateData((prev) => ({
      ...prev,
      guests: [
        ...prev.guests,
        {
          ...guest,
          name: String(guest.name ?? "").trim() || "Unnamed guest",
          id: createId("guest"),
        },
      ],
    }));
  }

  function patchGuest(guestId: string, patch: Partial<Guest>): void {
    mutateData((prev) => ({
      ...prev,
      guests: prev.guests.map((g) => (g.id === guestId ? { ...g, ...patch } : g)),
    }));
  }

  function deleteGuest(guestId: string): void {
    mutateData((prev) => ({
      ...prev,
      guests: prev.guests.filter((g) => g.id !== guestId),
      tables: prev.tables.map((t) => ({
        ...t,
        guestIds: t.guestIds.filter((id) => id !== guestId),
      })),
    }));
  }

  function addTask(task: Omit<Task, "id">): void {
    mutateData((prev) => ({
      ...prev,
      tasks: [
        ...prev.tasks,
        {
          ...task,
          title: String(task.title ?? "").trim() || "Untitled task",
          id: createId("task"),
        },
      ],
    }));
  }

  function patchTask(taskId: string, patch: Partial<Task>): void {
    mutateData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
    }));
  }

  function deleteTask(taskId: string): void {
    mutateData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
    }));
  }

  function addBudgetItem(item: Omit<BudgetItem, "id">): void {
    mutateData((prev) => ({
      ...prev,
      budget: [
        ...prev.budget,
        {
          ...item,
          title: String(item.title ?? "").trim() || "Untitled item",
          id: createId("budget"),
        },
      ],
    }));
  }

  function patchBudgetItem(itemId: string, patch: Partial<BudgetItem>): void {
    mutateData((prev) => ({
      ...prev,
      budget: prev.budget.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
    }));
  }

  function deleteBudgetItem(itemId: string): void {
    mutateData((prev) => ({
      ...prev,
      budget: prev.budget.filter((item) => item.id !== itemId),
    }));
  }

  function addVendor(vendor: Omit<Vendor, "id">): void {
    mutateData((prev) => ({
      ...prev,
      vendors: [
        ...prev.vendors,
        {
          ...vendor,
          name: String(vendor.name ?? "").trim() || "Unnamed vendor",
          id: createId("vendor"),
        },
      ],
    }));
  }

  function patchVendor(vendorId: string, patch: Partial<Vendor>): void {
    mutateData((prev) => ({
      ...prev,
      vendors: prev.vendors.map((v) => (v.id === vendorId ? { ...v, ...patch } : v)),
    }));
  }

  function deleteVendor(vendorId: string): void {
    mutateData((prev) => ({
      ...prev,
      vendors: prev.vendors.filter((v) => v.id !== vendorId),
    }));
  }

  function addTable(table: Omit<WeddingTable, "id">): void {
    mutateData((prev) => {
      const count = prev.tables.length;
      const safeCapacity = Math.max(1, Math.round(Number(table.capacity) || 8));
      const newTable: WeddingTable = {
        ...table,
        name: String(table.name ?? "").trim() || `Table ${count + 1}`,
        capacity: safeCapacity,
        guestIds: [],
        id: createId("table"),
        shape: table.shape === "rect" ? "rect" : "round",
        x: Number.isFinite(table.x) ? table.x : 20 + (count % 4) * 20,
        y: Number.isFinite(table.y) ? table.y : 25 + Math.floor(count / 4) * 22,
      };
      return { ...prev, tables: [...prev.tables, newTable] };
    });
  }

  function patchTable(tableId: string, patch: Partial<WeddingTable>): void {
    mutateData((prev) => {
      const validGuestIds = new Set(prev.guests.map((g) => g.id));
      const target = prev.tables.find((t) => t.id === tableId);
      if (!target) return prev;

      const safeCapacity =
        patch.capacity === undefined
          ? target.capacity
          : Math.max(1, Math.round(Number(patch.capacity) || target.capacity));

      const requestedGuestIds = Array.isArray(patch.guestIds)
        ? [...new Set(patch.guestIds.filter((id) => validGuestIds.has(id)))]
        : null;
      const nextGuestIds = requestedGuestIds
        ? requestedGuestIds.slice(0, safeCapacity)
        : null;

      return {
        ...prev,
        tables: prev.tables.map((table) => {
          if (table.id !== tableId) {
            if (!nextGuestIds) return table;
            return {
              ...table,
              guestIds: table.guestIds.filter((id) => !nextGuestIds.includes(id)),
            };
          }

          const finalGuestIds = (nextGuestIds ?? table.guestIds).slice(0, safeCapacity);

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
            guestIds: finalGuestIds,
          };
        }),
      };
    });
  }

  function deleteTable(tableId: string): void {
    mutateData((prev) => ({
      ...prev,
      tables: prev.tables.filter((t) => t.id !== tableId),
    }));
  }

  function applyJson(text: string): { error: string | null } {
    try {
      const parsed: unknown = JSON.parse(text);
      mutateData(() => normalizeData(parsed));
      return { error: null };
    } catch {
      return { error: "Invalid JSON. Please fix syntax and try again." };
    }
  }

  function resetAllData(confirmed: boolean): void {
    if (!confirmed) return;
    mutateData(() => getDefaultData());
  }

  return {
    data,
    hasPendingSave,
    stats,
    applyServerState,
    clearPendingSave,
    patchMeta,
    addGuest,
    patchGuest,
    deleteGuest,
    addTask,
    patchTask,
    deleteTask,
    addBudgetItem,
    patchBudgetItem,
    deleteBudgetItem,
    addVendor,
    patchVendor,
    deleteVendor,
    addTable,
    patchTable,
    deleteTable,
    applyJson,
    resetAllData,
  };
}
