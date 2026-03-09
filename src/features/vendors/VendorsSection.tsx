import React, { useMemo, useState } from "react";

import CollapsibleSection from "../../shared/components/CollapsibleSection";
import DataTable, { ColumnDef, SortDir } from "../../shared/components/DataTable";
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

const STATUS_BG: Record<VendorStatus, string> = {
  Researching: "#f0f4ff",
  Shortlisted: "#fff4e0",
  Booked: "#e5f7f0",
};

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
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(key: string) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const sortedVendors = useMemo(() => {
    if (!sortKey) return vendors;
    return [...vendors].sort((a, b) => {
      const av = String((a as unknown as Record<string, unknown>)[sortKey] ?? "");
      const bv = String((b as unknown as Record<string, unknown>)[sortKey] ?? "");
      const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: "base" });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [vendors, sortKey, sortDir]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const quote = Number(form.quote);
    onAddVendor({ ...initialVendor, ...form, quote: Number.isFinite(quote) ? quote : 0 });
    setForm({ ...initialVendor, quote: "" });
  }

  const p = (id: string, patch: Partial<Vendor>) => onPatchVendor(id, patch);

  const columns: ColumnDef<Vendor>[] = [
    { key: "name", label: "Vendor", sortable: true, width: "150px",
      render: (v) => <input className="cell-input" value={v.name} onChange={(e) => p(v.id, { name: e.target.value })} /> },
    { key: "category", label: "Category", sortable: true, width: "120px",
      render: (v) => (
        <select className="cell-select" value={v.category} onChange={(e) => p(v.id, { category: e.target.value })}>
          {VENDOR_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      ) },
    { key: "status", label: "Status", sortable: true, width: "120px",
      render: (v) => (
        <select className="cell-select" value={v.status}
          style={{ background: STATUS_BG[v.status], borderRadius: "999px", paddingLeft: "0.6rem" }}
          onChange={(e) => p(v.id, { status: e.target.value as VendorStatus })}>
          {VENDOR_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      ) },
    { key: "contactName", label: "Contact", sortable: true, width: "130px",
      render: (v) => <input className="cell-input" placeholder="Contact" value={v.contactName} onChange={(e) => p(v.id, { contactName: e.target.value })} /> },
    { key: "phone", label: "Phone", width: "120px",
      render: (v) => <input className="cell-input" placeholder="Phone" value={v.phone} onChange={(e) => p(v.id, { phone: e.target.value })} /> },
    { key: "email", label: "Email", width: "160px",
      render: (v) => <input className="cell-input" placeholder="Email" value={v.email} onChange={(e) => p(v.id, { email: e.target.value })} /> },
    { key: "quote", label: "Quote", sortable: true, width: "110px",
      render: (v) => <input type="number" min="0" step="0.01" className="cell-input" placeholder="0" value={v.quote} onChange={(e) => p(v.id, { quote: Number(e.target.value) || 0 })} /> },
    { key: "lastContact", label: "Last Contact", sortable: true, width: "140px",
      render: (v) => <input type="date" className="cell-input" value={v.lastContact} onChange={(e) => p(v.id, { lastContact: e.target.value })} /> },
    { key: "nextStep", label: "Next Step", width: "150px",
      render: (v) => <input className="cell-input" placeholder="Next step" value={v.nextStep} onChange={(e) => p(v.id, { nextStep: e.target.value })} /> },
    { key: "notes", label: "Notes",
      render: (v) => <input className="cell-input" placeholder="Notes" value={v.notes} onChange={(e) => p(v.id, { notes: e.target.value })} /> },
    { key: "_actions", label: "", width: "90px",
      render: (v) => <button className="btn danger" type="button" onClick={() => onDeleteVendor(v.id)}>Delete</button> },
  ];

  return (
    <CollapsibleSection title="Vendors & Contacts" collapseSignal={collapseSignal}>
      <form className="form-grid" onSubmit={submit}>
        <input placeholder="Vendor name" value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
        <select value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}>
          {VENDOR_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input placeholder="Contact person" value={form.contactName}
          onChange={(e) => setForm((prev) => ({ ...prev, contactName: e.target.value }))} />
        <input placeholder="Phone" value={form.phone}
          onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
        <input placeholder="Email" value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
        <input type="number" min="0" step="0.01" placeholder="Quote" value={form.quote}
          onChange={(e) => setForm((prev) => ({ ...prev, quote: e.target.value }))} />
        <input type="date" value={form.lastContact}
          onChange={(e) => setForm((prev) => ({ ...prev, lastContact: e.target.value }))} />
        <input placeholder="Next step" value={form.nextStep}
          onChange={(e) => setForm((prev) => ({ ...prev, nextStep: e.target.value }))} />
        <input placeholder="Notes" value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
        <button className="btn" type="submit">Add Vendor</button>
      </form>

      <DataTable
        columns={columns}
        rows={sortedVendors}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        getRowKey={(v) => v.id}
        emptyText="No vendors yet. Add one above."
      />
    </CollapsibleSection>
  );
}
