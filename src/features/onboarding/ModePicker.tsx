import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Pill } from "../../components/ui/Pill";
import { useAppStore } from "../../store/useAppStore";
import { saveCurrentUserProfile } from "../../services/profileService";
import { buildRiskFromDay } from "../../engine/riskEngine";
import { mockWeatherSnapshot } from "../../data/mockWeather";
import { DaySetupForm, type DaySetup } from "./DaySetupForm";
import type { Situation } from "../../types";

type Mode = "vigilante" | "shadow";

function curateConcernPlan(concern: string): Pick<Situation, "planA" | "planB" | "likelihood" | "impact"> {
  const normalized = concern.toLowerCase();
  if (normalized.includes("rain") || normalized.includes("weather") || normalized.includes("storm")) {
    return {
      likelihood: 72,
      impact: "medium",
      planA: ["Check the forecast before the relevant block", "Pack a waterproof layer or move the activity indoors"],
      planB: ["Delay the outdoor step", "Use the nearest covered route and notify anyone waiting"],
    };
  }
  if (normalized.includes("traffic") || normalized.includes("commute") || normalized.includes("travel")) {
    return {
      likelihood: 76,
      impact: "high",
      planA: ["Leave a 20-minute travel buffer", "Check the route before departing"],
      planB: ["Switch to the fastest available route", "Tell the next person your revised arrival time"],
    };
  }
  if (normalized.includes("battery") || normalized.includes("charge") || normalized.includes("phone")) {
    return {
      likelihood: 68,
      impact: "medium",
      planA: ["Charge before the busiest part of the day", "Keep a cable or power bank within reach"],
      planB: ["Enable low-power mode", "Reserve the phone for essential calls and navigation"],
    };
  }
  return {
    likelihood: 62,
    impact: "medium",
    planA: [`Define the first small fallback step for ${normalized}`, "Protect a short buffer before the affected commitment"],
    planB: ["Reduce the nonessential part of the task", "Communicate early and reschedule what can wait"],
  };
}

export function ModePicker() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("vigilante");
  const { profile, setProfile, setBriefing } = useAppStore();

  function chooseMode(nextMode: Mode) {
    setMode(nextMode);
    document.documentElement.dataset.theme = nextMode;
  }

  async function enterApp(setup: DaySetup) {
    const concernSituations = setup.concerns
      .split(",")
      .map((concern, index): Situation | null => {
        const title = concern.trim();
        if (!title) return null;
        const curatedPlan = curateConcernPlan(title);
        return {
          id: `concern-${Date.now()}-${index}`,
          title: `Possible issue: ${title}`,
          category: "custom",
          ...curatedPlan,
          status: "open",
        };
      })
      .filter((item): item is Situation => Boolean(item));
    const nextProfile = {
      ...profile,
      mode,
      ageGroup: setup.ageGroup,
      dayDescription: setup.dayDescription.trim(),
      dayPriorities: setup.priorities.split(",").map((item) => item.trim()).filter(Boolean),
      dayEvents: setup.events,
      customSituations: concernSituations,
    };
    const briefing = buildRiskFromDay(mockWeatherSnapshot, setup.events, nextProfile, "normal", concernSituations);
    setProfile(nextProfile);
    setBriefing({ date: new Date().toISOString().slice(0, 10), riskScore: briefing.riskScore, energy: "normal", situations: briefing.situations });
    try {
      await saveCurrentUserProfile(nextProfile);
    } catch (error) {
      console.error("Unable to save personalized day plan", error);
    }
    navigate("/brief");
  }

  return (
    <main className="onboarding">
      <div className="onboarding-mark" aria-hidden="true">
        <span>CG</span>
      </div>
      <p className="eyebrow">CONTINGENCY GENIUS / 01</p>
      <h1>Stay ready<br /><em>for anything.</em></h1>
      <p className="onboarding-copy">Tell us what today holds. We’ll spot the pressure points and build useful Plan A and Plan B options around your real day.</p>
      <div className="mode-list" role="radiogroup" aria-label="Choose your operating mode">
        <ModeCard
          mode="vigilante"
          selected={mode === "vigilante"}
          title="Vigilante"
          description="Direct, alert, and always one step ahead."
          onSelect={() => chooseMode("vigilante")}
        />
        <ModeCard
          mode="shadow"
          selected={mode === "shadow"}
          title="Shadow"
          description="Quiet confidence with a softer edge."
          onSelect={() => chooseMode("shadow")}
        />
      </div>
      <DaySetupForm onSubmit={(setup) => void enterApp(setup)} />
      <p className="onboarding-footnote">Your day plan is private to your account and can be rebuilt anytime.</p>
    </main>
  );
}

function ModeCard({
  mode,
  selected,
  title,
  description,
  onSelect,
}: {
  mode: Mode;
  selected: boolean;
  title: string;
  description: string;
  onSelect: () => void;
}) {
  return (
    <Card
      className={`mode-card ${selected ? "selected" : ""}`}
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onSelect();
      }}
    >
      <div className={`mode-swatch ${mode}`} aria-hidden="true" />
      <div>
        <div className="mode-title-row">
          <h2>{title}</h2>
          {selected && <Pill>ACTIVE</Pill>}
        </div>
        <p>{description}</p>
      </div>
      <span className="mode-check" aria-hidden="true">{selected ? "●" : "○"}</span>
    </Card>
  );
}
