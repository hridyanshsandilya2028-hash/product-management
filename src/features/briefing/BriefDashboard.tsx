import { useAppStore } from "../../store/useAppStore";
import { Gauge } from "../../components/ui/Gauge";
import { Card } from "../../components/ui/Card";
import { ContingencyCard } from "./ContingencyCard";
import { buildEnergyGuide } from "../../engine/riskEngine";
import type { NewsSignal } from "../../types";

function explainNewsImpact(signal: NewsSignal, eventTitles: string[]): string {
  const text = `${signal.title} ${signal.summary}`.toLowerCase();
  if (/(traffic|transit|road|rail|flight|airport|strike|delay)/.test(text)) {
    const travelEvent = eventTitles.find((title) => /(travel|commute|airport|train|flight|drive|transit)/i.test(title));
    return travelEvent ? `This could compress your ${travelEvent} window, so keep an alternate route and arrival message ready.` : "This may add friction to travel; check the route before leaving and keep a fallback ready.";
  }
  if (/(storm|rain|heat|flood|snow|wind|weather)/.test(text)) {
    return "Outdoor plans may need more time or a sheltered fallback. Re-check conditions before the next exposed block.";
  }
  if (/(safety|police|emergency|outage|closure)/.test(text)) {
    return "This may change which routes or public places feel practical. Prefer well-lit, confirmed routes and keep someone informed.";
  }
  return "This is worth monitoring because it may change timing, availability, or attention around your planned commitments.";
}

