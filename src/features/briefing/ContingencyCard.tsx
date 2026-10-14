import { Link } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import type { Situation } from "../../types";

const impactPriority = { low: 1, medium: 2, high: 3 };

export function ContingencyCard({ situation }: { situation: Situation }) {
  const score = situation.likelihood * impactPriority[situation.impact];

  return (
    <Link to={`/brief/${situation.id}`} className="contingency-card-link">
      <Card className="contingency-card">
        <div className="contingency-header">
          <span className={`status-dot status-${situation.impact}`}></span>
          <strong>{situation.title}</strong>
        </div>
        <div className="contingency-meta">
          <span>{situation.category}</span>
          <span>{situation.likelihood}%</span>
        </div>
        <div className="contingency-summary">
          <span>{situation.impact.toUpperCase()}</span>
          <span>{score} trust score</span>
        </div>
      </Card>
    </Link>
  );
}
