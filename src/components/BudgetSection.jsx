import React, { useMemo, useState } from "react";
import CollapsibleSection from "./CollapsibleSection";

const initialItem = {
  title: "",
  category: "Venue",
  amount: "",
  dueDate: "",
  paid: false,
  notes: ""
};

export default function BudgetSection({ budget, currency, onAddItem, onPatchItem, onDeleteItem, collapseSignal }) {
  const [form, setForm] = useState(initialItem);

  const totals = useMemo(() => {
    const planned = budget.reduce((sum, item) => sum + item.amount, 0);
    const paid = budget.filter((item) => item.paid).reduce((sum, item) => sum + item.amount, 0);
    return { planned, paid, left: planned - paid };
  }, [budget]);

  const money = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD"
  });

  function submit(event) {
    event.preventDefault();
    const amount = Number(form.amount);
    onAddItem({
      ...form,
      amount: Number.isFinite(amount) ? amount : 0
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
        <input placeholder="Budget item (e.g. Photographer)" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
        <select value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}>
          <option>Venue</option>
          <option>Catering</option>
          <option>Photo/Video</option>
          <option>Music</option>
          <option>Flowers</option>
          <option>Attire</option>
          <option>Transport</option>
          <option>Other</option>
        </select>
        <input type="number" min="0" step="0.01" placeholder="Amount" value={form.amount} onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))} />
        <input type="date" value={form.dueDate} onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))} />
        <input placeholder="Notes" value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
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
                {item.category} • {money.format(item.amount)} • Due: {item.dueDate || "No due date"}
              </p>
              <p className="muted">{item.notes || "No notes"}</p>
            </div>
            <div className="row-actions">
              <label className="check-inline">
                <input type="checkbox" checked={item.paid} onChange={(event) => onPatchItem(item.id, { paid: event.target.checked })} />
                Paid
              </label>
              <button className="btn danger" onClick={() => onDeleteItem(item.id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </CollapsibleSection>
  );
}
