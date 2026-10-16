import { addMinutes, differenceInMinutes, format, parseISO } from "date-fns";
import { useMemo, useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import { Card } from "../../components/ui/Card";
import type { Situation } from "../../types";
import { buildEnergyGuide, buildTaskPlan } from "../../engine/riskEngine";

type PlanEntry = {
  id: string;
  type: "event" | "buffer";
  title: string;
  start: string;
  end: string;
  location?: string;
  risks: Situation[];
  taskPlan?: ReturnType<typeof buildTaskPlan>;
  note?: string;
};

const prepChecklist = [
  "Charge your phone and keep a backup cable in reach",
  "Check the rain window and any route delays before leaving",
  "Add a 10-minute buffer before the highest-risk block",
  "Move one optional task into a lighter part of the day",
];

function formatTime(value: string): string {
  return format(parseISO(value), "h:mm a");
}

export function PlanPage() {
  const { briefing, profile } = useAppStore();
  const energyGuide = useMemo(() => buildEnergyGuide(briefing.energy, profile.dayEvents), [briefing.energy, profile.dayEvents]);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const planEntries = useMemo<PlanEntry[]>(() => {
    const byEvent = new Map<string, Situation[]>();

    briefing.situations.forEach((situation) => {
      if (!situation.relatedEventId) {
        return;
      }
      const list = byEvent.get(situation.relatedEventId) ?? [];
      list.push(situation);
      byEvent.set(situation.relatedEventId, list);
    });

    const events = [...profile.dayEvents].sort(
      (a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime(),
    );

    const entries: PlanEntry[] = events.map((event) => ({
      id: event.id,
      type: "event",
      title: event.title,
      start: event.start,
      end: event.end,
      location: event.location,
      risks: byEvent.get(event.id) ?? [],
      taskPlan: buildTaskPlan(event),
      note: event.outdoor ? "Outdoor block" : "Indoor block",
    }));

    for (let index = 0; index < events.length - 1; index += 1) {
      const current = events[index];
      const next = events[index + 1];
      const gapMinutes = differenceInMinutes(parseISO(next.start), parseISO(current.end));

      if (gapMinutes <= 0) {
        continue;
      }

      entries.push({
        id: `buffer-${current.id}-${next.id}`,
        type: "buffer",
        title: "Auto buffer",
        start: current.end,
        end: addMinutes(parseISO(current.end), Math.min(15, gapMinutes)).toISOString(),
        risks: [],
        note: gapMinutes >= 20 ? "Recovery window" : "Short reset",
      });
    }

    return entries.sort(
      (a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime(),
    );
  }, [briefing.situations, profile.dayEvents]);

  const toggleExpand = (id: string) => {
    setExpandedIds((current) => ({ ...current, [id]: !current[id] }));
  };

  return (
    <section className="plan-shell">
      <header className="plan-header">
        <div>
          <p className="eyebrow">TODAY</p>
          <h1>Day plan</h1>
        </div>
        <span className="pill">AUTO-BUFFERED</span>
      </header>

      <Card className="plan-card">
        <div className="plan-card-header">
          <p className="eyebrow">TIMELINE</p>
          <span className="muted">{planEntries.length} blocks</span>
        </div>

        <div className="plan-timeline" aria-label="Daily timeline">
          {planEntries.map((entry) => {
            const riskCount = entry.risks.length;
            const isExpanded = !!expandedIds[entry.id];

            return (
              <div key={entry.id} className={`timeline-item ${entry.type}`}>
                <div className="timeline-marker" aria-hidden="true" />
                <div className={`timeline-card ${entry.type === "buffer" ? "buffer-card" : ""}`}>
                  <div className="timeline-header">
                    <div>
                      <p className="eyebrow">{entry.type === "buffer" ? "BUFFER" : "EVENT"}</p>
                      <h3>{entry.title}</h3>
                    </div>
                    {riskCount > 0 && (
                      <button
                        type="button"
                        className="button button-secondary timeline-toggle"
                        aria-expanded={isExpanded}
                        onClick={() => toggleExpand(entry.id)}
                      >
                        {riskCount} risk{riskCount > 1 ? " flags" : " flag"}
                      </button>
                    )}
                  </div>

                  <div className="timeline-meta">
                    <span>{formatTime(entry.start)}–{formatTime(entry.end)}</span>
                    {entry.location && <span>{entry.location}</span>}
                  </div>

                  {entry.note && <p className="muted timeline-note">{entry.note}</p>}

                  {entry.taskPlan && (
                    <div className="task-plan">
                      <strong>To keep this task on track</strong>
                      <ul className="prep-list">
                        {entry.taskPlan.successSteps.map((step) => <li key={step}>{step}</li>)}
                      </ul>
                      <p className="eyebrow">IF IT SLIPS</p>
                      <p className="muted">{entry.taskPlan.planA[0]} · Otherwise: {entry.taskPlan.planB[0]}</p>
                      <p className="timeline-checkpoint"><strong>Checkpoint:</strong> {entry.taskPlan.checkpoint}</p>
                      <p className="muted"><strong>Fuel:</strong> {entry.taskPlan.energyTip}</p>
                    </div>
                  )}

                  {isExpanded && riskCount > 0 && (
                    <div className="risk-stack" aria-live="polite">
                      {entry.risks.map((risk) => (
                        <div key={risk.id} className="risk-flag">
                          <span className={`status-dot status-${risk.impact}`} aria-hidden="true" />
                          <div>
                            <strong>{risk.title}</strong>
                            <span>{risk.likelihood}% likelihood · {risk.category}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="energy-guide-card">
        <div className="plan-card-header">
          <p className="eyebrow">ENERGY PLAN</p>
          <span className="muted">{briefing.energy}</span>
        </div>
        <h3>{energyGuide.headline}</h3>
        <p className="muted">{energyGuide.timing}</p>
        <div className="energy-guide-grid">
          <div><strong>Eat</strong><ul className="prep-list">{energyGuide.foods.map((food) => <li key={food}>{food}</li>)}</ul></div>
          <div><strong>Keep steady</strong><p className="muted">{energyGuide.hydration}</p><p className="muted">{energyGuide.recovery}</p></div>
        </div>
      </Card>

      <Card className="prep-card">
        <div className="plan-card-header">
          <p className="eyebrow">PREP</p>
          <span className="muted">Tomorrow</span>
        </div>
        <h3>Tomorrow&apos;s prep checklist</h3>
        <ul className="prep-list">
          {prepChecklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
