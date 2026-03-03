import { useMemo } from "react";
import type { Guest, WeddingTable } from "../../types/wedding";

interface Props {
  guests: Guest[];
  tables: WeddingTable[];
}

export default function GuestSidebar({ guests, tables }: Props) {
  const seatedIds = useMemo(
    () => new Set(tables.flatMap((t) => t.guestIds)),
    [tables],
  );
  const unassigned = useMemo(
    () => guests.filter((g) => !seatedIds.has(g.id)),
    [guests, seatedIds],
  );

  return (
    <div className="guest-sidebar">
      <h4>Unassigned</h4>
      {unassigned.length === 0 ? (
        <p className="muted" style={{ fontSize: "0.78rem" }}>
          All guests are seated
        </p>
      ) : (
        <div className="chip-list" style={{ flexDirection: "column" }}>
          {unassigned.map((guest) => (
            <button
              key={guest.id}
              type="button"
              className="chip guest-chip"
              draggable={true}
              onDragStart={(e) => {
                e.dataTransfer.setData("guestId", guest.id);
                e.dataTransfer.effectAllowed = "move";
              }}
            >
              {guest.name || "Unnamed"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
