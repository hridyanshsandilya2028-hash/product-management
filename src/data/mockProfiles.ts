import type { Contact, Profile, Situation } from "../types";

const defaultContacts: Contact[] = [
  { id: "c1", name: "Jamie", phone: "+1-555-0101", relationship: "Partner" },
  { id: "c2", name: "Casey", phone: "+1-555-0142", relationship: "Coworker" },
];

const defaultCustomSituations: Situation[] = [
  {
    id: "custom-1",
    title: "Battery drain during the commute",
    category: "custom",
    likelihood: 62,
    impact: "medium",
    planA: ["Phone in low-power mode", "Keep a wired backup charger ready"],
    planB: ["Skip nonessential app use", "Charge before leaving the office"],
    status: "open",
  },
  {
    id: "custom-2",
    title: "Crowd at the venue entrance",
    category: "custom",
    likelihood: 48,
    impact: "low",
    planA: ["Arrive 15 minutes early", "Use the side entrance if available"],
    planB: ["Hold the call outside", "Send a quick heads-up to teammates"],
    status: "open",
  },
];

export const defaultProfile: Profile = {
  displayName: "Ready when you are",
  ageGroup: "prefer-not-to-say",
  dayDescription: "",
  dayPriorities: [],
  dayEvents: [],
  mode: "vigilante",
  riskTolerance: 0.7,
  backupContacts: defaultContacts,
  customSituations: defaultCustomSituations,
};
