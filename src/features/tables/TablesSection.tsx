import { useEffect, useMemo, useState } from "react";

import CollapsibleSection from "../../shared/components/CollapsibleSection";
import { TABLE_SHAPES } from "../../constants/enums";
import { useIsMobile } from "../../hooks/useIsMobile";
import type { CollapseSignal, Guest, TableShape, WeddingTable } from "../../types/wedding";
import GuestSidebar from "./GuestSidebar";
import TableCanvas from "./TableCanvas";
import TableEditor from "./TableEditor";

interface Props {
  tables: WeddingTable[];
  guests: Guest[];
  onAddTable: (table: Omit<WeddingTable, "id">) => void;
  onPatchTable: (id: string, patch: Partial<WeddingTable>) => void;
  onDeleteTable: (id: string) => void;
  collapseSignal?: CollapseSignal;
}

export default function TablesSection({
  tables,
  guests,
  onAddTable,
  onPatchTable,
  onDeleteTable,
  collapseSignal,
}: Props) {
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState<number | string>(8);
  const [shape, setShape] = useState<TableShape>("round");
  const [selectedTableId, setSelectedTableId] = useState("");

  const guestsById = useMemo(
    () => new Map(guests.map((g) => [g.id, g])),
    [guests],
  );

  const isMobile = useIsMobile();

  const selectedTable =
    tables.find((t) => t.id === selectedTableId) ?? tables[0] ?? null;

  useEffect(() => {
    if (!tables.length) {
      if (selectedTableId) setSelectedTableId("");
      return;
    }
    if (!selectedTableId || !tables.some((t) => t.id === selectedTableId)) {
      setSelectedTableId(tables[0].id);
    }
  }, [tables, selectedTableId]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    onAddTable({ name, capacity: Number(capacity) || 8, guestIds: [], shape, x: 50, y: 50 });
    setName("");
    setCapacity(8);
    setShape("round");
  }

  if (isMobile) {
    return (
      <CollapsibleSection title="Tables & Seating" collapseSignal={collapseSignal}>
        <p className="muted" style={{ fontSize: "0.85rem", fontStyle: "italic" }}>
          Open on desktop to edit seating arrangements.
        </p>
        {tables.length === 0 ? (
          <p className="muted">No tables added yet.</p>
        ) : (
          <div className="mobile-tables-list">
            {tables.map((table) => {
              const assigned = table.guestIds.map((id) => guestsById.get(id)).filter(Boolean) as Guest[];
              return (
                <div key={table.id} className="mobile-table-card">
                  <div className="mobile-table-card-header">
                    <strong>{table.name}</strong>
                    <span className="muted" style={{ fontSize: "0.82rem" }}>
                      {assigned.length}/{table.capacity} seats
                    </span>
                  </div>
                  {assigned.length > 0 ? (
                    <ul className="mobile-table-guest-list">
                      {assigned.map((g) => (
                        <li key={g.id}>{g.name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mobile-table-empty-note">No guests assigned</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CollapsibleSection>
    );
  }

  return (
    <CollapsibleSection title="Tables & Seating" collapseSignal={collapseSignal}>
      <form className="inline-form" onSubmit={submit}>
        <input
          placeholder="Table name (e.g. Table 1)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="number"
          min="1"
          max="30"
          placeholder="Capacity"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
        />
        <select
          value={shape}
          onChange={(e) => setShape(e.target.value as TableShape)}
        >
          {TABLE_SHAPES.map((s) => (
            <option key={s} value={s}>
              {s === "rect" ? "Rectangle" : "Round"}
            </option>
          ))}
        </select>
        <button className="btn" type="submit">
          Add Table
        </button>
      </form>

      <div className="tables-layout">
        <GuestSidebar guests={guests} tables={tables} />
        <TableCanvas
          tables={tables}
          guests={guests}
          selectedTableId={selectedTableId}
          onSelectTable={setSelectedTableId}
          onPatchTable={onPatchTable}
        />
      </div>

      {selectedTable && (
        <TableEditor
          selectedTable={selectedTable}
          guests={guests}
          guestsById={guestsById}
          onPatchTable={onPatchTable}
          onDeleteTable={onDeleteTable}
        />
      )}
    </CollapsibleSection>
  );
}
