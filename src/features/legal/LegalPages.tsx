import { Link } from 'react-router-dom'
import { Card } from '../../components/ui'

/**
 * M8.3: public site pages required before applying for a Paddle account
 * (Paddle is the Merchant of Record and manually reviews the website):
 * a clear product description, a contact page with an email address,
 * Terms & Conditions, a Privacy Policy, and a Refund Policy.
 *
 * These are honest drafts — the owner will polish/upgrade them later.
 * Routes are hash-based (/#/about etc.), so they are always reachable
 * without any server-side routing.
 */

export const CONTACT_EMAIL = 'gabor@deutschmeister.gaborscreation.space'
const LAST_UPDATED = '21 September 2026'

function LegalShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-4">
      <Card title={title} description={subtitle}>
        <div className="space-y-4 text-sm leading-relaxed text-slate-600">{children}</div>
      </Card>
      <p className="text-center text-xs text-slate-400">
        Last updated: {LAST_UPDATED} ·{' '}
        <Link to="/contact" className="underline underline-offset-2 hover:text-slate-600">
          Contact us
        </Link>{' '}
        ·{' '}
        <Link to="/terms" className="underline underline-offset-2 hover:text-slate-600">
          Terms
        </Link>{' '}
        ·{' '}
        <Link to="/privacy" className="underline underline-offset-2 hover:text-slate-600">
          Privacy
        </Link>{' '}
        ·{' '}
        <Link to="/refund" className="underline underline-offset-2 hover:text-slate-600">
          Refunds
        </Link>
      </p>
    </div>
  )
}

function H({ children }: { children: React.ReactNode }) {
  return <h3 className="font-semibold text-slate-800">{children}</h3>
}

function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="font-medium text-indigo-700 underline underline-offset-2">
      {children}
    </a>
  )
}

export function AboutPage() {
  return (
    <LegalShell title="About DeutschMeister" subtitle="Learn German — locally, honestly, at your own pace.">
      <p>
        <strong>DeutschMeister</strong> is a web application for learning German, from absolute beginner
        (A1) up to upper-intermediate (B2). It is built and operated by Gábor Tardos, an independent
        developer based in Hungary.
      </p>
      <div>
        <H>What the app does</H>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Vocabulary</strong> — a built-in corpus of 1,000+ German words (A1–B1) taught with
            spaced repetition (SM-2), word forms, and a searchable word bank.
          </li>
          <li>
            <strong>Grammar</strong> — 35+ topics from A1 to B2 with explanations, interactive drills, a
            placement test, and mastery tracking.
          </li>
          <li>
            <strong>Speaking &amp; listening</strong> — pronunciation and listening practice using your
            browser&apos;s speech recognition and text-to-speech, with optional higher-quality voices.
          </li>
          <li>
            <strong>AI conversation practice</strong> — role-play scenarios (doctor, restaurant, job
            interview, small talk and more) with instant hints and feedback, powered by large language
            models.
          </li>
        </ul>
      </div>
      <div>
        <H>Local-first by design</H>
        <p>
          The core learning experience works fully offline: your progress, vocabulary history and grammar
          results are stored in your own browser. An optional account adds cloud sync and a small amount
          of free AI starter credit; you can alternatively connect your own AI provider key (OpenAI,
          Zhipu GLM, DeepSeek) at no cost from us.
        </p>
      </div>
      <p>
        Questions or feedback?{' '}
        <Link to="/contact" className="font-medium text-indigo-700 underline underline-offset-2">
          Contact us
        </Link>{' '}
        — we usually reply within two business days.
      </p>
    </LegalShell>
  )
}

export function ContactPage() {
  return (
    <LegalShell title="Contact" subtitle="Questions, feedback, account or privacy requests — we read everything.">
      <div>
        <H>Email</H>
        <p>
          <A href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</A>
        </p>
      </div>
      <div>
        <H>What to include</H>
        <ul className="list-disc space-y-1 pl-5">
          <li>Your name and the email address you use in the app (if you have an account).</li>
          <li>A short description of your question, issue or request.</li>
          <li>For refunds: the date of purchase and the email used at checkout.</li>
        </ul>
      </div>
      <p>
        We usually reply <strong>within two business days</strong>. For privacy requests (access,
        correction or deletion of your data), email the same address — see the{' '}
        <Link to="/privacy" className="font-medium text-indigo-700 underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </p>
    </LegalShell>
  )
}

