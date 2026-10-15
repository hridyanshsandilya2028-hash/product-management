import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Pill } from "../../components/ui/Pill";

type Mode = "vigilante" | "shadow";

export function ModePicker() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("vigilante");

  function chooseMode(nextMode: Mode) {
    setMode(nextMode);
    document.documentElement.dataset.theme = nextMode;
  }

  function enterApp() {
    navigate("/brief");
  }

  return (
    <main className="onboarding">
      <div className="onboarding-mark" aria-hidden="true">
        <span>CG</span>
      </div>
      <p className="eyebrow">CONTINGENCY GENIUS / 01</p>
      <h1>Stay ready<br /><em>for anything.</em></h1>
      <p className="onboarding-copy">
        A quiet layer of preparation for the moments your calendar cannot predict.
      </p>
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
      <Button onClick={enterApp} className="onboarding-cta">
        Enter your day <span aria-hidden="true">↗</span>
      </Button>
      <p className="onboarding-footnote">You can change this anytime in settings.</p>
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
