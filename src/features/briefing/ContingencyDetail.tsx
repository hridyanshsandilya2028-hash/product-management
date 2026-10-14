import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { locationService } from "../../services/locationService";

export function ContingencyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { briefing, markSituation } = useAppStore();

  const situation = useMemo(
    () => briefing.situations.find((entry) => entry.id === id),
    [briefing.situations, id],
  );

  async function handleShareLocation() {
    if (!navigator.geolocation) {
      window.alert("Location sharing is not supported in this browser.");
      return;
    }

    const confirmed = window.confirm("Share your current location with the selected safety contact?");
    if (!confirmed) {
      return;
    }

    try {
      const coords = await locationService.getCurrentLocation();
      const mapsUrl = `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;
      const text = `I’m taking a safer route. My location is ${mapsUrl}`;

      if (navigator.share) {
        await navigator.share({ title: "Route check-in", text, url: mapsUrl });
        return;
      }

      window.location.href = `sms:?body=${encodeURIComponent(text + "\n" + mapsUrl)}`;
    } catch {
      window.alert("Location could not be resolved. Try checking your location settings.");
    }
  }

  if (!situation) {
    return (
      <section className="page-shell">
        <p className="eyebrow">MISSING SIGNAL</p>
        <h1>Contingency not found.</h1>
        <Button onClick={() => navigate("/brief")}>Back to brief</Button>
      </section>
    );
  }

  return (
    <section className="detail-shell">
      <header className="detail-header">
        <p className="eyebrow">CONTINGENCY</p>
        <h1>{situation.title}</h1>
      </header>

      <Card className="detail-card">
        <div className="detail-metrics">
          <div>
            <span>Likelihood</span>
            <strong>{situation.likelihood}%</strong>
          </div>
          <div>
            <span>Impact</span>
            <strong>{situation.impact}</strong>
          </div>
        </div>
      </Card>

      <div className="plan-block">
        <h2>Plan A</h2>
        <ol>
          {situation.planA.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="plan-block">
        <h2>Plan B</h2>
        <ol>
          {situation.planB.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="action-row">
        <Button onClick={() => markSituation(situation.id, "resolved")}>Resolved</Button>
        <Button variant="secondary" onClick={() => markSituation(situation.id, "didnt_happen")}>
          Didn’t happen
        </Button>
      </div>

      {situation.category === "safety" && (
        <Button variant="ghost" onClick={handleShareLocation}>
          Share my location
        </Button>
      )}
    </section>
  );
}
