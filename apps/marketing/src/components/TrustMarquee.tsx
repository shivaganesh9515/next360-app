export default function TrustMarquee() {
  const items = [
    'Hyderabad',
    'Karimnagar',
    'Vijayawada',
    'Verified Organic Sellers',
    'Farm-to-Door Delivery',
    'Supporting Local Communities',
  ];

  return (
    <section className="bg-brand-primary py-4 overflow-hidden" role="marquee" aria-label="Trusted across cities">
      <div className="flex whitespace-nowrap animate-marquee group group-hover:[animation-play-state:paused]">
        {[...Array(3)].map((_, loop) => (
          <div key={loop} className="flex items-center gap-8 mx-4 shrink-0">
            {items.map((item, i) => (
              <span key={`${loop}-${i}`} className="inline-flex items-center gap-8">
                <span className="text-neutral-bg/60 text-xs font-semibold tracking-widest uppercase">
                  {item}
                </span>
                {i < items.length - 1 && (
                  <span className="w-1 h-1 rounded-full bg-brand-secondary/40" />
                )}
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
