// Fixed, truthful set (visual-lock §4/§5): no invented events, names, dates or prices.
const ITEMS = [
  'Identity-locked digital models',
  'One face · Every scene',
  'Zero drift',
  'Licensed for brand campaigns',
  'No real person is depicted',
  'Start a brief',
]

export function Ticker() {
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track">
        {[...ITEMS, ...ITEMS].map((item, i) => (
          <span key={i} className="ticker-item label">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
