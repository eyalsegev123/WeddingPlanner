import { useMemo, useState } from "react";
import type { Guest, WeddingTable } from "../../types/wedding";

interface Props {
  guests: Guest[];
  tables: WeddingTable[];
}

export default function GuestSidebar({ guests, tables }: Props) {
  const [filter, setFilter] = useState("");

  const seatedIds = useMemo(
    () => new Set(tables.flatMap((t) => t.guestIds)),
    [tables],
  );

  const unassigned = useMemo(
    () => guests.filter((g) => !seatedIds.has(g.id)),
    [guests, seatedIds],
  );

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return unassigned;
    return unassigned.filter(
      (g) =>
        g.relationship.toLowerCase().includes(q) ||
        g.name.toLowerCase().includes(q),
    );
  }, [unassigned, filter]);

  // Collect distinct relationship values from ALL unassigned guests for quick-filter pills
  const relationships = useMemo(() => {
    const seen = new Set<string>();
    unassigned.forEach((g) => {
      if (g.relationship.trim()) seen.add(g.relationship.trim());
    });
    return [...seen].sort();
  }, [unassigned]);

  return (
    <div className="guest-sidebar">
      <h4>Unassigned ({unassigned.length})</h4>

      <input
        className="sidebar-filter"
        placeholder="Filter by relationship…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        style={{
          width: "100%",
          fontSize: "0.75rem",
          padding: "0.3rem 0.45rem",
          marginBottom: "0.4rem",
          border: "1px solid var(--line-strong)",
          borderRadius: "6px",
          background: "var(--surface)",
          color: "var(--text)",
          outline: "none",
        }}
      />

      {relationships.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginBottom: "0.5rem" }}>
          {filter && (
            <button
              type="button"
              onClick={() => setFilter("")}
              style={{
                fontSize: "0.65rem",
                padding: "0.15rem 0.4rem",
                border: "1px solid var(--accent)",
                borderRadius: "999px",
                background: "var(--accent)",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              ✕ clear
            </button>
          )}
          {relationships.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setFilter(r === filter ? "" : r)}
              style={{
                fontSize: "0.65rem",
                padding: "0.15rem 0.4rem",
                border: `1px solid ${r === filter ? "var(--accent)" : "var(--line-strong)"}`,
                borderRadius: "999px",
                background: r === filter ? "#faeee9" : "transparent",
                color: r === filter ? "var(--accent)" : "var(--muted)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                maxWidth: "120px",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={r}
            >
              {r}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="muted" style={{ fontSize: "0.75rem" }}>
          {unassigned.length === 0 ? "All guests are seated" : "No matches"}
        </p>
      ) : (
        <div className="chip-list" style={{ flexDirection: "column" }}>
          {filtered.map((guest) => (
            <button
              key={guest.id}
              type="button"
              className="chip guest-chip"
              draggable={true}
              onDragStart={(e) => {
                e.dataTransfer.setData("guestId", guest.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              style={{ textAlign: "left" }}
            >
              <span style={{ display: "block", fontSize: "0.82rem" }}>
                {guest.name || "Unnamed"}
              </span>
              {guest.relationship && (
                <span style={{ display: "block", fontSize: "0.65rem", color: "var(--muted)", marginTop: "1px" }}>
                  {guest.relationship}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
