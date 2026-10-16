import { create } from "zustand";
import { defaultProfile } from "../data/mockProfiles";
import { mockWeatherSnapshot } from "../data/mockWeather";
import { buildRiskFromDay } from "../engine/riskEngine";
import type { Contact, DayBriefing, Mode, Profile, Situation } from "../types";

interface AppStore {
  mode: Mode;
  profile: Profile;
  briefing: DayBriefing;
  setMode: (mode: Mode) => void;
  setProfile: (profile: Profile) => void;
  setBriefing: (briefing: DayBriefing) => void;
  setRiskTolerance: (value: number) => void;
  updateContact: (id: string, contact: Contact) => void;
  addCustomSituation: (situation: Situation) => void;
  markSituation: (id: string, status: Situation["status"]) => void;
}

const fallbackBriefing = buildRiskFromDay(mockWeatherSnapshot, [], defaultProfile, "normal", []);

export const useAppStore = create<AppStore>()((set) => ({
      mode: defaultProfile.mode,
      profile: defaultProfile,
      briefing: {
        date: mockWeatherSnapshot.date,
        riskScore: fallbackBriefing.riskScore,
        energy: "normal",
        situations: fallbackBriefing.situations.sort(
          (a, b) =>
            b.likelihood * (b.impact === "high" ? 2.4 : b.impact === "medium" ? 1.6 : 1) -
            a.likelihood * (a.impact === "high" ? 2.4 : a.impact === "medium" ? 1.6 : 1),
        ),
      },
      setMode: (mode) => {
        if (typeof document !== "undefined") {
          document.documentElement.dataset.theme = mode;
        }
        set((state) => ({
          mode,
          profile: { ...state.profile, mode },
        }));
      },
      setProfile: (profile) => {
        const personalized = buildRiskFromDay(
          mockWeatherSnapshot,
          profile.dayEvents,
          profile,
          "normal",
          profile.customSituations,
        );
        set({
          profile,
          mode: profile.mode,
          briefing: {
            date: new Date().toISOString().slice(0, 10),
            riskScore: personalized.riskScore,
            energy: "normal",
            situations: personalized.situations,
          },
        });
      },
      setBriefing: (briefing) => set({ briefing }),
      setRiskTolerance: (value) =>
        set((state) => ({ profile: { ...state.profile, riskTolerance: value } })),
      updateContact: (id, contact) =>
        set((state) => ({
          profile: {
            ...state.profile,
            backupContacts: state.profile.backupContacts.map((entry) =>
              entry.id === id ? contact : entry,
            ),
          },
        })),
      addCustomSituation: (situation) =>
        set((state) => ({
          profile: {
            ...state.profile,
            customSituations: [...state.profile.customSituations, situation],
          },
        })),
      markSituation: (id, status) =>
        set((state) => ({
          briefing: {
            ...state.briefing,
            situations: state.briefing.situations.map((situation) =>
              situation.id === id ? { ...situation, status } : situation,
            ),
          },
        })),
}));
