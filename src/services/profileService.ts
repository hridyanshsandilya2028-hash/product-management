import { supabase } from "./supabaseClient";
import type { Profile } from "../types";

export async function getCurrentUserId() {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw new Error(`Unable to check Supabase session: ${error.message}`);
  }

  return data.user?.id ?? null;
}

export async function saveProfile(userId: string, profile: Profile) {
  if (!supabase) {
    return { synced: false as const, reason: "Supabase is not configured." };
  }

  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    mode: profile.mode,
    risk_tolerance: profile.riskTolerance,
    backup_contacts: profile.backupContacts,
    custom_situations: profile.customSituations,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Unable to sync profile: ${error.message}`);
  }

  return { synced: true as const };
}

export async function saveCurrentUserProfile(profile: Profile) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { synced: false as const, reason: "Sign in to enable cloud sync." };
  }

  return saveProfile(userId, profile);
}
