import { useAppStore } from "../../store/useAppStore";
import { Gauge } from "../../components/ui/Gauge";
import { Card } from "../../components/ui/Card";
import { ContingencyCard } from "./ContingencyCard";

export function BriefDashboard() {
  const { briefing, mode } = useAppStore();

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
            <strong>{briefing.energy.toUpperCase()}</strong>
            <p className="muted">We’ll keep the important moments visible and help you adapt without adding noise.</p>
          </div>
        </div>
      </Card>

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
    </section>
  );
}
