import type { User } from "@supabase/supabase-js";

import defaultData from "../data/defaultWeddingData.json";
import { supabase } from "../lib/supabaseClient";
import { ALL_WEDDING_DOMAINS } from "../types/wedding";
import type { PendingInvite, ServerStatePayload, WeddingData, WeddingDomain, WeddingMember, WorkspaceResult, WorkspaceRole, WorkspaceSummary } from "../types/wedding";
import { normalizeData } from "../utils/storage";

function requireClient() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

function normalizeEmail(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function toWeddingData(row: Record<string, unknown>): WeddingData {
  return normalizeData({
    meta: row.meta,
    tasks: row.tasks,
    vendors: row.vendors,
    guests: row.guests,
    tables: row.tables,
    budget: row.budget,
  });
}

async function findActiveMembership(userId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from("wedding_members")
    .select("id,wedding_id,role,status,user_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}


export async function createWorkspaceForOwner(user: User) {
  const client = requireClient();
  const normalizedEmail = normalizeEmail(user.email);
  const payload = normalizeData(defaultData);

  const { data: wedding, error: weddingError } = await client
    .from("weddings")
    .insert({
      owner_user_id: user.id,
      meta: payload.meta,
      tasks: payload.tasks,
      vendors: payload.vendors,
      guests: payload.guests,
      tables: payload.tables,
      budget: payload.budget,
    })
    .select("id,updated_at,meta,tasks,vendors,guests,tables,budget")
    .single();

  if (weddingError) throw weddingError;

  const { error: memberError } = await client.from("wedding_members").insert({
    wedding_id: wedding.id,
    user_id: user.id,
    invited_email: normalizedEmail,
    role: "owner",
    status: "active",
    invited_by_user_id: user.id,
  });

  if (memberError) throw memberError;

  return { weddingId: wedding.id as string, role: "owner" as WorkspaceRole, row: wedding };
}

export async function getOrCreateWorkspace(user: User): Promise<WorkspaceResult> {
  const client = requireClient();
  if (!user?.id) throw new Error("User is required.");

  const membership = await findActiveMembership(user.id);

  if (!membership) {
    const created = await createWorkspaceForOwner(user);
    return {
      weddingId: created.weddingId,
      role: created.role,
      updatedAt: String(created.row.updated_at ?? ""),
      data: toWeddingData(created.row as Record<string, unknown>),
    };
  }

  const { data: wedding, error: weddingError } = await client
    .from("weddings")
    .select("id,updated_at,meta,tasks,vendors,guests,tables,budget")
    .eq("id", membership.wedding_id)
    .single();

  if (weddingError) throw weddingError;

  return {
    weddingId: String(wedding.id),
    role: membership.role as WorkspaceRole,
    updatedAt: String(wedding.updated_at ?? ""),
    data: toWeddingData(wedding as Record<string, unknown>),
  };
}

export async function refreshWedding(weddingId: string): Promise<ServerStatePayload> {
  const client = requireClient();
  const { data, error } = await client
    .from("weddings")
    .select("id,updated_at,meta,tasks,vendors,guests,tables,budget")
    .eq("id", weddingId)
    .single();

  if (error) throw error;

  return {
    updatedAt: String(data.updated_at ?? ""),
    data: toWeddingData(data as Record<string, unknown>),
  };
}

export async function updateWorkspace(
  weddingId: string,
  nextData: WeddingData,
  dirtyDomains?: ReadonlySet<WeddingDomain>,
): Promise<ServerStatePayload> {
  const client = requireClient();
  const clean = normalizeData(nextData);

  const domainsToWrite =
    dirtyDomains && dirtyDomains.size > 0
      ? ALL_WEDDING_DOMAINS.filter((d) => dirtyDomains.has(d))
      : ALL_WEDDING_DOMAINS;

  const updatePayload: Partial<Record<WeddingDomain, unknown>> = {};
  for (const domain of domainsToWrite) {
    updatePayload[domain] = clean[domain];
  }

  const { data, error } = await client
    .from("weddings")
    .update(updatePayload)
    .eq("id", weddingId)
    .select("updated_at,meta,tasks,vendors,guests,tables,budget")
    .single();

  if (error) throw error;

  return {
    updatedAt: String(data.updated_at ?? ""),
    data: toWeddingData(data as Record<string, unknown>),
  };
}

export function subscribeWorkspace(
  weddingId: string,
  onChange: (payload: ServerStatePayload) => void,
  onStatus?: (status: string) => void,
): () => void {
  const client = requireClient();

  const channel = client
    .channel(`wedding-${weddingId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "weddings", filter: `id=eq.${weddingId}` },
      (payload) => {
        if (payload.new) {
          onChange({
            updatedAt: String((payload.new as Record<string, unknown>).updated_at ?? ""),
            data: toWeddingData(payload.new as Record<string, unknown>),
          });
        }
      },
    )
    .subscribe((status) => {
      onStatus?.(status);
    });

  return () => {
    client.removeChannel(channel);
  };
}

export async function listMembers(weddingId: string): Promise<WeddingMember[]> {
  const client = requireClient();
  const { data, error } = await client
    .from("wedding_members")
    .select("id,user_id,invited_email,role,status,created_at,invited_by_user_id")
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as WeddingMember[];
}

export async function inviteMember({
  weddingId,
  email,
  invitedByUserId,
  weddingTitle,
  appUrl,
}: {
  weddingId: string;
  email: string;
  invitedByUserId: string;
  weddingTitle?: string;
  appUrl?: string;
}): Promise<void> {
  const client = requireClient();
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw new Error("Invite email is required.");

  const { error } = await client.from("wedding_members").insert({
    wedding_id: weddingId,
    invited_email: normalizedEmail,
    role: "editor",
    status: "pending",
    invited_by_user_id: invitedByUserId,
  });

  if (error) throw error;

  // Send invite email — non-fatal
  try {
    await client.functions.invoke("send-invite-email", {
      body: {
        email: normalizedEmail,
        weddingTitle: weddingTitle ?? "your wedding",
        appUrl: appUrl ?? "",
      },
    });
  } catch (emailErr) {
    console.warn("Failed to send invite email:", emailErr);
  }
}

export async function removeMember(memberId: string): Promise<void> {
  const client = requireClient();
  const { error } = await client.from("wedding_members").delete().eq("id", memberId);
  if (error) throw error;
}

export async function listUserWorkspaces(userId: string): Promise<WorkspaceSummary[]> {
  const client = requireClient();
  const { data, error } = await client
    .from("wedding_members")
    .select("wedding_id, role, weddings(meta)")
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) throw error;

  return (data ?? []).map((row) => {
    const wedding = (row.weddings as unknown) as { meta: Record<string, unknown> } | null;
    const meta = wedding?.meta ?? {};
    return {
      weddingId: String(row.wedding_id),
      role: row.role as WorkspaceRole,
      title: String(meta.title ?? "Untitled Wedding"),
      partnerOne: String(meta.partnerOne ?? ""),
      partnerTwo: String(meta.partnerTwo ?? ""),
    };
  });
}

export async function listPendingInvites(email: string): Promise<PendingInvite[]> {
  const client = requireClient();
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return [];

  const { data, error } = await client
    .from("wedding_members")
    .select("id, wedding_id, role, weddings(meta)")
    .eq("status", "pending")
    .eq("invited_email", normalizedEmail)
    .is("user_id", null);

  if (error) throw error;

  return (data ?? []).map((row) => {
    const wedding = (row.weddings as unknown) as { meta: Record<string, unknown> } | null;
    const meta = wedding?.meta ?? {};
    return {
      memberId: String(row.id),
      weddingId: String(row.wedding_id),
      role: row.role as WorkspaceRole,
      title: String(meta.title ?? "Untitled Wedding"),
      partnerOne: String(meta.partnerOne ?? ""),
      partnerTwo: String(meta.partnerTwo ?? ""),
    };
  });
}

export async function acceptInvite(memberId: string, userId: string): Promise<void> {
  const client = requireClient();
  const { error } = await client
    .from("wedding_members")
    .update({ status: "active", user_id: userId })
    .eq("id", memberId);

  if (error) throw error;
}

export async function declineInvite(memberId: string): Promise<void> {
  const client = requireClient();
  const { error } = await client
    .from("wedding_members")
    .update({ status: "declined" })
    .eq("id", memberId);

  if (error) throw error;
}

export async function deleteWorkspace(weddingId: string): Promise<void> {
  const client = requireClient();
  const { error } = await client
    .from("weddings")
    .delete()
    .eq("id", weddingId);

  if (error) throw error;
}
