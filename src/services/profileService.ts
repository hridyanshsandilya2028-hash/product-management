import { supabase } from "./supabaseClient";
import { defaultProfile } from "../data/mockProfiles";
import type { Profile } from "../types";

const seededSituationIds = new Set(["custom-1", "custom-2"]);
const seededEventIds = new Set(["evt-1", "evt-2", "evt-3", "evt-4", "evt-5"]);

function removeSeededExamples(profile: Profile): Profile {
  return {
    ...profile,
    dayEvents: profile.dayEvents.filter((event) => !seededEventIds.has(event.id)),
    customSituations: profile.customSituations.filter((situation) => !seededSituationIds.has(situation.id)),
  };
}

interface ProfileRow {
  display_name: string | null;
  age_group: Profile["ageGroup"] | null;
  day_description: string | null;
  day_priorities: string[] | null;
  day_events: Profile["dayEvents"] | null;
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
    if (error.message.toLowerCase().includes("session missing")) {
      return null;
    }
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
    age_group: profile.ageGroup,
    day_description: profile.dayDescription,
    day_priorities: profile.dayPriorities,
    day_events: profile.dayEvents,
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
    .select("display_name, age_group, day_description, day_priorities, day_events, mode, risk_tolerance, backup_contacts, custom_situations")
    .eq("id", userId)
    .maybeSingle<ProfileRow>();

  if (error) throw new Error(`Unable to load profile: ${error.message}`);
  if (!data) return null;

  return removeSeededExamples({
    displayName: data.display_name ?? defaultProfile.displayName,
    ageGroup: data.age_group ?? defaultProfile.ageGroup,
    dayDescription: data.day_description ?? defaultProfile.dayDescription,
    dayPriorities: data.day_priorities ?? defaultProfile.dayPriorities,
    dayEvents: data.day_events ?? defaultProfile.dayEvents,
    mode: data.mode,
    riskTolerance: data.risk_tolerance,
    backupContacts: data.backup_contacts,
    customSituations: data.custom_situations,
  } satisfies Profile);
}
