import { addMinutes, differenceInMinutes, parseISO } from "date-fns";
import type { CalendarEvent, EnergyLevel, Level, Profile, Situation, WeatherSnapshot } from "../types";

const impactWeights: Record<Level, number> = {
  low: 1,
  medium: 1.6,
  high: 2.4,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function impactToLikelihood(base: number, impact: Level): number {
  return clamp(Math.round(base * impactWeights[impact]), 8, 100);
}

function getEventStartHour(event: CalendarEvent): number {
  return parseISO(event.start).getHours();
}

function getThreshold(profile: Profile, energy: EnergyLevel): number {
  const toleranceBoost = (profile.riskTolerance - 0.5) * 32;
  const energyShift = energy === "low" ? -12 : energy === "high" ? 10 : 0;
  return clamp(52 + toleranceBoost + energyShift, 18, 86);
}

function buildWeatherRisk(event: CalendarEvent, weather: WeatherSnapshot): Situation {
  const rainProbability = weather.rainProbability ?? weather.precipitationProbability ?? 0;
  const likelihood = clamp(Math.round(38 + rainProbability * 0.6), 40, 96);

  return {
    id: `weather-${event.id}`,
    title: `${event.title} could get rained out`,
    category: "weather",
    likelihood,
    impact: rainProbability > 80 ? "high" : "medium",
    triggerTime: event.start,
    relatedEventId: event.id,
    planA: ["Move the outdoor piece indoors or under cover", "Carry a compact rain layer and backup shoes"],
    planB: ["Shift the activity to a nearby indoor location", "Send a brief update and re-time the plan"],
    status: "open",
  };
}

function buildTrafficRisk(event: CalendarEvent): Situation | null {
  const hour = getEventStartHour(event);
  const isCommuteWindow = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19);
  if (!isCommuteWindow) {
    return null;
  }

  return {
    id: `traffic-${event.id}`,
    title: `Traffic spike on the route to ${event.title}`,
    category: "traffic",
    likelihood: 72,
    impact: "medium",
    triggerTime: event.start,
    relatedEventId: event.id,
    planA: ["Leave 15 minutes earlier than usual", "Keep a backup route ready on your phone"],
    planB: ["Use public transit or a rideshare fallback", "Move the trip to a lower-pressure window"],
    status: "open",
  };
}

function buildScheduleRisk(event: CalendarEvent, previousEvent: CalendarEvent | undefined): Situation | null {
  if (!previousEvent) {
    return null;
  }

  const gapMinutes = differenceInMinutes(parseISO(event.start), parseISO(previousEvent.end));
  if (gapMinutes <= 0 || gapMinutes > 10) {
    return null;
  }

  return {
    id: `schedule-${event.id}`,
    title: `Back-to-back commitments at ${event.title}`,
    category: "schedule",
    likelihood: 79,
    impact: "high",
    triggerTime: event.start,
    relatedEventId: event.id,
    planA: ["Cut the handoff to a 5-minute buffer", "Prepare your next item before the previous one ends"],
    planB: ["Trim the less urgent step", "Reassign or postpone the final block"],
    status: "open",
  };
}

function buildBatteryRisk(events: CalendarEvent[]): Situation | null {
  if (events.length === 0) {
    return null;
  }

  const minutesInDay = events.reduce((sum, event) => sum + differenceInMinutes(parseISO(event.end), parseISO(event.start)), 0);
  const hasFreeGap = events.some((event, index) => {
    if (index === events.length - 1) {
      return false;
    }
    const nextStart = parseISO(events[index + 1].start);
    const currentEnd = parseISO(event.end);
    return differenceInMinutes(nextStart, currentEnd) >= 45;
  });

  if (minutesInDay < 360 || hasFreeGap) {
    return null;
  }

  return {
    id: "battery-day",
    title: "Long workday without a real break",
    category: "battery",
    likelihood: 74,
    impact: "medium",
    triggerTime: events[events.length - 1].end,
    relatedEventId: events[events.length - 1].id,
    planA: ["Charge before the final stretch", "Keep the phone in low-power mode"],
    planB: ["Trim optional tasks", "Move one block to a nearby power source"],
    status: "open",
  };
}

function buildLongCommitmentRisk(event: CalendarEvent): Situation | null {
  const durationMinutes = differenceInMinutes(parseISO(event.end), parseISO(event.start));
  if (durationMinutes < 240) {
    return null;
  }

  return {
    id: `long-${event.id}`,
    title: `${event.title} may outlast your energy`,
    category: "energy",
    likelihood: durationMinutes >= 720 ? 84 : 68,
    impact: durationMinutes >= 720 ? "high" : "medium",
    triggerTime: event.start,
    relatedEventId: event.id,
    planA: ["Schedule a real food, water, and reset break before the midpoint", "Charge devices and keep the next essential step visible"],
    planB: ["Split the commitment into smaller handoffs", "Move nonessential parts to another window and tell anyone affected"],
    status: "open",
  };
}

