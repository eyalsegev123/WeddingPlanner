import React, { useMemo, useState } from "react";
import CollapsibleSection from "./CollapsibleSection";

const initialVendor = {
  name: "",
  category: "Venue",
  contactName: "",
  phone: "",
  email: "",
  quote: "",
  status: "Researching",
  lastContact: "",
  nextStep: "",
  notes: ""
};

export default function VendorsSection({ vendors, currency, onAddVendor, onPatchVendor, onDeleteVendor, collapseSignal }) {
  const [form, setForm] = useState(initialVendor);

  const money = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD"
  });

  const grouped = useMemo(() => {
    return {
      researching: vendors.filter((vendor) => vendor.status === "Researching"),
      shortlisted: vendors.filter((vendor) => vendor.status === "Shortlisted"),
      booked: vendors.filter((vendor) => vendor.status === "Booked")
    };
  }, [vendors]);

  function submit(event) {
    event.preventDefault();
    const quote = Number(form.quote);
    onAddVendor({
      ...form,
      quote: Number.isFinite(quote) ? quote : 0
    });
    setForm(initialVendor);
  }

  function renderVendor(vendor) {
    return (
      <article className="row" key={vendor.id}>
        <div>
          <div className="form-grid">
            <input value={vendor.name} onChange={(event) => onPatchVendor(vendor.id, { name: event.target.value })} />
            <select value={vendor.category} onChange={(event) => onPatchVendor(vendor.id, { category: event.target.value })}>
              <option>Venue</option>
              <option>Catering</option>
              <option>Photography</option>
              <option>Video</option>
              <option>DJ/Band</option>
              <option>Florist</option>
              <option>Planner</option>
              <option>Decor</option>
              <option>Transportation</option>
              <option>Other</option>
            </select>
            <input placeholder="Contact person" value={vendor.contactName} onChange={(event) => onPatchVendor(vendor.id, { contactName: event.target.value })} />
            <input placeholder="Phone" value={vendor.phone} onChange={(event) => onPatchVendor(vendor.id, { phone: event.target.value })} />
            <input placeholder="Email" value={vendor.email} onChange={(event) => onPatchVendor(vendor.id, { email: event.target.value })} />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Quote"
              value={vendor.quote}
              onChange={(event) => onPatchVendor(vendor.id, { quote: Number(event.target.value) || 0 })}
            />
            <input type="date" value={vendor.lastContact} onChange={(event) => onPatchVendor(vendor.id, { lastContact: event.target.value })} />
            <input placeholder="Next step" value={vendor.nextStep} onChange={(event) => onPatchVendor(vendor.id, { nextStep: event.target.value })} />
            <input placeholder="Notes" value={vendor.notes} onChange={(event) => onPatchVendor(vendor.id, { notes: event.target.value })} />
          </div>
          <p className="muted">Quote preview: {vendor.quote ? money.format(vendor.quote) : "Not set"}</p>
        </div>
        <div className="row-actions">
          <select value={vendor.status} onChange={(event) => onPatchVendor(vendor.id, { status: event.target.value })}>
            <option>Researching</option>
            <option>Shortlisted</option>
            <option>Booked</option>
          </select>
          <button className="btn danger" type="button" onClick={() => onDeleteVendor(vendor.id)}>
            Delete
          </button>
        </div>
      </article>
    );
  }

  return (
    <CollapsibleSection title="Vendors & Contacts" collapseSignal={collapseSignal}>
      <form className="form-grid" onSubmit={submit}>
        <input placeholder="Vendor name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
        <select value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}>
          <option>Venue</option>
          <option>Catering</option>
          <option>Photography</option>
          <option>Video</option>
          <option>DJ/Band</option>
          <option>Florist</option>
          <option>Planner</option>
          <option>Decor</option>
          <option>Transportation</option>
          <option>Other</option>
        </select>
        <input placeholder="Contact person" value={form.contactName} onChange={(event) => setForm((prev) => ({ ...prev, contactName: event.target.value }))} />
        <input placeholder="Phone" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
        <input placeholder="Email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
        <input type="number" min="0" step="0.01" placeholder="Quote" value={form.quote} onChange={(event) => setForm((prev) => ({ ...prev, quote: event.target.value }))} />
        <input type="date" value={form.lastContact} onChange={(event) => setForm((prev) => ({ ...prev, lastContact: event.target.value }))} />
        <input placeholder="Next step" value={form.nextStep} onChange={(event) => setForm((prev) => ({ ...prev, nextStep: event.target.value }))} />
        <textarea
          placeholder="Notes"
          rows={1}
          value={form.notes}
          onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
        />
        <button className="btn" type="submit">
          Add Vendor
        </button>
      </form>

      <div className="columns-3">
        <div>
          <h3>Researching</h3>
          <div className="stack">{grouped.researching.map(renderVendor)}</div>
        </div>
        <div>
          <h3>Shortlisted</h3>
          <div className="stack">{grouped.shortlisted.map(renderVendor)}</div>
        </div>
        <div>
          <h3>Booked</h3>
          <div className="stack">{grouped.booked.map(renderVendor)}</div>
        </div>
      </div>
    </CollapsibleSection>
  );
}
