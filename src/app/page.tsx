import type { Metadata } from 'next';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Hero } from '@/components/landing/Hero';
import { FeatureBento } from '@/components/landing/FeatureBento';
import { ProductShowcase } from '@/components/landing/ProductShowcase';
import { AIShowcase } from '@/components/landing/AIShowcase';
import { IntelligenceBand } from '@/components/landing/IntelligenceBand';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { TrustSection } from '@/components/landing/TrustSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { FinalCTA, LandingFooter } from '@/components/landing/LandingFooter';

// Public marketing page. Authenticated visitors never reach this component —
// the middleware redirects them from '/' to /dashboard.
export const metadata: Metadata = {
  title: 'FinanceOS — All your money. One clear picture.',
  description:
    'Track spending, budgets, savings goals, investments, and net worth in one beautiful app — with AI that turns receipts and bank statements into organized transactions. Free to start.',
  openGraph: {
    title: 'FinanceOS — All your money. One clear picture.',
    description:
      'Track spending, budgets, savings goals, investments, and net worth — with AI-powered receipt and bank-statement import.',
    type: 'website',
    siteName: 'FinanceOS',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FinanceOS — All your money. One clear picture.',
    description:
      'Track spending, budgets, savings goals, investments, and net worth — with AI-powered receipt and bank-statement import.',
  },
};

export default function LandingPage() {
  return (
    <div className="bg-background">
      <LandingHeader />
      <main>
        <Hero />
        <FeatureBento />
        <ProductShowcase />
        <AIShowcase />
        <IntelligenceBand />
        <HowItWorks />
        <TrustSection />
        <FAQSection />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
