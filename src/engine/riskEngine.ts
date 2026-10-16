import { addMinutes, differenceInMinutes, parseISO } from "date-fns";
import type { CalendarEvent, EnergyGuide, EnergyLevel, Level, Profile, Situation, TaskPlan, WeatherSnapshot } from "../types";

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

function eventText(event: CalendarEvent): string {
  return `${event.title} ${event.location ?? ""}`.toLowerCase();
}

export function buildTaskPlan(event: CalendarEvent): TaskPlan {
  const text = eventText(event);
  if (/(commute|travel|airport|train|flight|drive|transit|pickup|drop.?off)/.test(text)) {
    return {
      successSteps: ["Confirm route, pickup point, and arrival buffer", "Keep ticket, address, charger, and offline directions ready"],
      planA: ["Leave 20 minutes early and check traffic before departure", "Use the fastest route with one known fallback"],
      planB: ["Switch to transit, rideshare, or the alternate route", "Send your revised arrival time before departure"],
      checkpoint: "Re-check the route 30 minutes before leaving.",
      energyTip: "Eat a portable carb-plus-protein snack before departure so the delay does not become an energy crash.",
    };
  }
  if (/(exam|test|interview|presentation|pitch|review|deadline|submission)/.test(text)) {
    return {
      successSteps: ["Prepare the essential material first", "Set a stop time and one proofread checkpoint"],
      planA: ["Deliver the smallest complete version on time", "Keep required files, notes, and backup copies together"],
      planB: ["Submit the core result and label follow-up work", "Tell the recipient exactly what remains and when it will land"],
      checkpoint: "Stop new work 15 minutes before the deadline for a final check.",
      energyTip: "Choose a steady snack such as yogurt, fruit, or nuts; avoid relying on a large sugar hit right before performance.",
    };
  }
  if (/(meeting|standup|call|sync|client|appointment|consultation|doctor|dentist)/.test(text)) {
    return {
      successSteps: ["Choose one outcome for the block", "Bring the questions, documents, and decision details needed"],
      planA: ["Set a five-minute stopping point", "Capture decisions, owners, and next dates before leaving"],
      planB: ["Move open items to a follow-up", "Notify the next commitment with a specific revised time"],
      checkpoint: "At the midpoint, ask: what still must be decided today?",
      energyTip: "Use water and a small protein snack before the block if it sits between meals.",
    };
  }
  if (/(class|lecture|study|workout|practice|training|shift|work)/.test(text)) {
    return {
      successSteps: ["Define the one result that matters", "Set a midpoint reset if the block is longer than 90 minutes"],
      planA: ["Start with the highest-value step", "Use the planned break before focus drops"],
      planB: ["Shorten the lowest-value part", "Move unfinished work into the next available buffer"],
      checkpoint: "Take a two-minute reset at the midpoint before deciding whether to push on.",
      energyTip: "Pair complex work with a balanced meal: slow carbs, protein, and a fruit or vegetable.",
    };
  }
  return {
    successSteps: ["Define the next visible action", "Prepare the one item that could stop progress"],
    planA: ["Start on time and protect the first focused block", "Check progress at the midpoint"],
    planB: ["Reduce the task to its essential outcome", "Reschedule the nonessential remainder"],
    checkpoint: "Review progress halfway through and remove one nonessential step if needed.",
    energyTip: "Keep water nearby and use a simple protein-and-fiber snack if the block crosses a meal.",
  };
}

