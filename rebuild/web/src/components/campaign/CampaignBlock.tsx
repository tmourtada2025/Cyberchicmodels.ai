import { Link } from 'react-router-dom'
import { coverImage } from '../../lib/campaigns'
import { mediaUrl } from '../../lib/media'
import type { CampaignImage } from '../../lib/types'

type CampaignBlockProps = {
  href: string
  name: string
  images: CampaignImage[]
  modelName?: string
  tall?: boolean
}

export function CampaignBlock({ href, name, images, modelName, tall = false }: CampaignBlockProps) {
  const cover = coverImage(images)
  const kicker = [cover?.register, modelName].filter(Boolean).join(' · ')

  return (
    <Link to={href} className={`cam ${tall ? 'cam-tall' : ''}`}>
      {cover && <img className="cam-img" src={mediaUrl(cover.storage_path)} alt={cover.alt_text ?? ''} loading="lazy" />}
      <div className="cam-shade" />
      <div className="cam-txt">
        {kicker && <div className="label cam-kicker">{kicker}</div>}
        <div className="display cam-title">{name}</div>
      </div>
    </Link>
  )
}
