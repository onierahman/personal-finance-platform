import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — FinanceOS',
  description: 'How FinanceOS collects, uses, and protects your data.',
};

const EFFECTIVE_DATE = 'June 12, 2026';

export default function PrivacyPage() {
  return (
    <article className="space-y-8 text-[15px] leading-relaxed text-slate-700">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-400">Effective date: {EFFECTIVE_DATE}</p>
      </header>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">What this policy covers</h2>
        <p>
          This policy explains what information FinanceOS (&ldquo;we&rdquo;, &ldquo;us&rdquo;)
          collects when you use the FinanceOS application, how we use it, and the choices you
          have. The short version: your financial data is yours, we use it only to run the
          product for you, and we never sell it or use it for advertising.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Information we collect</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Account information</strong> — your email address, name, and the preferences
            you set (currency, timezone, theme).
          </li>
          <li>
            <strong>Financial data you enter</strong> — accounts, transactions, budgets, goals,
            recurring bills, and investments you add to the app, including data extracted from
            receipts, bank statements, or CSV files you choose to import.
          </li>
          <li>
            <strong>Optional email connection</strong> — if you connect a Gmail account for email
            notifications, we store the OAuth tokens needed to send those emails. Tokens are
            encrypted at rest with AES-256-GCM, and you can disconnect at any time from Settings.
          </li>
          <li>
            <strong>Technical data</strong> — standard server logs (such as IP address and
            request timestamps) used for security and reliability.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">How we use your information</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>To provide the product: storing and displaying your financial records to you.</li>
          <li>
            To process imports you initiate: images and documents you upload for receipt or
            statement import are sent to our AI processing provider (Anthropic) solely to extract
            the transaction details, and are not used to train models.
          </li>
          <li>To send notifications you have enabled, such as budget alerts and weekly digests.</li>
          <li>To secure the service, prevent abuse, and debug failures.</li>
        </ul>
        <p className="mt-3">
          We do not sell your personal or financial data, share it with advertisers, or use it
          for advertising of any kind.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Where your data lives</h2>
        <p>
          Your data is stored in a Postgres database hosted by Supabase, protected by row-level
          security so that records are only ever readable by the account that created them. The
          application is hosted on Vercel. These providers process data on our behalf under
          their own security and privacy commitments.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Your rights and choices</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Export</strong> — you can export your transactions and reports to CSV or PDF
            from inside the app at any time.
          </li>
          <li>
            <strong>Deletion</strong> — you can delete your account from Settings, which removes
            your account and the records attached to it.
          </li>
          <li>
            <strong>Disconnect</strong> — you can disconnect a linked Gmail account at any time,
            which deletes the stored tokens.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Data retention</h2>
        <p>
          We keep your data for as long as your account exists. In-app notifications expire and
          are removed automatically after 30 days. When you delete your account, associated
          records are removed from the production database.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Changes to this policy</h2>
        <p>
          If we make material changes to this policy, we will notify you in the app or by email
          before they take effect.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Contact</h2>
        <p>
          Questions about this policy or your data? Contact us at{' '}
          <a href="mailto:onierahman787@gmail.com" className="font-medium text-primary-600 hover:underline">
            onierahman787@gmail.com
          </a>
          .
        </p>
      </section>
    </article>
  );
}
