import { BOOKING_EMAIL } from '../config/site'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useMetaDescription } from '../hooks/useMetaDescription'
import '../features/site-pages/site-pages.css'
import '../features/site-pages/legal.css'

// Text from legal/site-footer-privacy-licensing-brief.md §2, verbatim except where the owner asked it
// to describe the actual setup (2026-11-28): briefs stored in our Supabase database (Singapore), email
// delivered through Resend, no cookies and no analytics; and the owner's edits of 2026-11-28 (brief-form
// fields, "If we contacted you first", email hosting). Do not edit the wording here without the owner.
export function PrivacyPage() {
  useDocumentTitle('Privacy notice')
  useMetaDescription(
    'How CyberChic Models handles personal data: what the brief form and emails collect, why, who processes it, how long it is kept and your rights.',
  )
  const mail = <a href={`mailto:${BOOKING_EMAIL}`}>{BOOKING_EMAIL}</a>

  return (
    <div className="sp sp-legal">
      <div className="wrap pagehead">
        <div className="sp-eyebrow">Legal</div>
        <h1>
          Privacy <span className="l">notice</span>
        </h1>
        <p className="muted small">Last updated: 28 November 2026</p>
      </div>

      <div className="wrap legal-body">
        <h2>Who we are.</h2>
        <p>
          CyberChic Models is operated by Toufic Mourtada, Beirut, Lebanon (&ldquo;we&rdquo;). We are the
          controller of the personal data described here. Contact: {mail}.
        </p>

        <h2>What we collect.</h2>
        <ul>
          <li>
            <b>Brief form:</b> your name, work email, company, phone (if given), and what you write in the brief: model,
            licence level, intended use, territory, budget and message.
          </li>
          <li>
            <b>Emails you send us:</b> your name, email address and the content of your message.
          </li>
          <li>
            <b>If we contacted you first:</b> your name, work email, company and role, taken from public business sources
            such as company websites and professional networks.
          </li>
          <li>
            <b>Technical data:</b> our hosting providers log basic request data (IP address, browser type, time of visit)
            to keep the site running and secure.
          </li>
        </ul>
        <p>
          We do not knowingly collect data from anyone under 18. Our models are AI-generated. No real person&rsquo;s
          likeness is collected or used.
        </p>

        <h2>Why we use it, and the legal basis.</h2>
        <ul>
          <li>
            To reply to your enquiry and prepare a quote: steps taken at your request before a contract, or our legitimate
            interest in answering business enquiries.
          </li>
          <li>To perform a license agreement once signed: contract.</li>
          <li>To keep records required by tax and accounting law: legal obligation.</li>
          <li>
            To send occasional business updates to people who work in a relevant role: legitimate interest. You can opt
            out at any time with one reply.
          </li>
        </ul>
        <p>We do not sell personal data. We do not use it for advertising profiles.</p>

        <h2>Who processes it for us.</h2>
        <ul>
          <li>Website hosting: Vercel.</li>
          <li>
            Database and form handling: Supabase (servers in Singapore). Briefs you send through the form are stored in our
            database there.
          </li>
          <li>Email delivery: Resend, which delivers each brief to our inbox.</li>
          <li>Email hosting: Namecheap Private Email.</li>
        </ul>
        <p>
          These providers act on our instructions under their data-processing terms. Some are outside the UK and EU. Where
          that applies, transfers rely on the providers&rsquo; standard contractual clauses.
        </p>

        <h2>How long we keep it.</h2>
        <ul>
          <li>Enquiries that don&rsquo;t lead to a deal: up to 24 months, then deleted.</li>
          <li>Clients: for the length of the agreement plus the period tax and accounting law requires.</li>
          <li>Hosting logs: as set by the hosting providers, typically up to 30 days.</li>
        </ul>

        <h2>Your rights.</h2>
        <p>
          Depending on where you live, you can ask to access, correct or delete your data, to restrict
          or object to how we use it, or to receive a copy. Email {mail}. We reply within 30 days. If you are in the UK or
          EU, you may also complain to your data-protection authority.
        </p>

        <h2>Cookies.</h2>
        <p>
          This site sets no cookies and loads no analytics. If we add analytics, we will update this notice
          and ask for consent where the law requires it.
        </p>

        <h2>Changes.</h2>
        <p>
          We will post any change here and update the date above.
        </p>
      </div>
    </div>
  )
}
