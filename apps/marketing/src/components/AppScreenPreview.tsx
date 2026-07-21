interface AppScreenPreviewProps {
  accent?: string;
  tint?: string;
}

/* The Customer App's Home screen, recreated in miniature — used as the
   product visual in both the Hero mockup and the App Download section, so
   the two never drift apart. Not a screenshot (none exist yet), but a real
   recreation of next360-home-preview.html's layout/tokens, not stock art. */
export default function AppScreenPreview({ accent = '#5C6B4D', tint = '#EDF0E8' }: AppScreenPreviewProps) {
  return (
    <div className="p-4 space-y-4 bg-background min-h-[480px]">
      {/* Greeting */}
      <div>
        <p className="font-display text-sm text-muted-foreground">Good morning</p>
        <p className="font-display text-lg font-bold text-foreground">Rahul 👋</p>
      </div>

      {/* Search bar */}
      <div className="h-9 bg-secondary rounded-lg flex items-center px-3">
        <span className="text-xs text-muted-foreground">Search organic groceries...</span>
      </div>

      {/* Mini swatch row */}
      <div className="flex gap-2">
        <div className="w-8 h-8 rounded-md swatch-moss border border-[rgba(92,107,77,0.3)]" />
        <div className="w-8 h-8 rounded-md swatch-clay border border-[rgba(155,106,63,0.3)]" />
        <div className="w-8 h-8 rounded-md swatch-eucalyptus border border-[rgba(47,93,98,0.3)]" />
      </div>

      {/* Banner — synced to the active swatch */}
      <div
        className="h-20 rounded-lg border flex items-center justify-center transition-colors duration-250"
        style={{ backgroundColor: tint, borderColor: `${accent}4D` }}
      >
        <span className="font-display text-xs font-medium transition-colors duration-250" style={{ color: accent }}>
          Fresh this week
        </span>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-border overflow-hidden">
            <div className="h-16 bg-secondary" />
            <div className="p-2">
              <p className="text-[10px] text-muted-foreground leading-tight">Organic Tomato</p>
              <p className="font-mono text-xs font-semibold text-primary mt-0.5">₹42</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <div className="h-14 -mx-4 -mb-4 border-t border-border bg-background flex items-center justify-around px-4">
        {['Home', 'Shop', 'Cart', 'Orders'].map((tab, i) => (
          <div key={tab} className="flex flex-col items-center gap-0.5">
            <div className={`w-5 h-5 rounded-full ${i === 0 ? 'bg-primary' : 'bg-secondary'}`} />
            <span className={`text-[9px] ${i === 0 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
              {tab}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