export function TermsPage() {
  return (
    <LegalShell title="Terms & Conditions" subtitle="The ground rules for using DeutschMeister.">
      <div>
        <H>1. The service</H>
        <p>
          DeutschMeister is a German-learning web application operated by Gábor Tardos (&quot;we&quot;,
          &quot;us&quot;), an independent developer based in Hungary. The core learning features
          (vocabulary, grammar, reviews, listening practice) run in your browser and work offline.
          Optional features include a synchronised account and AI-powered conversation practice.
        </p>
      </div>
      <div>
        <H>2. Accounts</H>
        <p>
          You may use the app without an account. If you create one (email or Google sign-in), you are
          responsible for the accuracy of your details and for keeping your credentials secure. You can
          delete your account at any time by contacting us.
        </p>
      </div>
      <div>
        <H>3. AI features and API keys</H>
        <p>
          AI features can be used in two ways: (a) with <em>your own</em> API key from a provider of your
          choice — in that case your usage is governed by that provider&apos;s terms and costs, and your
          key never leaves your browser except to reach the provider (directly, or via our relay server
          which forwards it once and never stores it); or (b) with a limited amount of free starter
          credit tied to your account. The size and availability of free credit may change as the service
          evolves.
        </p>
      </div>
      <div>
        <H>4. Acceptable use</H>
        <p>
          Do not use the service unlawfully, attempt to disrupt it, circumvent usage limits, or abuse the
          free AI credit (e.g. automated scraping). Educational content is for personal learning use.
        </p>
      </div>
      <div>
        <H>5. Payments</H>
        <p>
          Paid plans (when offered) are sold by <strong>Paddle</strong> as Merchant of Record — Paddle
          handles payment, invoicing and sales tax/VAT, and resells the subscription to you. Prices are
          shown at checkout. Subscriptions renew automatically until cancelled; you can cancel at any
          time and keep access until the end of the paid period.
        </p>
      </div>
      <div>
        <H>6. Availability and changes</H>
        <p>
          The service is provided &quot;as is&quot;. We may add, change or remove features, and may
          discontinue the service with reasonable notice. Learning data lives in your browser and can be
          exported by you at any time from Settings.
        </p>
      </div>
      <div>
        <H>7. Liability</H>
        <p>
          To the extent permitted by law, our total liability arising from the service is limited to the
          amount you paid us in the 12 months preceding the claim. Nothing limits liability that cannot
          be limited by law (e.g. intent or gross negligence).
        </p>
      </div>
      <div>
        <H>8. Changes to these terms</H>
        <p>
          We may update these terms; the current version is always available on this page with its date
          of last update. Continued use after changes means you accept the updated terms.
        </p>
      </div>
      <div>
        <H>9. Contact &amp; governing law</H>
        <p>
          <A href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</A>. These terms are governed by the laws
          of Hungary, without prejudice to mandatory consumer-protection rights of EU consumers.
        </p>
      </div>
    </LegalShell>
  )
}
export function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" subtitle="What we store, where, and how to get it deleted.">
      <p>
        DeutschMeister is local-first: most of your data never leaves your browser. This policy explains
        the exceptions. Controller: Gábor Tardos, Hungary —{' '}
        <A href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</A>.
      </p>
      <div>
        <H>1. Data stored only in your browser</H>
        <p>
          Learning progress, vocabulary history, grammar results, conversation sessions, app settings and
          — if you use it — your own AI provider key are stored in your browser&apos;s local storage and
          IndexedDB. They are only sent anywhere if you explicitly enable optional features (account
          sync, AI requests). You can export or delete them at any time in Settings.
        </p>
      </div>
      <div>
        <H>2. Account data</H>
        <p>
          If you create an account we store your email address, a password hash (or the identity provided
          by Google when you use Google sign-in), and your learning data if you enable cloud sync.
          Accounts and synced data are hosted at our database provider, Supabase. We use them only to
          provide sign-in and sync.
        </p>
      </div>
      <div>
        <H>3. AI processing</H>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Your own key:</strong> requests go from your browser directly to the AI provider you
            chose (e.g. OpenAI, Zhipu, DeepSeek) — or through our relay server when the provider blocks
            browser apps. The relay forwards your key and message for that single request and stores
            nothing.
          </li>
          <li>
            <strong>Free starter credit:</strong> requests are processed by our server function and sent
            to the AI provider (e.g. OpenAI or Zhipu GLM) to generate a reply. Conversation content is
            not stored server-side; we keep only usage counters (timestamps, token/character counts,
            estimated cost) to meter the free credit.
          </li>
        </ul>
      </div>
      <div>
        <H>4. Payments</H>
        <p>
          Paid plans are processed by Paddle (Merchant of Record). Paddle handles your payment data as
          its own controller under its privacy policy; we receive only transaction records needed to
          grant your entitlement.
        </p>
      </div>
      <div>
        <H>5. Tracking &amp; cookies</H>
        <p>
          We run no analytics, advertising or tracking. The app sets no cookies; it uses browser local
          storage and IndexedDB only.
        </p>
      </div>
      <div>
        <H>6. Your rights (GDPR)</H>
        <p>
          You can request access, correction, export or deletion of your account and synced data at any
          time by emailing <A href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</A>. Deleting your account
          removes synced data from our servers; browser-local data is removed by deleting site data in
          your browser (or via the app&apos;s reset). Some providers (Supabase, AI providers, Paddle)
          process data outside the EEA under contractual safeguards (e.g. EU–US Data Privacy Framework).
        </p>
      </div>
      <div>
        <H>7. Children</H>
        <p>
          The service is not directed at children under 16, and we do not knowingly collect their data.
        </p>
      </div>
    </LegalShell>
  )
}

export function RefundPage() {
  return (
    <LegalShell title="Refund Policy" subtitle="Simple and no-questions-asked.">
      <p>
        <strong>We offer a 14-day refund policy.</strong> If a purchase (subscription or top-up) does not
        work for you, email us within 14 days of the purchase date and we will refund it in full — no
        questions asked.
      </p>
      <p>
        Email <A href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</A> with the purchase date and the
        email you used at checkout. Refunds are issued via Paddle (our payment processor) and typically
        arrive within 5–10 business days. EU consumers also keep their statutory rights, including the
        14-day right of withdrawal for digital content.
      </p>
    </LegalShell>
  )
}

