import defaultData from "../data/defaultWeddingData.json";
import { supabase } from "../lib/supabaseClient";
import { normalizeData } from "../utils/storage";

function requireClient() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
  return supabase;
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function toWeddingData(row) {
  return normalizeData({
    meta: row.meta,
    tasks: row.tasks,
    vendors: row.vendors,
    guests: row.guests,
    tables: row.tables,
    budget: row.budget
  });
}

async function findActiveMembership(userId) {
  const client = requireClient();
  const { data, error } = await client
    .from("wedding_members")
    .select("id,wedding_id,role,status,user_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data || null;
}

async function activatePendingInvite(user) {
  const client = requireClient();
  const email = normalizeEmail(user.email);
  if (!email) {
    return;
  }

  const { data, error } = await client
    .from("wedding_members")
    .select("id")
    .eq("status", "pending")
    .eq("invited_email", email)
    .is("user_id", null)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    return;
  }

  const { error: updateError } = await client
    .from("wedding_members")
    .update({ status: "active", user_id: user.id })
    .eq("id", data.id);

  if (updateError) {
    throw updateError;
  }
}

async function createWorkspaceForOwner(user) {
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
      budget: payload.budget
    })
    .select("id,updated_at,meta,tasks,vendors,guests,tables,budget")
    .single();

  if (weddingError) {
    throw weddingError;
  }

  const { error: memberError } = await client.from("wedding_members").insert({
    wedding_id: wedding.id,
    user_id: user.id,
    invited_email: normalizedEmail,
    role: "owner",
    status: "active",
    invited_by_user_id: user.id
  });

  if (memberError) {
    throw memberError;
  }

  return {
    weddingId: wedding.id,
    role: "owner",
    row: wedding
  };
}

export async function getWorkspaceByMembership(user) {
  const client = requireClient();
  if (!user?.id) {
    throw new Error("User is required.");
  }

  await activatePendingInvite(user);
  let membership = await findActiveMembership(user.id);

  if (!membership) {
    const created = await createWorkspaceForOwner(user);
    return {
      weddingId: created.weddingId,
      role: created.role,
      updatedAt: created.row.updated_at,
      data: toWeddingData(created.row)
    };
  }

  const { data: wedding, error: weddingError } = await client
    .from("weddings")
    .select("id,updated_at,meta,tasks,vendors,guests,tables,budget")
    .eq("id", membership.wedding_id)
    .single();

  if (weddingError) {
    throw weddingError;
  }

  return {
    weddingId: wedding.id,
    role: membership.role,
    updatedAt: wedding.updated_at,
    data: toWeddingData(wedding)
  };
}

export async function getOrCreateWorkspace(user) {
  return getWorkspaceByMembership(user);
}

export async function refreshWedding(weddingId) {
  const client = requireClient();
  const { data, error } = await client
    .from("weddings")
    .select("id,updated_at,meta,tasks,vendors,guests,tables,budget")
    .eq("id", weddingId)
    .single();

  if (error) {
    throw error;
  }

  return {
    updatedAt: data.updated_at,
    data: toWeddingData(data)
  };
}

export async function updateWorkspace(weddingId, nextData) {
  const client = requireClient();
  const clean = normalizeData(nextData);
  const { data, error } = await client
    .from("weddings")
    .update({
      meta: clean.meta,
      tasks: clean.tasks,
      vendors: clean.vendors,
      guests: clean.guests,
      tables: clean.tables,
      budget: clean.budget
    })
    .eq("id", weddingId)
    .select("updated_at,meta,tasks,vendors,guests,tables,budget")
    .single();

  if (error) {
    throw error;
  }

  return {
    updatedAt: data.updated_at,
    data: toWeddingData(data)
  };
}

export function subscribeWorkspace(weddingId, onChange, onStatus) {
  const client = requireClient();
  const channel = client
    .channel(`wedding-${weddingId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "weddings",
        filter: `id=eq.${weddingId}`
      },
      (payload) => {
        if (payload.new) {
          onChange({
            updatedAt: payload.new.updated_at,
            data: toWeddingData(payload.new)
          });
        }
      }
    )
    .subscribe((status) => {
      if (onStatus) {
        onStatus(status);
      }
    });

  return () => {
    client.removeChannel(channel);
  };
}

export async function listMembers(weddingId) {
  const client = requireClient();
  const { data, error } = await client
    .from("wedding_members")
    .select("id,user_id,invited_email,role,status,created_at,invited_by_user_id")
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }
  return data || [];
}

export async function inviteMember({ weddingId, email, invitedByUserId }) {
  const client = requireClient();
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error("Invite email is required.");
  }

  const { error } = await client.from("wedding_members").insert({
    wedding_id: weddingId,
    invited_email: normalizedEmail,
    role: "editor",
    status: "pending",
    invited_by_user_id: invitedByUserId
  });

  if (error) {
    throw error;
  }
}

export async function removeMember(memberId) {
  const client = requireClient();
  const { error } = await client.from("wedding_members").delete().eq("id", memberId);
  if (error) {
    throw error;
  }
}

export async function activatePendingInvitesForCurrentUser(user) {
  await activatePendingInvite(user);
}
