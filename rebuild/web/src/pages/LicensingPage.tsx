import { Link } from 'react-router-dom'
import { BOOKING_EMAIL } from '../config/site'
import { loadTierFees, type TierFee } from '../features/licensing/loaders'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useMetaDescription } from '../hooks/useMetaDescription'
import '../features/site-pages/site-pages.css'
import '../features/site-pages/legal.css'

// Text from legal/site-footer-privacy-licensing-brief.md §3, verbatim. Do not edit without the owner.
// The tier table is a real table: tier names and "from" fees come from license_tiers (DB); the standard
// scope for each tier is the brief's wording, keyed by tier code. A tier without wording shows its fee only.
const SCOPE: Record<string, string> = {
  campaign: 'Social, digital and e-commerce · 12 months · worldwide · non-exclusive · up to 25 assets',
  flagship: 'All media incl. print and out-of-home · editorial models · 12 months · worldwide · up to 50 assets',
  exclusive: 'Category exclusivity or full buyout (model retired from our roster)',
  retainer: 'Ongoing access to one model · about 15 new assets a month',
}

// "USD 6,000", or "USD 2,000 / month" when the stored price is monthly. Falls back to the stored display text.
function fee(t: TierFee) {
  if (t.price_amount == null || !t.price_currency) return t.price_display
  const monthly = /\/\s*mo(nth)?\b/i.test(t.price_display)
  return `${t.price_currency} ${t.price_amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}${monthly ? ' / month' : ''}`
}

export function LicensingPage() {
  useDocumentTitle('Licensing terms')
  useMetaDescription(
    'How CyberChic Models licenses its AI-generated models: tiers and starting fees, what every license includes, what it does not allow, AI disclosure and exclusivity.',
  )
  const tiers = useAsync('tier-fees', loadTierFees)

  return (
    <div className="sp sp-legal">
      <div className="wrap pagehead">
        <div className="sp-eyebrow">Legal</div>
        <h1>
          Licensing <span className="l">terms</span>
        </h1>
        <p className="lead legal-intro">
          <em>
            A plain summary of how CyberChic licenses work. The signed Master License Agreement and Order Form govern every
            deal; if this page and the contract differ, the contract wins.
          </em>
        </p>
      </div>

      <div className="wrap legal-body">
        <h2>What you license.</h2>
        <p>
          A specific set of images or video (the Assets) featuring one of our AI-generated models, for the media, term and
          territory written in your Order Form. You can crop, resize, colour-grade and add your product, logo and copy. You
          can&rsquo;t change the model&rsquo;s face, body, skin tone, apparent age or apparent ethnicity.
        </p>

        <h2>Tiers.</h2>
        {/* The table's box is reserved while the fees load, so nothing below it moves. */}
        <div className="legal-table" aria-busy={tiers.status === 'loading'}>
          <table>
            <colgroup>
              <col className="c-tier" />
              <col />
              <col className="c-fee" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">Tier</th>
                <th scope="col">Standard scope</th>
                <th scope="col">From</th>
              </tr>
            </thead>
            <tbody>
              {tiers.status === 'ready'
                ? tiers.data.map((t) => (
                    <tr key={t.code}>
                      <th scope="row">{t.name}</th>
                      <td>{SCOPE[t.code] ?? ''}</td>
                      <td className="fee">{fee(t)}</td>
                    </tr>
                  ))
                : Object.keys(SCOPE).map((code) => (
                    <tr key={code} className="is-pending" aria-hidden="true">
                      <th scope="row">&nbsp;</th>
                      <td>{SCOPE[code]}</td>
                      <td className="fee">&nbsp;</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {tiers.status === 'error' && (
          <p className="muted small">Fees couldn&rsquo;t be loaded right now. Every quote is confirmed in an Order Form.</p>
        )}
        <p>Final fees depend on scope. Every quote is confirmed in an Order Form.</p>

        <h2>What every license includes.</h2>
        <ul>
          <li>A model that is AI-generated and not based on any real person&rsquo;s face or identity.</li>
          <li>Every model designed and depicted as an adult aged 25 or older.</li>
          <li>Revision rounds as set in the Order Form (two by default).</li>
          <li>An indemnity if a real person claims a model uses their likeness, plus replacement assets of a different model.</li>
        </ul>

        <h2>What a license doesn&rsquo;t allow.</h2>
        <ul>
          <li>Creating new content of the model: no AI training, LoRAs, reference generation or face-swaps.</li>
          <li>Presenting the model as a real person, or as giving a genuine testimonial, review or endorsement.</li>
          <li>Political, religious, adult, tobacco, vaping, weapons or gambling content, or anything hateful or defamatory.</li>
          <li>Regulated categories (medicines, alcohol, financial products, supplements) without our written consent.</li>
          <li>Reselling the assets: no stock libraries, templates or NFTs.</li>
        </ul>

        <h2>AI disclosure.</h2>
        <p>
          You publish the assets, so you make any AI-content disclosure your market requires (for example the EU AI Act, New
          York&rsquo;s synthetic-performer law, or platform &ldquo;AI info&rdquo; labels). We supply a standard disclosure
          line and keep provenance data in every file.
        </p>

        <h2>Exclusivity.</h2>
        <p>
          Licenses are non-exclusive unless your Order Form grants category exclusivity or a full buyout. Exclusivity binds
          us; it can&rsquo;t stop a third party creating a similar-looking face.
        </p>

        <h2>When a license ends.</h2>
        <p>
          Stop new publication and remove the assets from paid media, websites, e-commerce and out-of-home within 30 days.
          Organic social posts made during the term can stay as archive, unboosted.
        </p>

        <h2>Contract editions.</h2>
        <p>
          We contract under regional editions (US, UK, EU, Gulf and MENA) with governing law and arbitration suited to each.
          Ask for yours: <a href={`mailto:${BOOKING_EMAIL}`}>{BOOKING_EMAIL}</a>.
        </p>

        <div className="legal-cta">
          <Link to="/brief" className="pill lime">
            Start a brief
          </Link>
        </div>
      </div>
    </div>
  )
}
