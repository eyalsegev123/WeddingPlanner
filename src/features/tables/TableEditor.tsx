import { TABLE_SHAPES } from "../../constants/enums";
import type { Guest, TableShape, WeddingTable } from "../../types/wedding";

interface Props {
  selectedTable: WeddingTable;
  guests: Guest[];
  guestsById: Map<string, Guest>;
  onPatchTable: (id: string, patch: Partial<WeddingTable>) => void;
  onDeleteTable: (id: string) => void;
}

export default function TableEditor({
  selectedTable,
  guests,
  guestsById,
  onPatchTable,
  onDeleteTable,
}: Props) {
  function toggleGuest(table: WeddingTable, guestId: string) {
    const nextGuestIds = table.guestIds.includes(guestId)
      ? table.guestIds.filter((id) => id !== guestId)
      : [...table.guestIds, guestId];
    onPatchTable(table.id, { guestIds: nextGuestIds });
  }

  return (
    <div className="table-editor">
      <div className="table-editor-header">
        <h3>Selected Table</h3>
        <button
          className="btn danger"
          type="button"
          onClick={() => onDeleteTable(selectedTable.id)}
        >
          Delete Table
        </button>
      </div>

      <div className="table-editor-grid">
        <label>
          Name
          <input
            value={selectedTable.name}
            onChange={(e) => onPatchTable(selectedTable.id, { name: e.target.value })}
          />
        </label>
        <label>
          Capacity
          <input
            type="number"
            min="1"
            max="30"
            value={selectedTable.capacity}
            onChange={(e) =>
              onPatchTable(selectedTable.id, { capacity: Number(e.target.value) })
            }
          />
        </label>
        <label>
          Shape
          <select
            value={selectedTable.shape}
            onChange={(e) =>
              onPatchTable(selectedTable.id, { shape: e.target.value as TableShape })
            }
          >
            {TABLE_SHAPES.map((s) => (
              <option key={s} value={s}>
                {s === "rect" ? "Rectangle" : "Round"}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="table-editor-summary">
        <p className="muted">
          {selectedTable.guestIds.length}/{selectedTable.capacity} seated
        </p>
      </div>

      <div className="chip-list">
        {guests.length ? (
          guests.map((guest) => (
            <button
              key={guest.id}
              className={selectedTable.guestIds.includes(guest.id) ? "chip selected" : "chip"}
              type="button"
              onClick={() => toggleGuest(selectedTable, guest.id)}
            >
              {guest.name || "Unnamed"}
            </button>
          ))
        ) : (
          <p className="muted">Add guests first to assign seats.</p>
        )}
      </div>

      <div className="table-editor-list muted">
        {selectedTable.guestIds.length
          ? selectedTable.guestIds
              .map((id) => guestsById.get(id)?.name)
              .filter(Boolean)
              .join(", ")
          : "No guests assigned yet."}
      </div>
    </div>
  );
}