export function BriefDashboard() {
  const { briefing, mode, weather, profile, newsSignals, newsStatus, newsLocationLabel, setEnergy } = useAppStore();
  const energyGuide = buildEnergyGuide(briefing.energy, profile.dayEvents);

  function handleVoiceBrief() {
    const speechWindow = typeof window !== "undefined" ? window : undefined;

    if (!speechWindow || !("speechSynthesis" in speechWindow)) {
      if (typeof window !== "undefined") {
        window.alert("Voice briefing is not supported in this browser.");
      }
      return;
    }

    const topRisks = briefing.situations.slice(0, 3);
    const lines = topRisks.map((situation, index) => {
      const planLead = situation.planA[0] ?? "Keep the backup plan ready.";
      return `Risk ${index + 1}. ${situation.title}. ${planLead}.`;
    });

    speechWindow.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(lines.join(" ") || "No risks flagged today.");
    utterance.rate = 0.95;
    utterance.pitch = 1;
    speechWindow.speechSynthesis.speak(utterance);
  }

  return (
    <section className="brief-shell">
      <header className="brief-header">
        <div>
          <p className="eyebrow">GOOD MORNING</p>
          <h1>Your day, <em>covered.</em></h1>
          <p className="muted brief-date">{briefing.date} · Here’s what deserves your attention.</p>
        </div>
        <div className="brief-mode">{mode}</div>
      </header>

      <Card className="risk-summary-card">
        <div className="card-heading-row">
          <div>
            <p className="eyebrow">TODAY AT A GLANCE</p>
            <h2>{briefing.riskScore < 35 ? "A steady day ahead" : briefing.riskScore < 65 ? "A few things to watch" : "Let’s make room for the unexpected"}</h2>
          </div>
          <span className="status-chip">{briefing.situations.length} plans</span>
        </div>
        <div className="risk-summary-top">
          <Gauge value={briefing.riskScore} label="DAY RISK" />
          <div className="risk-summary-copy">
            <p className="eyebrow">ENERGY CHECK</p>
            <div className="energy-picker" role="group" aria-label="Energy check-in">
              {(["low", "normal", "high"] as const).map((energy) => (
                <button key={energy} type="button" className={`button ${briefing.energy === energy ? "button-primary" : "button-secondary"}`} onClick={() => setEnergy(energy)}>
                  {energy}
                </button>
              ))}
            </div>
            <p className="muted">We’ll keep the important moments visible and help you adapt without adding noise.</p>
          </div>
        </div>
      </Card>

      <Card className="energy-card">
        <div className="card-heading-row">
          <div>
            <p className="eyebrow">ENERGY STRATEGY</p>
            <h2>{energyGuide.headline}</h2>
          </div>
          <span className="status-chip">{briefing.energy} fuel</span>
        </div>
        <p className="muted energy-timing">{energyGuide.timing}</p>
        <div className="energy-columns">
          <div>
            <strong>Best fuel today</strong>
            <ul className="prep-list">
              {energyGuide.foods.slice(0, 2).map((food) => <li key={food}>{food}</li>)}
            </ul>
          </div>
          <div>
            <strong>Keep steady</strong>
            <p className="muted">{energyGuide.hydration}</p>
            <p className="muted">{energyGuide.recovery}</p>
          </div>
        </div>
      </Card>

      <div className="brief-status-grid" aria-label="Day status">
        <div className="status-tile">
          <span className="status-tile-icon" aria-hidden="true">☀</span>
          <span>          <strong>{weather.temperature}°</strong><small>{weather.conditions}</small></span>
        </div>
        <div className="status-tile">
          <span className="status-tile-icon" aria-hidden="true">⌁</span>
          <span><strong>{briefing.energy}</strong><small>Energy check</small></span>
        </div>
        <div className="status-tile">
          <span className="status-tile-icon" aria-hidden="true">◷</span>
          <span><strong>{briefing.situations.length}</strong><small>Things to watch</small></span>
        </div>
      </div>

      <div className="brief-section-header">
        <div>
          <p className="eyebrow">CONTINGENCIES · YOUR BACKUP PLANS</p>
          <h2>Small moves, less stress.</h2>
        </div>
        <button type="button" className="button button-secondary brief-voice-button" onClick={handleVoiceBrief}>Read my brief</button>
      </div>

      {briefing.situations.length > 0 ? (
        <div className="contingency-list">
          {briefing.situations.slice(0, 4).map((situation) => (
            <ContingencyCard key={situation.id} situation={situation} />
          ))}
        </div>
      ) : (
        <Card className="empty-state">
          <strong>You’re in the clear.</strong>
          <p className="muted">No contingency plans are needed right now. Check back when your day changes.</p>
        </Card>
      )}

      <section className="news-section" aria-labelledby="news-heading">
        <div className="brief-section-header">
          <div>
            <p className="eyebrow">WORLD → YOUR DAY</p>
            <h2 id="news-heading">News that could change your plan.</h2>
          </div>
          <span className="status-chip">
            {newsStatus === "loading" ? "Updating…" : newsLocationLabel ? `Near ${newsLocationLabel}` : `${newsSignals.length} signals`}
          </span>
        </div>
        {newsStatus === "loading" && newsSignals.length === 0 ? (
          <Card className="empty-state">
            <strong>Finding what matters nearby…</strong>
            <p className="muted">Checking current headlines against your location and today’s schedule.</p>
          </Card>
        ) : newsSignals.length > 0 ? (
          <div className="news-list">
            {newsSignals.slice(0, 4).map((signal) => (
              <article key={`${signal.source}-${signal.title}`} className="news-item">
                <div className="news-item-top">
                  <span className={`news-severity severity-${signal.severity}`}>{signal.severity}</span>
                  <span className="muted">{signal.source}</span>
                </div>
                <h3>{signal.title}</h3>
                <p className="muted">{signal.summary}</p>
                <p className="news-impact"><strong>For you:</strong> {explainNewsImpact(signal, profile.dayEvents.map((event) => event.title))}</p>
              </article>
            ))}
          </div>
        ) : (
          <Card className="empty-state">
            <strong>{newsStatus === "error" ? "Local news is temporarily unavailable." : "No relevant local news signal yet."}</strong>
            <p className="muted">{newsStatus === "error" ? "Your plan is still available. We’ll retry when the app refreshes." : "We’ll show nearby weather, traffic, safety, and disruption headlines when available."}</p>
          </Card>
        )}
      </section>
    </section>
  );
}
