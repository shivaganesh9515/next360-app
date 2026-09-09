import type { Metadata } from 'next';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Deliver with Next360 | Become a Delivery Partner',
  description:
    'Apply as a Next360 delivery partner: requirements, how earnings work, and how to contact our onboarding team.',
};

const steps = [
  {
    title: 'Apply',
    copy: 'Email our onboarding team with your name, city, and vehicle type. We currently onboard partners in Hyderabad, Karimnagar, and Vijayawada.',
  },
  {
    title: 'Get approved',
    copy: 'We verify your identity documents before you can accept deliveries. We will confirm the exact checklist by email.',
  },
  {
    title: 'Go online',
    copy: 'Open the delivery app, mark yourself available, and accept incoming delivery requests in your zone.',
  },
  {
    title: 'Earn per delivery',
    copy: 'Complete pickups and drop-offs, confirm each delivery in the app, and track your earnings and payout status.',
  },
];

const faqs = [
  {
    q: 'What do I need to deliver?',
    a: 'A valid ID proof, a smartphone, and your own vehicle (bicycle, scooter, or bike). Exact document requirements are confirmed by email during onboarding.',
  },
  {
    q: 'When do I get paid?',
    a: 'Delivery earnings are settled to your linked account on a regular cycle. You can track completed deliveries, earnings, and payout status in the delivery app.',
  },
  {
    q: 'How do I get support?',
    a: 'Email support@next360.com with your registered phone number, and our team will respond during business hours.',
  },
];

export default function PartnersPage() {
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
            For delivery partners
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-medium text-brand-primary leading-tight tracking-tight mt-3 max-w-2xl">
            Earn on your schedule <span className="italic text-brand-accent">with Next360.</span>
          </h1>
          <p className="text-text-secondary text-base sm:text-lg leading-relaxed mt-5 max-w-2xl">
            Accept local deliveries when you are online, serve your community, and track
            every earning in the delivery app.
          </p>
          <div className="flex flex-wrap gap-3 pt-7">
            <a
              href="mailto:support@next360.com?subject=Delivery%20partner%20application%20—%20Next360"
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
              <li key={s.title} className="rounded-[24px] bg-surface-bark p-7 lg:p-8">
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

        <section id="earnings" className="max-w-container mx-auto px-6 lg:px-8 pb-16 lg:pb-24 scroll-mt-24">
          <div className="rounded-[24px] bg-surface-moss p-7 lg:p-10">
            <h2 className="font-display text-2xl sm:text-3xl font-medium text-brand-primary">
              Earnings
            </h2>
            <p className="text-text-secondary text-sm sm:text-base leading-relaxed mt-3 max-w-3xl">
              You earn per completed delivery, based on factors like distance and any
              active incentives. Earnings vary with the number of deliveries you complete.
              Payouts are settled to your linked account on a regular cycle, and you can
              track everything in the delivery app.
            </p>
          </div>
        </section>

        <section id="faq" className="max-w-container mx-auto px-6 lg:px-8 pb-20 lg:pb-28 scroll-mt-24">
          <h2 className="font-display text-2xl sm:text-3xl font-medium text-brand-primary">
            Partner questions
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
