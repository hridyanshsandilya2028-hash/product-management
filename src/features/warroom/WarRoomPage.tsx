import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "../../components/ui/Card";

const riskHistory = [
  { day: "Mon", risk: 32, accuracy: 74 },
  { day: "Tue", risk: 72, accuracy: 81 },
  { day: "Wed", risk: 48, accuracy: 77 },
  { day: "Thu", risk: 63, accuracy: 83 },
  { day: "Fri", risk: 58, accuracy: 79 },
  { day: "Sat", risk: 41, accuracy: 72 },
  { day: "Sun", risk: 36, accuracy: 84 },
];

const patterns = [
  { title: "Risk spikes Tuesdays 8-9am", detail: "Traffic + schedule overlap builds before the morning standup." },
  { title: "Rain risk rises near outdoor meetings", detail: "Outdoor blocks on Thu/Fri are the most sensitive to short rain windows." },
  { title: "Battery stress recurs with back-to-back sprints", detail: "Delivery days with no free gap show 2x more drain risk." },
];

export function WarRoomPage() {
  return (
    <section className="warroom-shell">
      <header className="warroom-header">
        <div>
          <p className="eyebrow">WEEKLY</p>
          <h1>War Room</h1>
        </div>
        <span className="pill">7-day pattern view</span>
      </header>

      <Card className="warroom-card">
        <div className="plan-card-header">
          <p className="eyebrow">RISK</p>
          <span className="muted">7-day</span>
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
          <span className="muted">Trend</span>
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
          {patterns.map((pattern) => (
            <div key={pattern.title} className="pattern-item">
              <span className="status-dot status-medium" aria-hidden="true" />
              <div>
                <strong>{pattern.title}</strong>
                <p className="muted">{pattern.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
