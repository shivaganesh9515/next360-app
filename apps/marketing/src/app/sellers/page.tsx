import type { Metadata } from 'next';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Sell on Next360 | Become a Seller',
  description:
    'Apply to sell on Next360: verification steps, order management, payouts, and how to contact our onboarding team.',
};

const steps = [
  {
    title: 'Apply',
    copy: 'Email our onboarding team with your business name, city, and what you sell. We currently onboard sellers in Hyderabad, Karimnagar, and Vijayawada.',
  },
  {
    title: 'Get verified',
    copy: 'We verify your business details and required documents before your store goes live. We will confirm the exact checklist by email.',
  },
  {
    title: 'List your products',
    copy: 'Add your catalog with prices, stock, and photos. New listings go through a quality review before appearing to customers.',
  },
  {
    title: 'Receive orders',
    copy: 'Accept orders from your vendor dashboard, keep stock updated, and hand off packed orders to assigned delivery partners.',
  },
];

const faqs = [
  {
    q: 'What does it cost to sell on Next360?',
    a: 'Commission and payout terms are shared during onboarding and confirmed in writing before your store goes live. Email us for the current terms in your city.',
  },
  {
    q: 'Who handles delivery?',
    a: 'Deliveries are fulfilled by Next360 delivery partners assigned per order. You pack the order; the partner picks it up and delivers it to the customer.',
  },
  {
    q: 'How do I get support?',
    a: 'Email support@next360.com with your store name and registered phone number, and our team will respond during business hours.',
  },
];

export default function SellersPage() {
  return (
    <>
      <header className="bg-neutral-bg border-b border-neutral-surface">
        <div className="max-w-container mx-auto px-6 lg:px-8 h-16 flex items-center">
          <a href="/" className="font-display font-semibold text-lg text-brand-primary">
            &#8592; Next360
          </a>
        </div>
      </header>
      <main className="bg-neutral-bg">
        <section className="max-w-container mx-auto px-6 lg:px-8 py-16 lg:py-24">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-secondary">
            For sellers
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-medium text-brand-primary leading-tight tracking-tight mt-3 max-w-2xl">
            Grow your store <span className="italic text-brand-accent">with Next360.</span>
          </h1>
          <p className="text-text-secondary text-base sm:text-lg leading-relaxed mt-5 max-w-2xl">
            List your organic products in front of local customers, manage orders from a
            vendor dashboard, and receive payouts to your linked account.
          </p>
          <div className="flex flex-wrap gap-3 pt-7">
            <a
              href="mailto:support@next360.com?subject=Seller%20application%20—%20Next360"
              className="inline-flex px-7 py-3.5 rounded-full bg-brand-accent text-white text-sm font-semibold shadow-btn hover:scale-105 transition-all duration-300"
            >
              Email us to apply
            </a>
            <a
              href="/#faq"
              className="inline-flex px-7 py-3.5 rounded-full border border-brand-primary text-brand-primary text-sm font-semibold hover:bg-brand-primary/10 transition-all duration-300"
            >
              Read the FAQ
            </a>
          </div>
        </section>

        <section className="max-w-container mx-auto px-6 lg:px-8 pb-16 lg:pb-24">
          <h2 className="font-display text-2xl sm:text-3xl font-medium text-brand-primary">
            How onboarding works
          </h2>
          <ol className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            {steps.map((s, i) => (
              <li key={s.title} className="rounded-[24px] bg-surface-clay p-7 lg:p-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-secondary">
                  Step {i + 1}
                </p>
                <h3 className="font-display text-xl font-semibold text-brand-primary mt-2">
                  {s.title}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed mt-2">{s.copy}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="payouts" className="max-w-container mx-auto px-6 lg:px-8 pb-16 lg:pb-24 scroll-mt-24">
          <div className="rounded-[24px] bg-surface-moss p-7 lg:p-10">
            <h2 className="font-display text-2xl sm:text-3xl font-medium text-brand-primary">
              Payouts
            </h2>
            <p className="text-text-secondary text-sm sm:text-base leading-relaxed mt-3 max-w-3xl">
              Earnings from completed orders are settled to your linked bank account on a
              regular cycle. You can track orders, earnings, and settlement status from
              your vendor dashboard. Exact payout schedule and commission terms are
              confirmed in writing during onboarding.
            </p>
          </div>
        </section>

        <section id="faq" className="max-w-container mx-auto px-6 lg:px-8 pb-20 lg:pb-28 scroll-mt-24">
          <h2 className="font-display text-2xl sm:text-3xl font-medium text-brand-primary">
            Seller questions
          </h2>
          <div className="mt-8 space-y-3 max-w-3xl">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-[16px] bg-neutral-surface border border-neutral-surface overflow-hidden open:shadow-card"
              >
                <summary className="px-6 py-4 cursor-pointer list-none text-sm font-medium text-brand-primary">
                  {f.q}
                </summary>
                <div className="px-6 pb-4">
                  <p className="text-text-secondary text-sm leading-relaxed">{f.a}</p>
                </div>
              </details>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
