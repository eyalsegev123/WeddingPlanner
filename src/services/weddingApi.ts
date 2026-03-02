import type { User } from "@supabase/supabase-js";

import defaultData from "../data/defaultWeddingData.json";
import { supabase } from "../lib/supabaseClient";
import type { ServerStatePayload, WeddingData, WeddingDomain, WeddingMember, WorkspaceResult, WorkspaceRole } from "../types/wedding";
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

async function activatePendingInvite(user: User): Promise<void> {
  const client = requireClient();
  const email = normalizeEmail(user.email);
  if (!email) return;

  const { data, error } = await client
    .from("wedding_members")
    .select("id")
    .eq("status", "pending")
    .eq("invited_email", email)
    .is("user_id", null)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return;

  const { error: updateError } = await client
    .from("wedding_members")
    .update({ status: "active", user_id: user.id })
    .eq("id", data.id);

  if (updateError) throw updateError;
}

async function createWorkspaceForOwner(user: User) {
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

  await activatePendingInvite(user);
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

  const allDomains: WeddingDomain[] = ["meta", "guests", "tables", "tasks", "budget", "vendors"];
  const domainsToWrite =
    dirtyDomains && dirtyDomains.size > 0
      ? allDomains.filter((d) => dirtyDomains.has(d))
      : allDomains;

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
}: {
  weddingId: string;
  email: string;
  invitedByUserId: string;
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
}

export async function removeMember(memberId: string): Promise<void> {
  const client = requireClient();
  const { error } = await client.from("wedding_members").delete().eq("id", memberId);
  if (error) throw error;
}
