import { Campaigns } from '../features/home/Campaigns'
import { FinalCta } from '../features/home/FinalCta'
import { Hero } from '../features/home/Hero'
import { ProofBand } from '../features/home/ProofBand'
import { RosterWall } from '../features/home/RosterWall'
import { Ticker } from '../features/home/Ticker'
import { useHomeData } from '../features/home/useHomeData'
import '../features/home/home.css'

export function HomePage() {
  const data = useHomeData()
  const ready = data.status === 'ready'

  // Metrics are real published counts; a zero count is dropped rather than shown (visual-lock §4/§5).
  const metrics = ready
    ? [
        { value: data.modelCount, label: 'Published models' },
        { value: data.campaignCount, label: 'Published campaigns' },
      ].filter((m) => m.value > 0)
    : []

  return (
    <>
      <Hero models={ready ? data.models : []} metrics={metrics} />
      <Ticker />
      <RosterWall {...(ready ? { status: 'ready', models: data.models } : { status: data.status })} />
      <ProofBand />
      <Campaigns {...(ready ? { status: 'ready', campaigns: data.campaigns } : { status: data.status })} />
      <FinalCta />
    </>
  )
}
