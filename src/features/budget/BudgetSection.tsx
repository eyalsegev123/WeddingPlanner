import React, { useMemo, useState } from "react";

import CollapsibleSection from "../../shared/components/CollapsibleSection";
import DataTable, { ColumnDef, SortDir } from "../../shared/components/DataTable";
import { BUDGET_CATEGORIES } from "../../constants/enums";
import type { BudgetItem, CollapseSignal } from "../../types/wedding";

interface Props {
  budget: BudgetItem[];
  currency: string;
  onAddItem: (item: Omit<BudgetItem, "id">) => void;
  onPatchItem: (id: string, patch: Partial<BudgetItem>) => void;
  onDeleteItem: (id: string) => void;
  collapseSignal?: CollapseSignal;
}

const initialItem = {
  title: "",
  category: "Venue",
  amount: "" as string | number,
  dueDate: "",
  paid: false,
  notes: "",
};

export default function BudgetSection({
  budget,
  currency,
  onAddItem,
  onPatchItem,
  onDeleteItem,
  collapseSignal,
}: Props) {
  const [form, setForm] = useState(initialItem);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const money = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "ILS",
  });

  const totals = useMemo(() => {
    const planned = budget.reduce((sum, item) => sum + item.amount, 0);
    const paid = budget.filter((item) => item.paid).reduce((sum, item) => sum + item.amount, 0);
    return { planned, paid, left: planned - paid };
  }, [budget]);

  function handleSort(key: string) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const sortedBudget = useMemo(() => {
    if (!sortKey) return budget;
    return [...budget].sort((a, b) => {
      const av = String((a as unknown as Record<string, unknown>)[sortKey] ?? "");
      const bv = String((b as unknown as Record<string, unknown>)[sortKey] ?? "");
      const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: "base" });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [budget, sortKey, sortDir]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const amount = Number(form.amount);
    onAddItem({
      title: String(form.title),
      category: String(form.category),
      amount: Number.isFinite(amount) ? amount : 0,
      dueDate: String(form.dueDate),
      paid: Boolean(form.paid),
      notes: String(form.notes),
    });
    setForm(initialItem);
  }

  const columns: ColumnDef<BudgetItem>[] = [
    {
      key: "title",
      label: "Item",
      sortable: true,
      width: "180px",
      render: (item) => (
        <input
          className="cell-input"
          value={item.title}
          onChange={(e) => onPatchItem(item.id, { title: e.target.value })}
        />
      ),
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
      width: "130px",
      render: (item) => (
        <select
          className="cell-select"
          value={item.category}
          onChange={(e) => onPatchItem(item.id, { category: e.target.value })}
        >
          {BUDGET_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      width: "130px",
      render: (item) => (
        <input
          type="number"
          min="0"
          step="0.01"
          className="cell-input"
          value={item.amount}
          onChange={(e) => onPatchItem(item.id, { amount: Number(e.target.value) || 0 })}
        />
      ),
    },
    {
      key: "dueDate",
      label: "Due Date",
      sortable: true,
      width: "140px",
      render: (item) => (
        <input
          type="date"
          className="cell-input"
          value={item.dueDate}
          onChange={(e) => onPatchItem(item.id, { dueDate: e.target.value })}
        />
      ),
    },
    {
      key: "paid",
      label: "Paid",
      sortable: true,
      width: "70px",
      render: (item) => (
        <div className="cell-checkbox">
          <input
            type="checkbox"
            checked={item.paid}
            onChange={(e) => onPatchItem(item.id, { paid: e.target.checked })}
          />
        </div>
      ),
    },
    {
      key: "notes",
      label: "Notes",
      render: (item) => (
        <input
          className="cell-input"
          placeholder="Notes"
          value={item.notes}
          onChange={(e) => onPatchItem(item.id, { notes: e.target.value })}
        />
      ),
    },
    {
      key: "_actions",
      label: "",
      width: "90px",
      render: (item) => (
        <button className="btn danger" type="button" onClick={() => onDeleteItem(item.id)}>
          Delete
        </button>
      ),
    },
  ];

  return (
    <CollapsibleSection title="Budget" collapseSignal={collapseSignal}>
      <div className="stats-grid compact">
        <article>
          <p className="muted">Planned</p>
          <strong>{money.format(totals.planned)}</strong>
        </article>
        <article>
          <p className="muted">Paid</p>
          <strong>{money.format(totals.paid)}</strong>
        </article>
        <article>
          <p className="muted">Left</p>
          <strong>{money.format(totals.left)}</strong>
        </article>
      </div>

      <form className="form-grid" onSubmit={submit}>
        <input
          placeholder="Budget item (e.g. Photographer)"
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
        />
        <select
          value={form.category}
          onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
        >
          {BUDGET_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Amount"
          value={form.amount}
          onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
        />
        <input
          type="date"
          value={form.dueDate}
          onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
        />
        <input
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
        />
        <button className="btn" type="submit">Add Item</button>
      </form>

      <DataTable
        columns={columns}
        rows={sortedBudget}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        getRowKey={(item) => item.id}
        emptyText="No budget items yet. Add one above."
      />
    </CollapsibleSection>
  );
}
