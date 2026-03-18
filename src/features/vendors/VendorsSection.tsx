import React, { useMemo, useState } from "react";

import CollapsibleSection from "../../shared/components/CollapsibleSection";
import DataTable, { ColumnDef, SortDir } from "../../shared/components/DataTable";
import type { CollapseSignal, Vendor } from "../../types/wedding";

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
  contactName: "",
  phone: "",
  email: "",
  website: "",
  city: "",
  costPerPerson: 0,
  design: 0,
  hours: 0,
  foodDrinkMin: 0,
  alcohol: "",
  parking: "",
  totalVenuePrice: 0,
  totalPrice: 0,
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
  const [form, setForm] = useState<{ name: string; contactName: string; city: string }>({
    name: "",
    contactName: "",
    city: "",
  });
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
    onAddVendor({ ...initialVendor, name: form.name, contactName: form.contactName, city: form.city });
    setForm({ name: "", contactName: "", city: "" });
  }

  const p = (id: string, patch: Partial<Vendor>) => onPatchVendor(id, patch);

  const columns: ColumnDef<Vendor>[] = [
    { key: "name", label: "Venue", sortable: true, width: "150px",
      render: (v) => <input className="cell-input" value={v.name} onChange={(e) => p(v.id, { name: e.target.value })} /> },
    { key: "contactName", label: "Contact", width: "130px",
      render: (v) => <input className="cell-input" placeholder="Contact" value={v.contactName} onChange={(e) => p(v.id, { contactName: e.target.value })} /> },
    { key: "phone", label: "Phone", width: "120px",
      render: (v) => <input className="cell-input" placeholder="Phone" value={v.phone} onChange={(e) => p(v.id, { phone: e.target.value })} /> },
    { key: "email", label: "Email", width: "150px",
      render: (v) => <input className="cell-input" placeholder="Email" value={v.email} onChange={(e) => p(v.id, { email: e.target.value })} /> },
    { key: "website", label: "Website", width: "150px",
      render: (v) => <input className="cell-input" placeholder="Website" value={v.website} onChange={(e) => p(v.id, { website: e.target.value })} /> },
    { key: "city", label: "City", sortable: true, width: "110px",
      render: (v) => <input className="cell-input" placeholder="City" value={v.city} onChange={(e) => p(v.id, { city: e.target.value })} /> },
    { key: "costPerPerson", label: "Cost/person", sortable: true, width: "110px",
      render: (v) => <input type="number" min="0" className="cell-input" placeholder="0" value={v.costPerPerson || ""} onChange={(e) => p(v.id, { costPerPerson: Number(e.target.value) || 0 })} /> },
    { key: "design", label: "Design", width: "100px",
      render: (v) => <input type="number" min="0" className="cell-input" placeholder="0" value={v.design || ""} onChange={(e) => p(v.id, { design: Number(e.target.value) || 0 })} /> },
    { key: "hours", label: "# of hrs", width: "90px",
      render: (v) => <input type="number" min="0" className="cell-input" placeholder="0" value={v.hours || ""} onChange={(e) => p(v.id, { hours: Number(e.target.value) || 0 })} /> },
    { key: "foodDrinkMin", label: "Food/drink min.", width: "120px",
      render: (v) => <input type="number" min="0" className="cell-input" placeholder="0" value={v.foodDrinkMin || ""} onChange={(e) => p(v.id, { foodDrinkMin: Number(e.target.value) || 0 })} /> },
    { key: "alcohol", label: "Alcohol", width: "120px",
      render: (v) => <input className="cell-input" placeholder="Alcohol" value={v.alcohol} onChange={(e) => p(v.id, { alcohol: e.target.value })} /> },
    { key: "parking", label: "Parking", width: "120px",
      render: (v) => <input className="cell-input" placeholder="Parking" value={v.parking} onChange={(e) => p(v.id, { parking: e.target.value })} /> },
    { key: "totalVenuePrice", label: "Est. Venue Price", sortable: true, width: "130px",
      render: (v) => <input type="number" min="0" className="cell-input" placeholder="0" value={v.totalVenuePrice || ""} onChange={(e) => p(v.id, { totalVenuePrice: Number(e.target.value) || 0 })} /> },
    { key: "totalPrice", label: "Est. Total Price", sortable: true, width: "130px",
      render: (v) => <input type="number" min="0" className="cell-input" placeholder="0" value={v.totalPrice || ""} onChange={(e) => p(v.id, { totalPrice: Number(e.target.value) || 0 })} /> },
    { key: "notes", label: "Notes", width: "150px",
      render: (v) => <input className="cell-input" placeholder="Notes" value={v.notes} onChange={(e) => p(v.id, { notes: e.target.value })} /> },
    { key: "_actions", label: "", width: "90px",
      render: (v) => <button className="btn danger" type="button" onClick={() => onDeleteVendor(v.id)}>Delete</button> },
  ];

  return (
    <CollapsibleSection title="Venues" collapseSignal={collapseSignal}>
      <form className="form-grid" onSubmit={submit}>
        <input placeholder="Venue name" value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
        <input placeholder="Contact person" value={form.contactName}
          onChange={(e) => setForm((prev) => ({ ...prev, contactName: e.target.value }))} />
        <input placeholder="City" value={form.city}
          onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} />
        <button className="btn" type="submit">Add Venue</button>
      </form>

      <DataTable
        columns={columns}
        rows={sortedVendors}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        getRowKey={(v) => v.id}
        emptyText="No venues yet. Add one above."
      />
    </CollapsibleSection>
  );
}
