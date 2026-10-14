import { Link } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { useAppStore } from "../../store/useAppStore";

export function AlertsPage() {
  const { briefing } = useAppStore();
  const alerts = briefing.situations.filter((situation) => situation.status === "open" && situation.likelihood >= 60);

  return (
    <section className="alerts-shell">
      <header className="detail-header">
        <p className="eyebrow">LIVE</p>
        <h1>Triggered alerts</h1>
      </header>

      {alerts.length === 0 ? (
        <Card className="detail-card">
          <p className="muted">No active alerts right now. Your risk stack is clear.</p>
        </Card>
      ) : (
        <div className="alert-list">
          {alerts.map((alert) => (
            <Link key={alert.id} to={`/brief/${alert.id}`} className="alert-item-link">
              <Card className="alert-item">
                <div className="alert-row">
                  <span className={`status-dot status-${alert.impact}`} aria-hidden="true" />
                  <strong>{alert.title}</strong>
                </div>

                <div className="alert-meta">
                  <span>{alert.category}</span>
                  <span>{alert.likelihood}%</span>
                </div>

                <p className="muted">{alert.planA[0]}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
