import {
  RSVP_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  VENDOR_STATUSES,
} from "../constants/enums";
import defaultData from "../data/defaultWeddingData.json";
import type {
  BudgetItem,
  Guest,
  RsvpStatus,
  Task,
  TaskPriority,
  TaskStatus,
  Vendor,
  VendorStatus,
  WeddingData,
  WeddingMeta,
  WeddingTable,
} from "../types/wedding";

const TASK_STATUS_SET = new Set<string>(TASK_STATUSES);
const TASK_PRIORITY_SET = new Set<string>(TASK_PRIORITIES);
const RSVP_STATUS_SET = new Set<string>(RSVP_STATUSES);
const VENDOR_STATUS_SET = new Set<string>(VENDOR_STATUSES);

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function createId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}

function ensureUniqueIds<T extends { id: string }>(items: T[], prefix: string): T[] {
  const seen = new Set<string>();
  return items.map((item) => {
    let id = String(item?.id ?? "").trim();
    if (!id || seen.has(id)) {
      id = createId(prefix);
    }
    seen.add(id);
    return { ...item, id };
  });
}

function asNumber(
  value: unknown,
  fallback: number,
  { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = {},
): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

export function normalizeData(raw: unknown): WeddingData {
  const source = asRecord(raw);
  const metaSource = asRecord(source.meta);

  const legacyCouple = String(metaSource.couple ?? "")
    .split("&")
    .map((p) => p.trim());
  const partnerOne = String(
    metaSource.partnerOne ?? legacyCouple[0] ?? defaultData.meta.partnerOne,
  );
  const partnerTwo = String(
    metaSource.partnerTwo ?? legacyCouple[1] ?? defaultData.meta.partnerTwo,
  );

  const meta: WeddingMeta = {
    title: String(metaSource.title ?? defaultData.meta.title ?? "Wedding Planner"),
    plannerName: String(metaSource.plannerName ?? defaultData.meta.plannerName ?? ""),
    partnerOne,
    partnerTwo,
    sideOneLabel: String(
      metaSource.sideOneLabel ?? defaultData.meta.sideOneLabel ?? `${partnerOne} Side`,
    ),
    sideTwoLabel: String(
      metaSource.sideTwoLabel ?? defaultData.meta.sideTwoLabel ?? `${partnerTwo} Side`,
    ),
    weddingDate: String(metaSource.weddingDate ?? ""),
    venue: String(metaSource.venue ?? ""),
    currency: String(metaSource.currency ?? "ILS"),
  };

  const guests: Guest[] = ensureUniqueIds(
    asArray<Record<string, unknown>>(source.guests).map((g) => ({
      id: String(g?.id ?? ""),
      name: String(g?.name ?? ""),
      side: String(g?.side ?? ""),
      phone: String(g?.phone ?? ""),
      email: String(g?.email ?? ""),
      rsvp: RSVP_STATUS_SET.has(String(g?.rsvp ?? ""))
        ? (String(g.rsvp) as RsvpStatus)
        : "Pending",
      notes: String(g?.notes ?? ""),
    })),
    "guest",
  );

  const guestIdSet = new Set(guests.map((g) => g.id));
  const seatedGuestIds = new Set<string>();

  const tables: WeddingTable[] = ensureUniqueIds(
    asArray<Record<string, unknown>>(source.tables).map((t) => {
      const cleanedGuestIds = [
        ...new Set(
          asArray<unknown>(t?.guestIds)
            .map((id) => String(id))
            .filter((id) => guestIdSet.has(id)),
        ),
      ].filter((id) => {
        if (seatedGuestIds.has(id)) return false;
        seatedGuestIds.add(id);
        return true;
      });

      return {
        id: String(t?.id ?? ""),
        name: String(t?.name ?? ""),
        capacity: Math.round(asNumber(t?.capacity, 8, { min: 1, max: 30 })),
        guestIds: cleanedGuestIds,
        shape: t?.shape === "rect" ? "rect" : "round",
        x: asNumber(t?.x, 50, { min: 6, max: 94 }),
        y: asNumber(t?.y, 50, { min: 8, max: 92 }),
      };
    }),
    "table",
  );

  const tasks: Task[] = ensureUniqueIds(
    asArray<Record<string, unknown>>(source.tasks).map((t) => ({
      id: String(t?.id ?? ""),
      title: String(t?.title ?? ""),
      status: TASK_STATUS_SET.has(String(t?.status ?? ""))
        ? (String(t.status) as TaskStatus)
        : "Open",
      priority: TASK_PRIORITY_SET.has(String(t?.priority ?? ""))
        ? (String(t.priority) as TaskPriority)
        : "Medium",
      dueDate: String(t?.dueDate ?? ""),
      owner: String(t?.owner ?? ""),
      notes: String(t?.notes ?? ""),
    })),
    "task",
  );

  const budget: BudgetItem[] = ensureUniqueIds(
    asArray<Record<string, unknown>>(source.budget).map((item) => ({
      id: String(item?.id ?? ""),
      title: String(item?.title ?? ""),
      category: String(item?.category ?? "Other"),
      amount: asNumber(item?.amount, 0, { min: 0 }),
      dueDate: String(item?.dueDate ?? ""),
      paid: Boolean(item?.paid),
      notes: String(item?.notes ?? ""),
    })),
    "budget",
  );

  const vendors: Vendor[] = ensureUniqueIds(
    asArray<Record<string, unknown>>(source.vendors).map((v) => ({
      id: String(v?.id ?? ""),
      name: String(v?.name ?? ""),
      category: String(v?.category ?? "Other"),
      contactName: String(v?.contactName ?? ""),
      phone: String(v?.phone ?? ""),
      email: String(v?.email ?? ""),
      quote: asNumber(v?.quote, 0, { min: 0 }),
      status: VENDOR_STATUS_SET.has(String(v?.status ?? ""))
        ? (String(v.status) as VendorStatus)
        : "Researching",
      lastContact: String(v?.lastContact ?? ""),
      nextStep: String(v?.nextStep ?? ""),
      notes: String(v?.notes ?? ""),
    })),
    "vendor",
  );

  return { meta, guests, tables, tasks, budget, vendors };
}

export function getDefaultData(): WeddingData {
  return normalizeData(defaultData);
}

export function downloadJson(data: WeddingData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "wedding-data.json";
  link.click();
  URL.revokeObjectURL(url);
}
