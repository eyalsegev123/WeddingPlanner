import React, { useMemo, useState } from "react";

import CollapsibleSection from "../../shared/components/CollapsibleSection";
import DataTable, { ColumnDef, SortDir } from "../../shared/components/DataTable";
import { badgeClass } from "../../utils/badgeClass";
import type { CollapseSignal, WeddingMember, WorkspaceRole } from "../../types/wedding";

interface Props {
  role: WorkspaceRole;
  userEmail: string | undefined;
  members: WeddingMember[];
  loading: boolean;
  onInvite: (email: string) => Promise<void>;
  onRemove: (memberId: string) => Promise<void>;
  collapseSignal?: CollapseSignal;
  statusMessage?: string;
}

export default function CollaboratorsSection({
  role,
  userEmail,
  members,
  loading,
  onInvite,
  onRemove,
  collapseSignal,
  statusMessage,
}: Props) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const isOwner = role === "owner";

  async function submitInvite(event: React.FormEvent) {
    event.preventDefault();
    if (!isOwner || !inviteEmail.trim()) return;
    setSubmitting(true);
    await onInvite(inviteEmail.trim());
    setInviteEmail("");
    setSubmitting(false);
  }

  function handleSort(key: string) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const sortedMembers = useMemo(() => {
    if (!sortKey) return members;
    return [...members].sort((a, b) => {
      const av = String((a as unknown as Record<string, unknown>)[sortKey] ?? "");
      const bv = String((b as unknown as Record<string, unknown>)[sortKey] ?? "");
      const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: "base" });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [members, sortKey, sortDir]);

  const columns: ColumnDef<WeddingMember>[] = [
    {
      key: "invited_email",
      label: "Email",
      sortable: true,
      width: "240px",
      render: (m) => <strong>{m.invited_email}</strong>,
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
      width: "110px",
      render: (m) => <span className={badgeClass(m.role)}>{m.role}</span>,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      width: "120px",
      render: (m) => <span className={badgeClass(m.status)}>{m.status}</span>,
    },
    {
      key: "_actions",
      label: "",
      width: "110px",
      render: (m) =>
        isOwner && m.role !== "owner" ? (
          <button className="btn danger" type="button" onClick={() => onRemove(m.id)}>
            Remove
          </button>
        ) : null,
    },
  ];

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
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? "Inviting..." : "Invite Editor"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="muted">Loading collaborators...</p>
      ) : (
        <DataTable
          columns={columns}
          rows={sortedMembers}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          getRowKey={(m) => m.id}
          emptyText="No collaborators yet."
        />
      )}
    </CollapsibleSection>
  );
}
