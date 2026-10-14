type GaugeProps = { value: number; label?: string };

export function Gauge({ value, label = "DAY RISK" }: GaugeProps) {
  const safeValue = Math.min(100, Math.max(0, value));
  return (
    <div className="gauge" role="meter" aria-valuenow={safeValue} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="gauge-arc" style={{ "--gauge-progress": `${safeValue * 1.8}deg` } as React.CSSProperties} />
      <div className="gauge-value">{safeValue}</div>
      <div className="gauge-label">{label}</div>
    </div>
  );
}