export function buildEnergyGuide(energy: EnergyLevel, events: CalendarEvent[]): EnergyGuide {
  const totalMinutes = events.reduce((sum, event) => sum + differenceInMinutes(parseISO(event.end), parseISO(event.start)), 0);
  if (energy === "low") {
    return {
      headline: "Protect your baseline before you push.",
      timing: totalMinutes >= 360 ? "Eat something substantial before the longest block, then plan a small snack every 3–4 hours." : "Start with food and water before the first demanding block.",
      foods: ["Oats, eggs, or yogurt with fruit for a steady start", "A portable snack: banana with nuts, hummus with crackers, or a protein bar", "A proper meal with protein, slow carbs, and vegetables before the final stretch"],
      hydration: "Drink a glass of water now, then keep a bottle visible and sip through the day.",
      recovery: "If your energy drops, take 10 minutes, eat the prepared snack, and move one optional task rather than forcing the whole plan.",
    };
  }
  if (energy === "high") {
    return {
      headline: "Use the extra energy without spending tomorrow's.",
      timing: "Put your hardest block before the midpoint, then protect a real meal and a short reset.",
      foods: ["Protein plus slow carbs before deep work or exercise", "Fruit, yogurt, nuts, or a sandwich instead of skipping the next meal", "A lighter evening meal if the day runs long"],
      hydration: "Keep water close during high-output blocks; add electrolytes only after heavy sweating or prolonged heat.",
      recovery: "If you feel overstimulated, reduce caffeine, take a short walk, and switch to a lower-friction task.",
    };
  }
  return {
    headline: "Keep the day steady with simple fuel.",
    timing: totalMinutes >= 360 ? "Plan a meal before the longest block and one snack before the afternoon dip." : "Eat at your normal meal time and avoid letting the next block push it out.",
    foods: ["Breakfast or first meal with protein and fiber", "Fruit, nuts, yogurt, or a whole-grain snack between blocks", "A balanced meal before any evening commitment"],
    hydration: "Start with water and refill at each natural transition between events.",
    recovery: "If focus slips, take a short reset, hydrate, and restart with the smallest next action.",
  };
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

function buildSegmentRisk(event: CalendarEvent): Situation | null {
  const text = eventText(event);
  const durationMinutes = differenceInMinutes(parseISO(event.end), parseISO(event.start));
  const triggerTime = event.start;

  if (/(commute|travel|airport|train|flight|drive|transit|pickup|drop.?off)/.test(text)) {
    return {
      id: `segment-travel-${event.id}`,
      title: `Travel delay could compress ${event.title}`,
      category: "traffic",
      likelihood: 74,
      impact: "high",
      triggerTime,
      relatedEventId: event.id,
      planA: ["Check the route 30 minutes before leaving", "Leave a 20-minute arrival buffer"],
      planB: ["Switch to the fastest alternate route", "Send the revised arrival time before departure"],
      status: "open",
    };
  }

  if (/(exam|test|interview|presentation|pitch|review|deadline|submission)/.test(text)) {
    return {
      id: `segment-prep-${event.id}`,
      title: `${event.title} may lose time to last-minute preparation`,
      category: "schedule",
      likelihood: 66,
      impact: "high",
      triggerTime,
      relatedEventId: event.id,
      planA: ["Finish the essential preparation before this block", "Keep the required files, notes, or materials together"],
      planB: ["Use the shortest acceptable version", "Send a concise update if the full scope will not fit"],
      status: "open",
    };
  }

  if (/(meeting|standup|call|sync|client|appointment|consultation|doctor|dentist|interview)/.test(text)) {
    return {
      id: `segment-overrun-${event.id}`,
      title: `${event.title} could run over and delay the next block`,
      category: "schedule",
      likelihood: 58,
      impact: "medium",
      triggerTime,
      relatedEventId: event.id,
      planA: ["Choose one outcome that must be completed", "Set a stopping point 5 minutes before the end"],
      planB: ["Move open items to a follow-up", "Notify the next commitment if the block runs long"],
      status: "open",
    };
  }

  if (/(class|lecture|study|workout|practice|training|shift|work)/.test(text) && durationMinutes >= 90) {
    return {
      id: `segment-endurance-${event.id}`,
      title: `${event.title} may lose focus before it ends`,
      category: "energy",
      likelihood: 62,
      impact: "medium",
      triggerTime,
      relatedEventId: event.id,
      planA: ["Set a midpoint reset and keep water nearby", "Define the one result that makes this block worthwhile"],
      planB: ["Shorten the lowest-value part", "Move unfinished work into the next available buffer"],
      status: "open",
    };
  }

  return null;
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

    const segmentRisk = buildSegmentRisk(event);
    if (segmentRisk && segmentRisk.likelihood >= threshold) {
      situations.push(segmentRisk);
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
