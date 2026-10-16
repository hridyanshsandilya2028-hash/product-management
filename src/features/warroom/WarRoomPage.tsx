import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "../../components/ui/Card";
import { useAppStore } from "../../store/useAppStore";

export function WarRoomPage() {
  const { briefing, profile } = useAppStore();
  const evaluated = briefing.situations.filter((item) => item.status !== "open");
  const accuracy = evaluated.length === 0 ? 0 : Math.round((evaluated.filter((item) => item.status === "resolved").length / evaluated.length) * 100);
  const riskHistory = [{ day: "Today", risk: briefing.riskScore, accuracy }];
  const segmentRows = profile.dayEvents.map((event) => {
    const risks = briefing.situations.filter((item) => item.relatedEventId === event.id);
    return { event, risks, topRisk: risks[0] };
  });
  const patterns = [
    briefing.situations.filter((item) => item.category === "traffic").length > 0
      ? { title: "Travel pressure", detail: "Route delay or commute timing is the main exposure in this plan." }
      : null,
    briefing.situations.filter((item) => item.category === "schedule").length > 0
      ? { title: "Schedule compression", detail: "Preparation, overruns, or tight handoffs are the main timing risk." }
      : null,
    briefing.situations.filter((item) => item.category === "energy" || item.category === "battery").length > 0
      ? { title: "Energy load", detail: "Long or demanding blocks need a deliberate reset and fallback." }
      : null,
  ].filter((pattern): pattern is { title: string; detail: string } => Boolean(pattern));

  return (
    <section className="warroom-shell">
      <header className="warroom-header">
        <div>
          <p className="eyebrow">WEEKLY</p>
          <h1>War Room</h1>
        </div>
        <span className="pill">Personalized intelligence</span>
      </header>

      <Card className="warroom-card">
        <div className="plan-card-header">
          <p className="eyebrow">RISK</p>
          <span className="muted">Current plan</span>
        </div>

        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={riskHistory}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} stroke="var(--muted)" />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} stroke="var(--muted)" />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                contentStyle={{ background: "var(--panel)", border: `1px solid var(--border)`, borderRadius: "var(--radius)" }}
              />
              <Bar dataKey="risk" fill="var(--accent)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="warroom-card">
        <div className="plan-card-header">
          <p className="eyebrow">ACCURACY</p>
          <span className="muted">{evaluated.length ? `${evaluated.length} checked` : "No debrief data yet"}</span>
        </div>

        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={riskHistory}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} stroke="var(--muted)" />
              <YAxis domain={[60, 100]} tickLine={false} axisLine={false} stroke="var(--muted)" />
              <Tooltip
                contentStyle={{ background: "var(--panel)", border: `1px solid var(--border)`, borderRadius: "var(--radius)" }}
              />
              <Line type="monotone" dataKey="accuracy" stroke="var(--accent)" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="warroom-card">
        <div className="plan-card-header">
          <p className="eyebrow">PATTERNS</p>
          <span className="muted">Detected</span>
        </div>

        <div className="pattern-list">
          {patterns.length > 0 ? patterns.map((pattern) => (
            <div key={pattern.title} className="pattern-item">
              <span className="status-dot status-medium" aria-hidden="true" />
              <div>
                <strong>{pattern.title}</strong>
                <p className="muted">{pattern.detail}</p>
              </div>
            </div>
          )) : <p className="muted">Add schedule segments to reveal your first personal risk patterns.</p>}
        </div>
      </Card>

      <Card className="warroom-card">
        <div className="plan-card-header">
          <p className="eyebrow">SEGMENT COVERAGE</p>
          <span className="muted">{segmentRows.length} segments</span>
        </div>
        {segmentRows.length > 0 ? (
          <div className="pattern-list">
            {segmentRows.map(({ event, risks, topRisk }) => (
              <div key={event.id} className="pattern-item">
                <span className={`status-dot status-${topRisk?.impact ?? "low"}`} aria-hidden="true" />
                <div>
                  <strong>{event.title}</strong>
                  <p className="muted">{risks.length ? `${risks.length} forecast${risks.length === 1 ? "" : "s"} · ${topRisk?.title}` : "No material obstacle detected."}</p>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="muted">Your War Room will map each segment after you add today&apos;s schedule.</p>}
      </Card>
    </section>
  );
}
