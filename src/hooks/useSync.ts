import type { Dispatch, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";

import { subscribeWorkspace, updateWorkspace } from "../services/weddingApi";
import type { ServerStatePayload, SyncState, WeddingData } from "../types/wedding";
import { normalizeData } from "../utils/storage";

interface UseSyncOptions {
  onServerState: (data: WeddingData, updatedAt: string) => void;
  onSaveClear: () => void;
  setStatusMessage: Dispatch<SetStateAction<string>>;
}

const SAVE_DEBOUNCE_MS = 280;
const REMOTE_NOTICE_MS = 2400;

export interface SyncHook {
  syncState: SyncState;
}

export function useSync(
  workspaceId: string,
  data: WeddingData,
  hasPendingSave: boolean,
  options: UseSyncOptions,
): SyncHook {
  const { onServerState, onSaveClear, setStatusMessage } = options;
  const [syncState, setSyncState] = useState<SyncState>("idle");

  const saveTimerRef = useRef<number | null>(null);
  const remoteNoticeTimerRef = useRef<number | null>(null);
  const remoteApplyRef = useRef(false);
  const hasPendingSaveRef = useRef(hasPendingSave);
  const lastUpdatedAtRef = useRef("");
  const lastServerDataRef = useRef<WeddingData | null>(null);
  const queuedRemoteUpdateRef = useRef<ServerStatePayload | null>(null);

  // Keep ref in sync with state for use inside async callbacks
  useEffect(() => {
    hasPendingSaveRef.current = hasPendingSave;
  }, [hasPendingSave]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (remoteNoticeTimerRef.current) clearTimeout(remoteNoticeTimerRef.current);
    };
  }, []);

  function showRemoteNotice(message: string): void {
    setStatusMessage(message);
    if (remoteNoticeTimerRef.current) clearTimeout(remoteNoticeTimerRef.current);
    remoteNoticeTimerRef.current = window.setTimeout(() => setStatusMessage(""), REMOTE_NOTICE_MS);
  }

  function applyRemoteState(nextData: WeddingData, updatedAt: string): void {
    remoteApplyRef.current = true;
    lastUpdatedAtRef.current = updatedAt;
    lastServerDataRef.current = normalizeData(nextData);
    onServerState(nextData, updatedAt);
    onSaveClear();
    setSyncState("idle");
    window.setTimeout(() => {
      remoteApplyRef.current = false;
    }, 0);
  }

  // Realtime subscription
  useEffect(() => {
    if (!workspaceId) {
      queuedRemoteUpdateRef.current = null;
      return;
    }

    const unsubscribe = subscribeWorkspace(
      workspaceId,
      (payload) => {
        if (!payload?.data) return;
        if (payload.updatedAt && payload.updatedAt === lastUpdatedAtRef.current) return;

        if (hasPendingSaveRef.current) {
          queuedRemoteUpdateRef.current = payload;
          setStatusMessage("Remote update waiting. Save completes first.");
          return;
        }

        applyRemoteState(payload.data, payload.updatedAt ?? "");
        showRemoteNotice("Updated by collaborator.");
      },
      (status) => {
        if (status === "SUBSCRIBED") {
          setStatusMessage((prev) => prev || "Realtime connected.");
        }
      },
    );

    return unsubscribe;
  }, [workspaceId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced save
  useEffect(() => {
    if (!workspaceId || !hasPendingSave || remoteApplyRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSyncState("saving");

    saveTimerRef.current = window.setTimeout(async () => {
      try {
        const result = await updateWorkspace(workspaceId, data);
        lastServerDataRef.current = result.data;
        lastUpdatedAtRef.current = result.updatedAt ?? "";
        onSaveClear();
        setSyncState("saved");
      } catch (error) {
        setSyncState("error");
        const msg = error instanceof Error ? error.message : "Save failed. Restored latest server copy.";
        setStatusMessage(msg);
        if (lastServerDataRef.current) {
          applyRemoteState(lastServerDataRef.current, lastUpdatedAtRef.current);
        }
      }
    }, SAVE_DEBOUNCE_MS);
  }, [workspaceId, hasPendingSave, data]); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply queued remote update once local save clears
  useEffect(() => {
    if (hasPendingSave || !queuedRemoteUpdateRef.current) return;

    const queued = queuedRemoteUpdateRef.current;
    queuedRemoteUpdateRef.current = null;

    if (queued.updatedAt && queued.updatedAt === lastUpdatedAtRef.current) return;

    applyRemoteState(queued.data, queued.updatedAt ?? "");
    showRemoteNotice("Updated by collaborator.");
  }, [hasPendingSave]); // eslint-disable-line react-hooks/exhaustive-deps

  return { syncState };
}
