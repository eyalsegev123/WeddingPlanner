import { useEffect, useMemo, useRef } from "react";
import type { Guest, WeddingTable } from "../../types/wedding";

interface DragState {
  tableId: string;
  offsetX: number;
  offsetY: number;
}

interface Props {
  tables: WeddingTable[];
  guests: Guest[];
  selectedTableId: string;
  onSelectTable: (id: string) => void;
  onPatchTable: (id: string, patch: Partial<WeddingTable>) => void;
}

export default function TableCanvas({
  tables,
  guests,
  selectedTableId,
  onSelectTable,
  onPatchTable,
}: Props) {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);

  const guestsById = useMemo(
    () => new Map(guests.map((g) => [g.id, g])),
    [guests]
  );

  function startDrag(event: React.PointerEvent, table: WeddingTable) {
    if (!gridRef.current) return;
    onSelectTable(table.id);
    const rect = gridRef.current.getBoundingClientRect();
    const tableX = ((table.x ?? 50) / 100) * rect.width;
    const tableY = ((table.y ?? 50) / 100) * rect.height;
    dragRef.current = {
      tableId: table.id,
      offsetX: event.clientX - (rect.left + tableX),
      offsetY: event.clientY - (rect.top + tableY),
    };
    document.body.classList.add("dragging-canvas");
    event.preventDefault();
  }

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      if (!dragRef.current || !gridRef.current) return;
      const rect = gridRef.current.getBoundingClientRect();
      const x = ((event.clientX - rect.left - dragRef.current.offsetX) / rect.width) * 100;
      const y = ((event.clientY - rect.top - dragRef.current.offsetY) / rect.height) * 100;
      onPatchTable(dragRef.current.tableId, {
        x: Math.round(Math.max(6, Math.min(94, x)) * 10) / 10,
        y: Math.round(Math.max(8, Math.min(92, y)) * 10) / 10,
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
    <div className="top-view-wrap" style={{ flex: 1, minWidth: 0 }}>
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
          const seats = Math.max(2, Math.min(16, table.capacity || 8));
          const isRect = (table.shape || "round") === "rect";
          const isSelected = selectedTableId === table.id;

          return (
            <button
              key={`scene-${table.id}`}
              type="button"
              className={
                isRect
                  ? `scene-table scene-table-rect${isSelected ? " selected" : ""}`
                  : `scene-table scene-table-round${isSelected ? " selected" : ""}`
              }
              style={{ left: `${table.x || 50}%`, top: `${table.y || 50}%` }}
              title={`${table.name} (${seats} seats)`}
              onPointerDown={(e) => startDrag(e, table)}
              onClick={() => onSelectTable(table.id)}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add("drag-over");
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  e.currentTarget.classList.remove("drag-over");
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove("drag-over");
                const guestId = e.dataTransfer.getData("guestId");
                if (!guestId) return;
                onPatchTable(table.id, { guestIds: [...table.guestIds, guestId] });
              }}
            >
              <span className="scene-label">{table.name}</span>
              <span className="scene-meta">
                {table.guestIds.length}/{table.capacity}
              </span>
              {table.guestIds.length > 0 && (
                <span className="scene-guests">
                  {table.guestIds
                    .map((id) => guestsById.get(id)?.name)
                    .filter(Boolean)
                    .join(", ")}
                </span>
              )}
              {Array.from({ length: seats }).map((_, i) => {
                const angle = ((Math.PI * 2) / seats) * i - Math.PI / 2;
                const rx = isRect ? 58 : 46;
                const ry = isRect ? 42 : 46;
                return (
                  <span
                    key={`${table.id}-chair-${i}`}
                    className="scene-chair"
                    style={{
                      left: `${50 + Math.cos(angle) * rx}%`,
                      top: `${50 + Math.sin(angle) * ry}%`,
                    }}
                  />
                );
              })}
            </button>
          );
        })}
      </div>
    </div>
  );
}
