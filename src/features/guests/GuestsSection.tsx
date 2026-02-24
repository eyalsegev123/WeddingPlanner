import React, { useMemo, useState } from "react";

import CollapsibleSection from "../../shared/components/CollapsibleSection";
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

const initialGuest: Omit<Guest, "id"> = {
  name: "",
  side: "",
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

  const sideOneLabel = meta.sideOneLabel || meta.partnerOne || "Partner 1 Side";
  const sideTwoLabel = meta.sideTwoLabel || meta.partnerTwo || "Partner 2 Side";
  const sideOneKeys = [sideOneLabel, meta.partnerOne].filter(Boolean).map((v) => v.toLowerCase());
  const sideTwoKeys = [sideTwoLabel, meta.partnerTwo].filter(Boolean).map((v) => v.toLowerCase());

  const grouped = useMemo(() => {
    const sideOne = guests.filter((g) => sideOneKeys.includes(g.side.toLowerCase()));
    const sideTwo = guests.filter((g) => sideTwoKeys.includes(g.side.toLowerCase()));
    const other = guests.filter((g) => {
      const side = g.side.toLowerCase();
      return !sideOneKeys.includes(side) && !sideTwoKeys.includes(side);
    });
    return { sideOne, sideTwo, other };
  }, [guests, sideOneKeys, sideTwoKeys]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    onAddGuest(form);
    setForm(initialGuest);
  }

  function renderGuestRows(items: Guest[]) {
    return items.map((guest) => (
      <div key={guest.id} className="row">
        <div>
          <strong>{guest.name}</strong>
          <p className="muted">{guest.side || "Unassigned side"}</p>
          <p className="muted">
            {guest.phone || "No phone"} • {guest.email || "No email"}
          </p>
          <p className="muted">{guest.notes || "No notes"}</p>
        </div>
        <div className="row-actions">
          <select
            value={guest.rsvp}
            onChange={(e) => onPatchGuest(guest.id, { rsvp: e.target.value as RsvpStatus })}
          >
            {RSVP_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button className="btn danger" type="button" onClick={() => onDeleteGuest(guest.id)}>
            Delete
          </button>
        </div>
      </div>
    ));
  }

  return (
    <CollapsibleSection title="Guests" collapseSignal={collapseSignal}>
      <form className="form-grid" onSubmit={submit}>
        <input
          placeholder="Guest name"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
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
          {RSVP_STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <input
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
        />
        <button className="btn" type="submit">
          Add Guest
        </button>
      </form>

      <div className="columns-3">
        <div>
          <h3>{sideOneLabel}</h3>
          {renderGuestRows(grouped.sideOne)}
        </div>
        <div>
          <h3>{sideTwoLabel}</h3>
          {renderGuestRows(grouped.sideTwo)}
        </div>
        <div>
          <h3>Other / Unassigned</h3>
          {renderGuestRows(grouped.other)}
        </div>
      </div>
    </CollapsibleSection>
  );
}
