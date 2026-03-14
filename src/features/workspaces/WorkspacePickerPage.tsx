import { useState } from "react";

import { badgeClass } from "../../utils/badgeClass";
import type { PendingInvite, WorkspaceSummary } from "../../types/wedding";

interface Props {
  workspaces: WorkspaceSummary[];
  pendingInvites: PendingInvite[];
  loading: boolean;
  error: string;
  onSelect: (ws: WorkspaceSummary) => void;
  onCreate: () => Promise<void>;
  onSignOut: () => void;
  onAccept: (memberId: string) => Promise<void>;
  onDecline: (memberId: string) => Promise<void>;
  onDelete: (weddingId: string) => Promise<void>;
}

export function WorkspacePickerPage({
  workspaces,
  pendingInvites,
  loading,
  error,
  onSelect,
  onCreate,
  onSignOut,
  onAccept,
  onDecline,
  onDelete,
}: Props) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1>Your Weddings</h1>
        <button className="btn secondary" onClick={onSignOut}>Sign Out</button>
      </div>

      {loading && <p className="muted">Loading workspaces...</p>}
      {error && <p className="muted">{error}</p>}

      {!loading && pendingInvites.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ marginBottom: "0.75rem" }}>Pending Invitations</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {pendingInvites.map((invite) => (
              <div key={invite.memberId} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{invite.title || "Untitled Wedding"}</div>
                  {(invite.partnerOne || invite.partnerTwo) && (
                    <div className="muted">
                      Planning for {invite.partnerOne}{invite.partnerOne && invite.partnerTwo ? " & " : ""}{invite.partnerTwo}
                    </div>
                  )}
                  <span className={badgeClass(invite.role)}>{invite.role}</span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="btn" type="button" onClick={() => onAccept(invite.memberId)}>Accept</button>
                  <button className="btn secondary" type="button" onClick={() => onDecline(invite.memberId)}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && workspaces.length === 0 && pendingInvites.length === 0 && !error && (
        <div className="card">
          <p className="muted">No workspaces yet.</p>
          <button className="btn" onClick={onCreate}>Create Wedding Workspace</button>
        </div>
      )}

      {!loading && workspaces.length > 0 && (
        <>
          <h2 style={{ marginBottom: "0.75rem" }}>Your Workspaces</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {workspaces.map((ws) => (
              <div key={ws.weddingId} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{ws.title || "Untitled Wedding"}</div>
                  {(ws.partnerOne || ws.partnerTwo) && (
                    <div className="muted">
                      Planning for {ws.partnerOne}{ws.partnerOne && ws.partnerTwo ? " & " : ""}{ws.partnerTwo}
                    </div>
                  )}
                  <span className={badgeClass(ws.role)}>{ws.role}</span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  {ws.role === "owner" && confirmDeleteId !== ws.weddingId && (
                    <button
                      className="btn secondary"
                      type="button"
                      onClick={() => setConfirmDeleteId(ws.weddingId)}
                    >
                      Delete
                    </button>
                  )}
                  {ws.role === "owner" && confirmDeleteId === ws.weddingId && (
                    <>
                      <span className="muted" style={{ fontSize: "0.85rem" }}>Delete permanently?</span>
                      <button
                        className="btn"
                        type="button"
                        style={{ background: "var(--color-danger, #c0392b)" }}
                        onClick={() => { setConfirmDeleteId(null); onDelete(ws.weddingId); }}
                      >
                        Yes, delete
                      </button>
                      <button
                        className="btn secondary"
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  <button className="btn" type="button" onClick={() => onSelect(ws)}>Open →</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && (workspaces.length > 0 || pendingInvites.length > 0 || !!error) && (
        <div style={{ marginTop: "1rem" }}>
          <button className="btn secondary" onClick={onCreate}>+ New Workspace</button>
        </div>
      )}
    </div>
  );
}
