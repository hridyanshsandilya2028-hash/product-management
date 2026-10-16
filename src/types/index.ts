export type Mode = "vigilante" | "shadow";
export type Level = "low" | "medium" | "high";
export type EnergyLevel = "low" | "normal" | "high";
export type AgeGroup = "under-18" | "18-24" | "25-44" | "45-64" | "65-plus" | "prefer-not-to-say";
export type SituationCategory =
  | "weather"
  | "traffic"
  | "battery"
  | "safety"
  | "schedule"
  | "energy"
  | "custom";

export interface Contact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export interface Situation {
  id: string;
  title: string;
  category: SituationCategory;
  likelihood: number;
  impact: Level;
  triggerTime?: string;
  relatedEventId?: string;
  planA: string[];
  planB: string[];
  status: "open" | "resolved" | "didnt_happen";
}

export interface DayBriefing {
  date: string;
  riskScore: number;
  situations: Situation[];
  energy: EnergyLevel;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  outdoor?: boolean;
}

export interface TaskPlan {
  successSteps: string[];
  planA: string[];
  planB: string[];
}

export interface DebriefEntry {
  date: string;
  predicted: number;
  correct: number;
  items: { situationId: string; happened: boolean }[];
}

export interface WeatherSnapshot {
  date: string;
  temperature: number;
  precipitationProbability: number;
  rainProbability: number;
  windSpeed: number;
  sunset: string;
  conditions: string;
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface Profile {
  displayName: string;
  ageGroup: AgeGroup;
  dayDescription: string;
  dayPriorities: string[];
  dayEvents: CalendarEvent[];
  mode: Mode;
  riskTolerance: number;
  backupContacts: Contact[];
  customSituations: Situation[];
  whatsappPhone: string;
  whatsappOptIn: boolean;
}
