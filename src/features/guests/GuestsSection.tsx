import React, { useMemo, useState } from "react";

import CollapsibleSection from "../../shared/components/CollapsibleSection";
import DataTable, { ColumnDef, SortDir } from "../../shared/components/DataTable";
import { RSVP_STATUSES } from "../../constants/enums";
import type { CollapseSignal, Guest, RsvpStatus, WeddingMeta } from "../../types/wedding";

interface Props {
  guests: Guest[];
  meta: WeddingMeta;
  onAddGuest: (guest: Omit<Guest, "id">) => void;
  onPatchGuest: (id: string, patch: Partial<Guest>) => void;
  onDeleteGuest: (id: string) => void;
  collapseSignal?: CollapseSignal;
}

const RSVP_BG: Record<RsvpStatus, string> = {
  Pending: "#f5f0ff",
  Yes: "#e5f7f0",
  No: "#fde8e8",
};

const initialGuest: Omit<Guest, "id"> = {
  name: "",
  side: "",
  relationship: "",
  phone: "",
  email: "",
  rsvp: "Pending",
  notes: "",
};

export default function GuestsSection({
  guests,
  meta,
  onAddGuest,
  onPatchGuest,
  onDeleteGuest,
  collapseSignal,
}: Props) {
  const [form, setForm] = useState(initialGuest);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sideOneLabel = meta.sideOneLabel || meta.partnerOne || "Partner 1 Side";
  const sideTwoLabel = meta.sideTwoLabel || meta.partnerTwo || "Partner 2 Side";

  function handleSort(key: string) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const sortedGuests = useMemo(() => {
    if (!sortKey) return guests;
    return [...guests].sort((a, b) => {
      const av = String((a as unknown as Record<string, unknown>)[sortKey] ?? "");
      const bv = String((b as unknown as Record<string, unknown>)[sortKey] ?? "");
      const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: "base" });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [guests, sortKey, sortDir]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    onAddGuest(form);
    setForm(initialGuest);
  }

  const columns: ColumnDef<Guest>[] = [
    {
      key: "name",
      label: "Guest Name",
      sortable: true,
      width: "180px",
      render: (g) => (
        <input
          className="cell-input"
          value={g.name}
          onChange={(e) => onPatchGuest(g.id, { name: e.target.value })}
        />
      ),
    },
    {
      key: "relationship",
      label: "Relationship",
      sortable: true,
      width: "160px",
      render: (g) => (
        <input
          className="cell-input"
          placeholder="e.g. Eyal's friends"
          value={g.relationship}
          onChange={(e) => onPatchGuest(g.id, { relationship: e.target.value })}
        />
      ),
    },
    {
      key: "side",
      label: "Side",
      sortable: true,
      width: "130px",
      render: (g) => (
        <select
          className="cell-select"
          value={g.side}
          onChange={(e) => onPatchGuest(g.id, { side: e.target.value })}
        >
          <option value="">—</option>
          <option value={sideOneLabel}>{sideOneLabel}</option>
          <option value={sideTwoLabel}>{sideTwoLabel}</option>
        </select>
      ),
    },
    {
      key: "rsvp",
      label: "RSVP",
      sortable: true,
      width: "110px",
      render: (g) => (
        <select
          className="cell-select"
          value={g.rsvp}
          style={{ background: RSVP_BG[g.rsvp], borderRadius: "999px", paddingLeft: "0.6rem" }}
          onChange={(e) => onPatchGuest(g.id, { rsvp: e.target.value as RsvpStatus })}
        >
          {RSVP_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      width: "140px",
      render: (g) => (
        <input
          className="cell-input"
          placeholder="Phone"
          value={g.phone}
          onChange={(e) => onPatchGuest(g.id, { phone: e.target.value })}
        />
      ),
    },
    {
      key: "email",
      label: "Email",
      width: "190px",
      render: (g) => (
        <input
          type="email"
          className="cell-input"
          placeholder="Email"
          value={g.email}
          onChange={(e) => onPatchGuest(g.id, { email: e.target.value })}
        />
      ),
    },
    {
      key: "notes",
      label: "Notes",
      render: (g) => (
        <input
          className="cell-input"
          placeholder="Notes"
          value={g.notes}
          onChange={(e) => onPatchGuest(g.id, { notes: e.target.value })}
        />
      ),
    },
    {
      key: "_actions",
      label: "",
      width: "90px",
      render: (g) => (
        <button className="btn danger" type="button" onClick={() => onDeleteGuest(g.id)}>
          Delete
        </button>
      ),
    },
  ];

  return (
    <CollapsibleSection title="Guests" collapseSignal={collapseSignal}>
      <form className="form-grid" onSubmit={submit}>
        <input
          placeholder="Guest name"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
        />
        <input
          placeholder="Relationship (e.g. Eyal's friends)"
          value={form.relationship}
          onChange={(e) => setForm((prev) => ({ ...prev, relationship: e.target.value }))}
        />
        <select
          value={form.side}
          onChange={(e) => setForm((prev) => ({ ...prev, side: e.target.value }))}
        >
          <option value="">Side</option>
          <option value={sideOneLabel}>{sideOneLabel}</option>
          <option value={sideTwoLabel}>{sideTwoLabel}</option>
        </select>
        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
        />
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
        />
        <select
          value={form.rsvp}
          onChange={(e) => setForm((prev) => ({ ...prev, rsvp: e.target.value as RsvpStatus }))}
        >
          {RSVP_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <input
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
        />
        <button className="btn" type="submit">Add Guest</button>
      </form>

      <DataTable
        columns={columns}
        rows={sortedGuests}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        getRowKey={(g) => g.id}
        emptyText="No guests yet. Add one above."
      />
    </CollapsibleSection>
  );
}
