import type { User } from "@supabase/supabase-js";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useState } from "react";

import {
  inviteMember,
  listMembers,
  refreshWedding,
  removeMember,
} from "../services/weddingApi";
import type { WeddingData, WeddingMember, WorkspaceRole } from "../types/wedding";

interface UseWorkspaceOptions {
  onServerState: (data: WeddingData, updatedAt: string) => void;
  setStatusMessage: Dispatch<SetStateAction<string>>;
  getWeddingTitle?: () => string;
}

export interface WorkspaceHook {
  workspaceLoading: boolean;
  membersLoading: boolean;
  members: WeddingMember[];
  appError: string;
  retryLoad: () => void;
  refreshFromServer: () => Promise<void>;
  handleInvite: (email: string) => Promise<void>;
  handleRemove: (memberId: string) => Promise<void>;
}

export function useWorkspace(
  user: User | null,
  workspaceId: string | null,
  workspaceRole: WorkspaceRole,
  options: UseWorkspaceOptions,
): WorkspaceHook {
  const { onServerState, setStatusMessage, getWeddingTitle } = options;

  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [members, setMembers] = useState<WeddingMember[]>([]);
  const [appError, setAppError] = useState("");

  const loadMembers = useCallback(async (weddingId: string) => {
    setMembersLoading(true);
    try {
      const rows = await listMembers(weddingId);
      setMembers(rows);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to load collaborators.";
      setStatusMessage(msg);
    } finally {
      setMembersLoading(false);
    }
  }, [setStatusMessage]);

  // Reset state on logout
  useEffect(() => {
    if (!user) { setMembers([]); setAppError(""); }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load workspace data when a workspace is selected
  useEffect(() => {
    if (!workspaceId) { setWorkspaceLoading(false); return; }
    setWorkspaceLoading(true);
    setAppError("");
    refreshWedding(workspaceId)
      .then((result) => {
        onServerState(result.data, result.updatedAt ?? "");
        setStatusMessage("Workspace ready.");
      })
      .catch((err) => setAppError(err instanceof Error ? err.message : "Failed to load workspace."))
      .finally(() => setWorkspaceLoading(false));
  }, [workspaceId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load members when workspaceId is available
  useEffect(() => {
    if (workspaceId) loadMembers(workspaceId);
  }, [workspaceId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function refreshFromServer(): Promise<void> {
    if (!workspaceId) return;
    try {
      const result = await refreshWedding(workspaceId);
      onServerState(result.data, result.updatedAt ?? "");
      setStatusMessage("Workspace refreshed.");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Refresh failed.";
      setStatusMessage(msg);
    }
  }

  async function handleInvite(email: string): Promise<void> {
    if (!workspaceId || !user) return;
    try {
      await inviteMember({
        weddingId: workspaceId,
        email,
        invitedByUserId: user.id,
        weddingTitle: getWeddingTitle?.(),
        appUrl: window.location.origin,
      });
      await loadMembers(workspaceId);
      setStatusMessage("Invite created.");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Invite failed.";
      setStatusMessage(msg);
    }
  }

  async function handleRemove(memberId: string): Promise<void> {
    if (!workspaceId) return;
    try {
      await removeMember(memberId);
      await loadMembers(workspaceId);
      setStatusMessage("Member removed.");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Remove failed.";
      setStatusMessage(msg);
    }
  }

  return {
    workspaceLoading,
    membersLoading,
    members,
    appError,
    retryLoad: refreshFromServer,
    refreshFromServer,
    handleInvite,
    handleRemove,
  };
}
