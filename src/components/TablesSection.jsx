import React, { useEffect, useMemo, useRef, useState } from "react";
import CollapsibleSection from "./CollapsibleSection";

export default function TablesSection({ tables, guests, onAddTable, onPatchTable, onDeleteTable, collapseSignal }) {
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(8);
  const [shape, setShape] = useState("round");
  const [selectedTableId, setSelectedTableId] = useState("");
  const gridRef = useRef(null);
  const dragRef = useRef(null);

  const guestsById = useMemo(() => new Map(guests.map((guest) => [guest.id, guest])), [guests]);
  const selectedTable = tables.find((table) => table.id === selectedTableId) || tables[0] || null;

  useEffect(() => {
    if (!tables.length) {
      if (selectedTableId) {
        setSelectedTableId("");
      }
      return;
    }

    if (!selectedTableId || !tables.some((table) => table.id === selectedTableId)) {
      setSelectedTableId(tables[0].id);
    }
  }, [tables, selectedTableId]);

  function submit(event) {
    event.preventDefault();
    onAddTable({ name, capacity: Number(capacity) || 8, guestIds: [], shape });
    setName("");
    setCapacity(8);
    setShape("round");
  }

  function toggleGuest(table, guestId) {
    const nextGuestIds = table.guestIds.includes(guestId)
      ? table.guestIds.filter((id) => id !== guestId)
      : [...table.guestIds, guestId];
    onPatchTable(table.id, { guestIds: nextGuestIds });
  }

  function startDrag(event, table) {
    if (!gridRef.current) {
      return;
    }

    setSelectedTableId(table.id);
    const rect = gridRef.current.getBoundingClientRect();
    const tableX = ((Number(table.x) || 50) / 100) * rect.width;
    const tableY = ((Number(table.y) || 50) / 100) * rect.height;

    dragRef.current = {
      tableId: table.id,
      offsetX: event.clientX - (rect.left + tableX),
      offsetY: event.clientY - (rect.top + tableY)
    };

    document.body.classList.add("dragging-canvas");
    event.preventDefault();
  }

  useEffect(() => {
    function handlePointerMove(event) {
      if (!dragRef.current || !gridRef.current) {
        return;
      }
      const rect = gridRef.current.getBoundingClientRect();
      const x = ((event.clientX - rect.left - dragRef.current.offsetX) / rect.width) * 100;
      const y = ((event.clientY - rect.top - dragRef.current.offsetY) / rect.height) * 100;
      const safeX = Math.max(6, Math.min(94, x));
      const safeY = Math.max(8, Math.min(92, y));
      onPatchTable(dragRef.current.tableId, {
        x: Math.round(safeX * 10) / 10,
        y: Math.round(safeY * 10) / 10
      });
    }

    function handlePointerUp() {
      dragRef.current = null;
      document.body.classList.remove("dragging-canvas");
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      document.body.classList.remove("dragging-canvas");
    };
  }, [onPatchTable]);

  return (
    <CollapsibleSection title="Tables & Seating" collapseSignal={collapseSignal}>
      <form className="inline-form" onSubmit={submit}>
        <input placeholder="Table name (e.g. Table 1)" value={name} onChange={(event) => setName(event.target.value)} />
        <input type="number" min="1" max="30" placeholder="Capacity" value={capacity} onChange={(event) => setCapacity(event.target.value)} />
        <select value={shape} onChange={(event) => setShape(event.target.value)}>
          <option value="round">Round</option>
          <option value="rect">Rectangle</option>
        </select>
        <button className="btn" type="submit">
          Add Table
        </button>
      </form>

      <div className="top-view-wrap">
        <div className="top-view-header">
          <h3>Floor Plan Canvas</h3>
          <p className="muted">Drag tables to position. Click a table to edit seats.</p>
        </div>
        <div className="top-view-stage">Ceremony / Dance Floor</div>
        <div className="top-view-grid" ref={gridRef}>
          {!tables.length && (
            <div className="canvas-empty">
              <strong>No tables yet</strong>
              <p className="muted">Add your first table above to start planning the floor.</p>
            </div>
          )}

          {tables.map((table) => {
            const seats = Math.max(2, Math.min(16, Number(table.capacity) || 8));
            const isRect = (table.shape || "round") === "rect";
            const isSelected = selectedTable && selectedTable.id === table.id;
            return (
              <button
                key={`scene-${table.id}`}
                type="button"
                className={isRect ? `scene-table scene-table-rect${isSelected ? " selected" : ""}` : `scene-table scene-table-round${isSelected ? " selected" : ""}`}
                style={{ left: `${table.x || 50}%`, top: `${table.y || 50}%` }}
                title={`${table.name} (${seats} seats)`}
                onPointerDown={(event) => startDrag(event, table)}
                onClick={() => setSelectedTableId(table.id)}
              >
                <span className="scene-label">{table.name}</span>
                <span className="scene-meta">
                  {table.guestIds.length}/{table.capacity}
                </span>
                {Array.from({ length: seats }).map((_, index) => {
                  const angle = ((Math.PI * 2) / seats) * index - Math.PI / 2;
                  const radiusX = isRect ? 58 : 46;
                  const radiusY = isRect ? 42 : 46;
                  const x = 50 + Math.cos(angle) * radiusX;
                  const y = 50 + Math.sin(angle) * radiusY;
                  return <span key={`${table.id}-chair-${index}`} className="scene-chair" style={{ left: `${x}%`, top: `${y}%` }} />;
                })}
              </button>
            );
          })}
        </div>
      </div>

      {selectedTable && (
        <div className="table-editor">
          <div className="table-editor-header">
            <h3>Selected Table</h3>
            <button className="btn danger" type="button" onClick={() => onDeleteTable(selectedTable.id)}>
              Delete Table
            </button>
          </div>

          <div className="table-editor-grid">
            <label>
              Name
              <input value={selectedTable.name} onChange={(event) => onPatchTable(selectedTable.id, { name: event.target.value })} />
            </label>
            <label>
              Capacity
              <input
                type="number"
                min="1"
                max="30"
                value={selectedTable.capacity}
                onChange={(event) => onPatchTable(selectedTable.id, { capacity: event.target.value })}
              />
            </label>
            <label>
              Shape
              <select value={selectedTable.shape} onChange={(event) => onPatchTable(selectedTable.id, { shape: event.target.value })}>
                <option value="round">Round</option>
                <option value="rect">Rectangle</option>
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
              guests.map((guest) => {
                const selected = selectedTable.guestIds.includes(guest.id);
                return (
                  <button
                    key={guest.id}
                    className={selected ? "chip selected" : "chip"}
                    type="button"
                    onClick={() => toggleGuest(selectedTable, guest.id)}
                  >
                    {guest.name || "Unnamed"}
                  </button>
                );
              })
            ) : (
              <p className="muted">Add guests first to assign seats.</p>
            )}
          </div>

          <div className="table-editor-list muted">
            {selectedTable.guestIds.length
              ? selectedTable.guestIds.map((guestId) => guestsById.get(guestId)?.name).filter(Boolean).join(", ")
              : "No guests assigned yet."}
          </div>
        </div>
      )}
    </CollapsibleSection>
  );
}
