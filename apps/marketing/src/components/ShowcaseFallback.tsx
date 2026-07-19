interface ShowcaseFallbackProps {
  accent: string;
  tint: string;
  className?: string;
}

/* Static composition used both as the mobile hero visual and as the
   fallback when WebGL is unavailable or the 3D context is lost — kept as
   one component so the two paths can't drift out of sync. */
export default function ShowcaseFallback({ accent, tint, className = 'w-64 h-64' }: ShowcaseFallbackProps) {
  return (
    <div className={`relative ${className}`}>
      <div
        className="absolute inset-0 rounded-2xl opacity-20 transition-colors duration-250"
        style={{ backgroundColor: tint }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full transition-colors duration-250"
        style={{ backgroundColor: accent, opacity: 0.6 }}
      />
      <div className="absolute top-8 left-8 w-16 h-16 rounded-xl swatch-moss border border-[rgba(92,107,77,0.3)] opacity-80" />
      <div className="absolute bottom-8 right-8 w-14 h-14 rounded-xl swatch-eucalyptus border border-[rgba(47,93,98,0.3)] opacity-80" />
    </div>
  );
}
