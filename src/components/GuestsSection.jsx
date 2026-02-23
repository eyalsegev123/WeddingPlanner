import React, { useMemo, useState } from "react";
import CollapsibleSection from "./CollapsibleSection";

const initialGuest = {
  name: "",
  side: "",
  phone: "",
  email: "",
  rsvp: "Pending",
  notes: ""
};

export default function GuestsSection({ guests, meta, onAddGuest, onDeleteGuest, onPatchGuest, collapseSignal }) {
  const [form, setForm] = useState(initialGuest);
  const sideOneLabel = meta?.sideOneLabel || meta?.partnerOne || "Partner 1 Side";
  const sideTwoLabel = meta?.sideTwoLabel || meta?.partnerTwo || "Partner 2 Side";
  const sideOneKeys = [sideOneLabel, meta?.partnerOne].filter(Boolean).map((value) => value.toLowerCase());
  const sideTwoKeys = [sideTwoLabel, meta?.partnerTwo].filter(Boolean).map((value) => value.toLowerCase());

  const grouped = useMemo(() => {
    const sideOne = guests.filter((guest) => sideOneKeys.includes(guest.side.toLowerCase()));
    const sideTwo = guests.filter((guest) => sideTwoKeys.includes(guest.side.toLowerCase()));
    const other = guests.filter((guest) => {
      const side = guest.side.toLowerCase();
      return !sideOneKeys.includes(side) && !sideTwoKeys.includes(side);
    });
    return { sideOne, sideTwo, other };
  }, [guests, sideOneKeys, sideTwoKeys]);

  function submit(event) {
    event.preventDefault();
    onAddGuest(form);
    setForm(initialGuest);
  }

  function renderGuestRows(items) {
    return items.map((guest) => (
      <div key={guest.id} className="row">
        <div>
          <strong>{guest.name}</strong>
          <p className="muted">{guest.side || "Unassigned side"}</p>
          <p className="muted">{guest.phone || "No phone"} • {guest.email || "No email"}</p>
          <p className="muted">{guest.notes || "No notes"}</p>
        </div>
        <div className="row-actions">
          <select value={guest.rsvp} onChange={(event) => onPatchGuest(guest.id, { rsvp: event.target.value })}>
            <option>Pending</option>
            <option>Yes</option>
            <option>No</option>
          </select>
          <button className="btn danger" onClick={() => onDeleteGuest(guest.id)}>
            Delete
          </button>
        </div>
      </div>
    ));
  }

  return (
    <CollapsibleSection title="Guests" collapseSignal={collapseSignal}>
      <form className="form-grid" onSubmit={submit}>
        <input placeholder="Guest name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
        <select value={form.side} onChange={(event) => setForm((prev) => ({ ...prev, side: event.target.value }))}>
          <option value="">Side</option>
          <option value={sideOneLabel}>{sideOneLabel}</option>
          <option value={sideTwoLabel}>{sideTwoLabel}</option>
        </select>
        <input placeholder="Phone" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
        <input placeholder="Email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
        <select value={form.rsvp} onChange={(event) => setForm((prev) => ({ ...prev, rsvp: event.target.value }))}>
          <option>Pending</option>
          <option>Yes</option>
          <option>No</option>
        </select>
        <input placeholder="Notes" value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
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
