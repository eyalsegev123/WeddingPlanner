import React, { useMemo, useState } from "react";

import CollapsibleSection from "../../shared/components/CollapsibleSection";
import { VENDOR_CATEGORIES, VENDOR_STATUSES } from "../../constants/enums";
import type { CollapseSignal, Vendor, VendorStatus } from "../../types/wedding";

interface Props {
  vendors: Vendor[];
  currency: string;
  onAddVendor: (vendor: Omit<Vendor, "id">) => void;
  onPatchVendor: (id: string, patch: Partial<Vendor>) => void;
  onDeleteVendor: (id: string) => void;
  collapseSignal?: CollapseSignal;
}

const initialVendor: Omit<Vendor, "id"> = {
  name: "",
  category: "Venue",
  contactName: "",
  phone: "",
  email: "",
  quote: 0,
  status: "Researching",
  lastContact: "",
  nextStep: "",
  notes: "",
};

export default function VendorsSection({
  vendors,
  currency,
  onAddVendor,
  onPatchVendor,
  onDeleteVendor,
  collapseSignal,
}: Props) {
  const [form, setForm] = useState({ ...initialVendor, quote: "" as string | number });

  const money = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "ILS",
  });

  const grouped = useMemo(
    () => ({
      researching: vendors.filter((v) => v.status === "Researching"),
      shortlisted: vendors.filter((v) => v.status === "Shortlisted"),
      booked: vendors.filter((v) => v.status === "Booked"),
    }),
    [vendors],
  );

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const quote = Number(form.quote);
    onAddVendor({ ...initialVendor, ...form, quote: Number.isFinite(quote) ? quote : 0 });
    setForm({ ...initialVendor, quote: "" });
  }

  function renderVendor(vendor: Vendor) {
    return (
      <article className="row" key={vendor.id}>
        <div>
          <div className="form-grid">
            <input
              value={vendor.name}
              onChange={(e) => onPatchVendor(vendor.id, { name: e.target.value })}
            />
            <select
              value={vendor.category}
              onChange={(e) => onPatchVendor(vendor.id, { category: e.target.value })}
            >
              {VENDOR_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input
              placeholder="Contact person"
              value={vendor.contactName}
              onChange={(e) => onPatchVendor(vendor.id, { contactName: e.target.value })}
            />
            <input
              placeholder="Phone"
              value={vendor.phone}
              onChange={(e) => onPatchVendor(vendor.id, { phone: e.target.value })}
            />
            <input
              placeholder="Email"
              value={vendor.email}
              onChange={(e) => onPatchVendor(vendor.id, { email: e.target.value })}
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Quote"
              value={vendor.quote}
              onChange={(e) =>
                onPatchVendor(vendor.id, { quote: Number(e.target.value) || 0 })
              }
            />
            <input
              type="date"
              value={vendor.lastContact}
              onChange={(e) => onPatchVendor(vendor.id, { lastContact: e.target.value })}
            />
            <input
              placeholder="Next step"
              value={vendor.nextStep}
              onChange={(e) => onPatchVendor(vendor.id, { nextStep: e.target.value })}
            />
            <input
              placeholder="Notes"
              value={vendor.notes}
              onChange={(e) => onPatchVendor(vendor.id, { notes: e.target.value })}
            />
          </div>
          <p className="muted">
            Quote preview: {vendor.quote ? money.format(vendor.quote) : "Not set"}
          </p>
        </div>
        <div className="row-actions">
          <select
            value={vendor.status}
            onChange={(e) =>
              onPatchVendor(vendor.id, { status: e.target.value as VendorStatus })
            }
          >
            {VENDOR_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button
            className="btn danger"
            type="button"
            onClick={() => onDeleteVendor(vendor.id)}
          >
            Delete
          </button>
        </div>
      </article>
    );
  }

  return (
    <CollapsibleSection title="Vendors & Contacts" collapseSignal={collapseSignal}>
      <form className="form-grid" onSubmit={submit}>
        <input
          placeholder="Vendor name"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
        />
        <select
          value={form.category}
          onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
        >
          {VENDOR_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input
          placeholder="Contact person"
          value={form.contactName}
          onChange={(e) => setForm((prev) => ({ ...prev, contactName: e.target.value }))}
        />
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
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Quote"
          value={form.quote}
          onChange={(e) => setForm((prev) => ({ ...prev, quote: e.target.value }))}
        />
        <input
          type="date"
          value={form.lastContact}
          onChange={(e) => setForm((prev) => ({ ...prev, lastContact: e.target.value }))}
        />
        <input
          placeholder="Next step"
          value={form.nextStep}
          onChange={(e) => setForm((prev) => ({ ...prev, nextStep: e.target.value }))}
        />
        <textarea
          placeholder="Notes"
          rows={1}
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
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
