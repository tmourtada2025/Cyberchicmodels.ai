import type { ReactNode } from 'react'

export function SectionHead({ title, side }: { title: ReactNode; side?: ReactNode }) {
  return (
    <div className="sec-head">
      <h2 className="display sec-title">{title}</h2>
      {side && <p className="sec-side">{side}</p>}
    </div>
  )
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="empty-state">
      <p className="label empty-state-title">{title}</p>
      <p className="empty-state-body">{children}</p>
    </div>
  )
}
