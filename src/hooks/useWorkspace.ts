import type { User } from "@supabase/supabase-js";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useState } from "react";

import {
  getOrCreateWorkspace,
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
  workspaceId: string;
  workspaceRole: WorkspaceRole;
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
  options: UseWorkspaceOptions,
): WorkspaceHook {
  const { onServerState, setStatusMessage, getWeddingTitle } = options;

  const [workspaceId, setWorkspaceId] = useState("");
  const [workspaceRole, setWorkspaceRole] = useState<WorkspaceRole>("editor");
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

  const loadWorkspace = useCallback(async () => {
    if (!user) return;
    setWorkspaceLoading(true);
    setAppError("");
    try {
      const workspace = await getOrCreateWorkspace(user);
      setWorkspaceId(workspace.weddingId);
      setWorkspaceRole(workspace.role ?? "editor");
      onServerState(workspace.data, workspace.updatedAt ?? "");
      setStatusMessage("Workspace ready.");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to load workspace.";
      setAppError(msg);
    } finally {
      setWorkspaceLoading(false);
    }
  }, [user, onServerState, setStatusMessage]);

  // Reset state on logout, load workspace on login
  useEffect(() => {
    if (!user) {
      setWorkspaceId("");
      setWorkspaceRole("editor");
      setMembers([]);
      setAppError("");
      return;
    }
    loadWorkspace();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
    workspaceId,
    workspaceRole,
    workspaceLoading,
    membersLoading,
    members,
    appError,
    retryLoad: loadWorkspace,
    refreshFromServer,
    handleInvite,
    handleRemove,
  };
}
