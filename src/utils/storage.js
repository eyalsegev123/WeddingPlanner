import defaultData from "../data/defaultWeddingData.json";

const TASK_STATUSES = new Set(["Open", "In Progress", "Blocked", "Done"]);
const TASK_PRIORITIES = new Set(["Low", "Medium", "High"]);
const RSVP_STATUSES = new Set(["Pending", "Yes", "No"]);
const VENDOR_STATUSES = new Set(["Researching", "Shortlisted", "Booked"]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function createId(prefix, index) {
  const randomPart =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${index}-${randomPart}`;
}

function ensureUniqueIds(items, prefix) {
  const seen = new Set();
  return items.map((item, index) => {
    let id = String(item?.id || "").trim();
    if (!id || seen.has(id)) {
      id = createId(prefix, index);
    }
    seen.add(id);
    return { ...item, id };
  });
}

function asNumber(value, fallback, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, number));
}

export function normalizeData(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const metaSource = source.meta && typeof source.meta === "object" ? source.meta : {};
  const legacyCouple = String(metaSource.couple || "").split("&").map((part) => part.trim());
  const partnerOne = String(metaSource.partnerOne || legacyCouple[0] || defaultData.meta.partnerOne);
  const partnerTwo = String(metaSource.partnerTwo || legacyCouple[1] || defaultData.meta.partnerTwo);

  const guests = ensureUniqueIds(
    asArray(source.guests).map((guest) => ({
      id: String(guest?.id || ""),
      name: String(guest?.name || ""),
      side: String(guest?.side || ""),
      phone: String(guest?.phone || ""),
      email: String(guest?.email || ""),
      rsvp: RSVP_STATUSES.has(String(guest?.rsvp || "")) ? String(guest.rsvp) : "Pending",
      notes: String(guest?.notes || "")
    })),
    "guest"
  );

  const guestIdSet = new Set(guests.map((guest) => guest.id));
  const seatedGuestIds = new Set();
  const tables = ensureUniqueIds(
    asArray(source.tables).map((table) => {
      const cleanedGuestIds = [...new Set(asArray(table?.guestIds).map((id) => String(id)).filter((id) => guestIdSet.has(id)))].filter((id) => {
        if (seatedGuestIds.has(id)) {
          return false;
        }
        seatedGuestIds.add(id);
        return true;
      });

      return {
        id: String(table?.id || ""),
        name: String(table?.name || ""),
        capacity: Math.round(asNumber(table?.capacity, 8, { min: 1, max: 30 })),
        guestIds: cleanedGuestIds,
        shape: table?.shape === "rect" ? "rect" : "round",
        x: asNumber(table?.x, 50, { min: 6, max: 94 }),
        y: asNumber(table?.y, 50, { min: 8, max: 92 })
      };
    }),
    "table"
  );

  const tasks = ensureUniqueIds(
    asArray(source.tasks).map((task) => ({
      id: String(task?.id || ""),
      title: String(task?.title || ""),
      status: TASK_STATUSES.has(String(task?.status || "")) ? String(task.status) : "Open",
      priority: TASK_PRIORITIES.has(String(task?.priority || "")) ? String(task.priority) : "Medium",
      dueDate: String(task?.dueDate || ""),
      owner: String(task?.owner || ""),
      notes: String(task?.notes || "")
    })),
    "task"
  );

  const budget = ensureUniqueIds(
    asArray(source.budget).map((item) => ({
      id: String(item?.id || ""),
      title: String(item?.title || ""),
      category: String(item?.category || "Other"),
      amount: asNumber(item?.amount, 0, { min: 0 }),
      dueDate: String(item?.dueDate || ""),
      paid: Boolean(item?.paid),
      notes: String(item?.notes || "")
    })),
    "budget"
  );

  const vendors = ensureUniqueIds(
    asArray(source.vendors).map((vendor) => ({
      id: String(vendor?.id || ""),
      name: String(vendor?.name || ""),
      category: String(vendor?.category || "Other"),
      contactName: String(vendor?.contactName || ""),
      phone: String(vendor?.phone || ""),
      email: String(vendor?.email || ""),
      quote: asNumber(vendor?.quote, 0, { min: 0 }),
      status: VENDOR_STATUSES.has(String(vendor?.status || "")) ? String(vendor.status) : "Researching",
      lastContact: String(vendor?.lastContact || ""),
      nextStep: String(vendor?.nextStep || ""),
      notes: String(vendor?.notes || "")
    })),
    "vendor"
  );

  return {
    meta: {
      title: String(metaSource.title || defaultData.meta.title || "Wedding Planner"),
      plannerName: String(metaSource.plannerName || defaultData.meta.plannerName || ""),
      partnerOne,
      partnerTwo,
      sideOneLabel: String(metaSource.sideOneLabel || defaultData.meta.sideOneLabel || `${partnerOne} Side`),
      sideTwoLabel: String(metaSource.sideTwoLabel || defaultData.meta.sideTwoLabel || `${partnerTwo} Side`),
      weddingDate: String(metaSource.weddingDate || ""),
      venue: String(metaSource.venue || ""),
      currency: "ILS"
    },
    guests,
    tables,
    tasks,
    budget,
    vendors
  };
}

export function getDefaultData() {
  return normalizeData(defaultData);
}

export function downloadJson(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "wedding-data.json";
  link.click();
  URL.revokeObjectURL(url);
}
