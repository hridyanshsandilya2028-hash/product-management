import { create } from "zustand";
import { defaultProfile } from "../data/mockProfiles";
import { mockWeatherSnapshot } from "../data/mockWeather";
import { buildRiskFromDay } from "../engine/riskEngine";
import type { Contact, DayBriefing, EnergyLevel, Mode, NewsSignal, Profile, Situation, WeatherSnapshot } from "../types";

interface AppStore {
  mode: Mode;
  profile: Profile;
  briefing: DayBriefing;
  weather: WeatherSnapshot;
  newsSignals: NewsSignal[];
  setMode: (mode: Mode) => void;
  setProfile: (profile: Profile) => void;
  setBriefing: (briefing: DayBriefing) => void;
  setEnergy: (energy: EnergyLevel) => void;
  setWeather: (weather: WeatherSnapshot) => void;
  setNewsSignals: (signals: NewsSignal[]) => void;
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
      weather: mockWeatherSnapshot,
      newsSignals: [],
      setMode: (mode) => {
        if (typeof document !== "undefined") {
          document.documentElement.dataset.theme = mode;
        }
        set((state) => ({
          mode,
          profile: { ...state.profile, mode },
        }));
      },
      setProfile: (profile) => set((state) => {
        const personalized = buildRiskFromDay(
          state.weather,
          profile.dayEvents,
          profile,
          "normal",
          profile.customSituations,
        );
        return {
          profile,
          mode: profile.mode,
          briefing: {
            date: state.weather.date,
            riskScore: personalized.riskScore,
            energy: "normal",
            situations: personalized.situations,
          },
        };
      }),
      setBriefing: (briefing) => set({ briefing }),
      setEnergy: (energy) =>
        set((state) => {
          const personalized = buildRiskFromDay(state.weather, state.profile.dayEvents, state.profile, energy, state.profile.customSituations);
          return { briefing: { ...state.briefing, energy, riskScore: personalized.riskScore, situations: personalized.situations } };
        }),
      setWeather: (weather) =>
        set((state) => {
          const personalized = buildRiskFromDay(weather, state.profile.dayEvents, state.profile, state.briefing.energy, state.profile.customSituations);
          return { weather, briefing: { ...state.briefing, riskScore: personalized.riskScore, situations: personalized.situations } };
        }),
      setNewsSignals: (newsSignals) => set({ newsSignals }),
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
