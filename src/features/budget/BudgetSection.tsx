import React, { useMemo, useState } from "react";

import CollapsibleSection from "../../shared/components/CollapsibleSection";
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

  const money = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "ILS",
  });

  const totals = useMemo(() => {
    const planned = budget.reduce((sum, item) => sum + item.amount, 0);
    const paid = budget.filter((item) => item.paid).reduce((sum, item) => sum + item.amount, 0);
    return { planned, paid, left: planned - paid };
  }, [budget]);

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
          {BUDGET_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
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
        <button className="btn" type="submit">
          Add Item
        </button>
      </form>

      <div className="stack">
        {budget.map((item) => (
          <article className="row" key={item.id}>
            <div>
              <strong>{item.title}</strong>
              <p className="muted">
                {item.category} • {money.format(item.amount)} • Due:{" "}
                {item.dueDate || "No due date"}
              </p>
              <p className="muted">{item.notes || "No notes"}</p>
            </div>
            <div className="row-actions">
              <label className="check-inline">
                <input
                  type="checkbox"
                  checked={item.paid}
                  onChange={(e) => onPatchItem(item.id, { paid: e.target.checked })}
                />
                Paid
              </label>
              <button
                className="btn danger"
                type="button"
                onClick={() => onDeleteItem(item.id)}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </CollapsibleSection>
  );
}
