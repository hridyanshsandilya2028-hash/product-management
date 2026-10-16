import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { useAppStore } from "../../store/useAppStore";

export function DebriefPage() {
  const navigate = useNavigate();
  const { briefing, markSituation } = useAppStore();

  const evaluated = briefing.situations.filter((situation) => situation.status !== "open");
  const unresolved = briefing.situations.filter((situation) => situation.status === "open");
  const accuracy = briefing.situations.length === 0 ? 0 : Math.round((evaluated.length / briefing.situations.length) * 100);

  return (
    <section className="debrief-shell">
      <header className="detail-header">
        <p className="eyebrow">NIGHTLY</p>
        <h1>Nightly debrief</h1>
      </header>

      <Card className="detail-card debrief-summary">
        <div className="debrief-metrics">
          <div>
            <span>Accuracy</span>
            <strong>{accuracy}%</strong>
          </div>
          <div>
            <span>Checked</span>
            <strong>{evaluated.length}</strong>
          </div>
        </div>
      </Card>

      <div className="debrief-grid">
        {briefing.situations.length > 0 ? briefing.situations.map((situation) => (
          <Card key={situation.id} className="debrief-card">
            <div className="alert-row">
              <span className={`status-dot status-${situation.impact}`} aria-hidden="true" />
              <strong>{situation.title}</strong>
            </div>

            <div className="debrief-status-row">
              <Button
                variant={situation.status === "resolved" ? "primary" : "secondary"}
                onClick={() => markSituation(situation.id, "resolved")}
              >
                Happened
              </Button>
              <Button
                variant={situation.status === "didnt_happen" ? "primary" : "secondary"}
                onClick={() => markSituation(situation.id, "didnt_happen")}
              >
                Didn’t happen
              </Button>
            </div>

            <div className="debrief-meta">
              <span>{situation.likelihood}% likelihood</span>
              <span>{situation.impact}</span>
              {situation.relatedEventId && <span>Segment-specific</span>}
            </div>
          </Card>
        )) : (
          <Card className="detail-card">
            <strong>No predictions to review.</strong>
            <p className="muted">Add today&apos;s schedule and concerns to create precise, segment-level predictions.</p>
          </Card>
        )}
      </div>

      <Card className="detail-card">
        <div className="plan-card-header">
          <p className="eyebrow">CARRY-FORWARD</p>
          <span className="muted">{unresolved.length} left open</span>
        </div>

        {unresolved.length === 0 ? (
          <p className="muted">Everything is closed out for the day.</p>
        ) : (
          <ul className="prep-list">
            {unresolved.map((item) => (
              <li key={item.id}>
                <Link to={`/brief/${item.id}`}>{item.title}</Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="action-row">
        <Button onClick={() => navigate("/brief")}>Finish</Button>
      </div>
    </section>
  );
}
