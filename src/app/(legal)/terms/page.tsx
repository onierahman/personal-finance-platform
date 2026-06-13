import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — FinanceOS',
  description: 'The terms that govern your use of FinanceOS.',
};

const EFFECTIVE_DATE = 'June 12, 2026';

export default function TermsPage() {
  return (
    <article className="space-y-8 text-[15px] leading-relaxed text-slate-700">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-400">Effective date: {EFFECTIVE_DATE}</p>
      </header>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">1. Agreement</h2>
        <p>
          By creating an account or using FinanceOS (the &ldquo;Service&rdquo;), you agree to
          these terms. If you do not agree, do not use the Service.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">2. The Service</h2>
        <p>
          FinanceOS is a personal finance tracking tool: it lets you record and organize
          accounts, transactions, budgets, savings goals, recurring bills, and investments, and
          provides analytics and import tools (including AI-assisted receipt and statement
          extraction) on top of the data you provide.
        </p>
        <p className="mt-3">
          <strong>FinanceOS is not financial advice.</strong> The Service organizes and presents
          your own data; it does not provide investment, tax, legal, or accounting advice, and it
          does not hold, move, or have access to your actual money or bank accounts.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">3. Your account</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>You must provide accurate information and keep your password secure.</li>
          <li>You are responsible for activity that happens under your account.</li>
          <li>One person per account; you may not share credentials or impersonate others.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">4. Acceptable use</h2>
        <p>
          You agree not to misuse the Service — including attempting to access other users&rsquo;
          data, probing or disrupting the infrastructure, abusing import or AI-processing
          features at automated scale, or using the Service for unlawful purposes. We may
          suspend or terminate accounts that violate these terms.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">5. Your data</h2>
        <p>
          You own the data you put into FinanceOS. You grant us only the rights needed to
          operate the Service — storing, processing, and displaying your data back to you, as
          described in our Privacy Policy. You can export your data at any time and delete your
          account from Settings.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">6. AI-assisted imports</h2>
        <p>
          Receipt scanning and statement extraction use automated AI processing and may make
          mistakes. Always review imported transactions before relying on them. We may apply
          fair-use limits to AI-powered features to keep the Service reliable for everyone.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">7. Availability and changes</h2>
        <p>
          We work to keep the Service fast and available, but it is provided &ldquo;as is&rdquo;
          without warranties of any kind. We may add, change, or remove features over time. If
          we ever introduce paid plans, we will communicate pricing clearly before you are
          charged anything.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">8. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, FinanceOS and its operators are not liable for
          indirect, incidental, or consequential damages, or for financial decisions made based
          on information displayed in the Service. Our total liability for any claim is limited
          to the amount you paid us in the twelve months before the claim (which, for free
          accounts, is zero).
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">9. Termination</h2>
        <p>
          You may stop using the Service and delete your account at any time. We may suspend or
          terminate accounts that breach these terms, after notice where practical.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">10. Changes to these terms</h2>
        <p>
          We may update these terms as the Service evolves. For material changes we will notify
          you in the app or by email before they take effect. Continuing to use the Service
          after changes take effect means you accept the updated terms.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Contact</h2>
        <p>
          Questions about these terms? Contact us at{' '}
          <a href="mailto:onierahman787@gmail.com" className="font-medium text-primary-600 hover:underline">
            onierahman787@gmail.com
          </a>
          .
        </p>
      </section>
    </article>
  );
}
