import React, { useState } from "react";
import CollapsibleSection from "./CollapsibleSection";

export default function CollaboratorsSection({
  role,
  userEmail,
  members,
  loading,
  onInvite,
  onRemove,
  collapseSignal,
  statusMessage
}) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isOwner = role === "owner";

  async function submitInvite(event) {
    event.preventDefault();
    if (!isOwner || !inviteEmail.trim()) {
      return;
    }
    setSubmitting(true);
    await onInvite(inviteEmail.trim());
    setInviteEmail("");
    setSubmitting(false);
  }

  return (
    <CollapsibleSection title="Collaborators" collapseSignal={collapseSignal}>
      <p className="muted">
        Role: <strong>{role || "editor"}</strong> • Signed in as {userEmail || "Unknown"}
      </p>
      {statusMessage && <p className="muted">{statusMessage}</p>}

      {isOwner && (
        <form className="inline-form collaborators-form" onSubmit={submitInvite}>
          <input
            type="email"
            placeholder="Invite email"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
            required
          />
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? "Inviting..." : "Invite Editor"}
          </button>
        </form>
      )}

      <div className="stack">
        {loading ? (
          <p className="muted">Loading collaborators...</p>
        ) : members.length ? (
          members.map((member) => (
            <article className="row" key={member.id}>
              <div>
                <strong>{member.invited_email}</strong>
                <p className="muted">
                  {member.role} • {member.status}
                </p>
              </div>
              {isOwner && member.role !== "owner" ? (
                <div className="row-actions">
                  <button className="btn danger" type="button" onClick={() => onRemove(member.id)}>
                    Remove
                  </button>
                </div>
              ) : null}
            </article>
          ))
        ) : (
          <p className="muted">No collaborators yet.</p>
        )}
      </div>
    </CollapsibleSection>
  );
}
