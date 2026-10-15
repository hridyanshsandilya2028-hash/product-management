import { supabase } from "./supabaseClient";
import { defaultProfile } from "../data/mockProfiles";
import type { Profile } from "../types";

interface ProfileRow {
  display_name: string | null;
  mode: Profile["mode"];
  risk_tolerance: number;
  backup_contacts: Profile["backupContacts"];
  custom_situations: Profile["customSituations"];
}

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
    display_name: profile.displayName,
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

export async function loadCurrentUserProfile() {
  const userId = await getCurrentUserId();
  if (!userId || !supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, mode, risk_tolerance, backup_contacts, custom_situations")
    .eq("id", userId)
    .maybeSingle<ProfileRow>();

  if (error) throw new Error(`Unable to load profile: ${error.message}`);
  if (!data) return null;

  return {
    displayName: data.display_name ?? defaultProfile.displayName,
    mode: data.mode,
    riskTolerance: data.risk_tolerance,
    backupContacts: data.backup_contacts,
    customSituations: data.custom_situations,
  } satisfies Profile;
}
