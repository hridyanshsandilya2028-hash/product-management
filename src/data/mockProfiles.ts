import type { Contact, Profile } from "../types";

const defaultContacts: Contact[] = [
  { id: "c1", name: "Jamie", phone: "+1-555-0101", relationship: "Partner" },
  { id: "c2", name: "Casey", phone: "+1-555-0142", relationship: "Coworker" },
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
  customSituations: [],
  whatsappPhone: "",
  whatsappOptIn: false,
};