function buildNightTravelRisk(event: CalendarEvent, weather: WeatherSnapshot): Situation | null {
  const start = parseISO(event.start);
  const sunset = parseISO(weather.sunset);
  if (!event.outdoor || start.getTime() <= sunset.getTime()) {
    return null;
  }

  return {
    id: `night-${event.id}`,
    title: `After-dark travel for ${event.title}`,
    category: "safety",
    likelihood: 68,
    impact: "high",
    triggerTime: event.start,
    relatedEventId: event.id,
    planA: ["Share your route before leaving", "Keep your phone and a charging cable visible and ready"],
    planB: ["Ask for a ride or a walking buddy", "Delay the activity until daylight if it is not urgent"],
    status: "open",
  };
}

function mergeCustomSituations(customSituations: Situation[] = []): Situation[] {
  return customSituations.map((item) => ({
    ...item,
    status: item.status ?? "open",
  }));
}

export function generateSituations(
  weather: WeatherSnapshot,
  events: CalendarEvent[],
  profile: Profile,
  energy: EnergyLevel,
  customSituations: Situation[] = [],
): Situation[] {
  const threshold = getThreshold(profile, energy);
  const situations: Situation[] = [...mergeCustomSituations(customSituations)];

  events.forEach((event, index) => {
    const previousEvent = index > 0 ? events[index - 1] : undefined;
    const rainProbability = weather.rainProbability ?? weather.precipitationProbability ?? 0;

    if (event.outdoor && rainProbability >= 50) {
      const candidate = buildWeatherRisk(event, weather);
      if (candidate.likelihood >= threshold) {
        situations.push(candidate);
      }
    }

    const trafficRisk = buildTrafficRisk(event);
    if (trafficRisk && trafficRisk.likelihood >= threshold) {
      situations.push(trafficRisk);
    }

    const scheduleRisk = buildScheduleRisk(event, previousEvent);
    if (scheduleRisk && scheduleRisk.likelihood >= threshold) {
      situations.push(scheduleRisk);
    }

    const nightRisk = buildNightTravelRisk(event, weather);
    if (nightRisk && nightRisk.likelihood >= threshold) {
      situations.push(nightRisk);
    }

    const longCommitmentRisk = buildLongCommitmentRisk(event);
    if (longCommitmentRisk && longCommitmentRisk.likelihood >= threshold) {
      situations.push(longCommitmentRisk);
    }
  });

  const batteryRisk = buildBatteryRisk(events);
  if (batteryRisk && batteryRisk.likelihood >= threshold) {
    situations.push(batteryRisk);
  }

  return situations.map((situation) => ({
    ...situation,
    likelihood: clamp(situation.likelihood, 0, 100),
    impact: situation.impact ?? "medium",
  }));
}

export function calculateRiskScore(situations: Situation[]): number {
  if (situations.length === 0) {
    return 0;
  }

  const weightedScore = situations.reduce((total, situation) => {
    const impactMultiplier = impactWeights[situation.impact] ?? 1;
    return total + situation.likelihood * impactMultiplier;
  }, 0);

  const normalized = weightedScore / Math.max(situations.length, 1);
  return clamp(Math.round(normalized * 0.7), 0, 100);
}

export function scoreFlagForSituation(situation: Situation, energy: EnergyLevel, profile: Profile): number {
  const threshold = getThreshold(profile, energy);
  const impactWeight = impactWeights[situation.impact] ?? 1;
  const signal = situation.likelihood * impactWeight;
  return Math.round((signal / 100) * (100 - threshold) + threshold);
}

export function buildRiskFromDay(
  weather: WeatherSnapshot,
  events: CalendarEvent[],
  profile: Profile,
  energy: EnergyLevel,
  customSituations: Situation[] = [],
): { situations: Situation[]; riskScore: number } {
  const situations = generateSituations(weather, events, profile, energy, customSituations);
  return {
    situations,
    riskScore: calculateRiskScore(situations),
  };
}

export function createFallbackSituation(event: CalendarEvent): Situation {
  return {
    id: `fallback-${event.id}`,
    title: `Backup plan for ${event.title}`,
    category: "energy",
    likelihood: 58,
    impact: "low",
    triggerTime: event.start,
    relatedEventId: event.id,
    planA: ["Take a short reset before the next block", "Keep a simple fallback option ready"],
    planB: ["Drop optional tasks", "Push one task to a later window"],
    status: "open",
  };
}

export function createContingencyPlan(situation: Situation): { planA: string[]; planB: string[] } {
  return { planA: situation.planA, planB: situation.planB };
}

export function getHighRiskSituations(situations: Situation[], energy: EnergyLevel, profile: Profile): Situation[] {
  const threshold = getThreshold(profile, energy);
  return situations.filter((situation) => scoreFlagForSituation(situation, energy, profile) >= threshold);
}
