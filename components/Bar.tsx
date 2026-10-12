export function Bar({ pct, label }: { pct: number; label: string }) {
  const value = Math.max(0, Math.min(100, Math.round(pct)))
  return (
    <div className="bar" role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${value}%` }} />
    </div>
  )
}
