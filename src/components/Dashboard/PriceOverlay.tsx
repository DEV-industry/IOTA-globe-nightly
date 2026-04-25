/**
 * PriceOverlay — floating IOTA price display.
 *
 * Shows the current IOTA price with a link to CoinGecko.
 * Uses hardcoded placeholder price (no new API calls).
 */

export function PriceOverlay() {
  return (
    <a
      href="https://www.coingecko.com/en/coins/iota"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 bg-iota-bg/90 backdrop-blur-md border border-iota-border
                 rounded-xl px-4 py-3 hover:border-iota-blue/30 transition-colors group animate-slide-up"
    >
      {/* IOTA icon */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-iota-blue to-iota-cyan flex items-center justify-center shrink-0">
        <svg
          viewBox="0 0 24 24"
          fill="white"
          className="w-4 h-4"
        >
          <circle cx="12" cy="4" r="2" />
          <circle cx="8" cy="10" r="1.8" />
          <circle cx="14" cy="9" r="1.5" />
          <circle cx="10" cy="15" r="1.3" />
          <circle cx="16" cy="14" r="1.2" />
          <circle cx="12" cy="20" r="2" />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-semibold text-white">1 IOTA = $0.06</span>
        </div>
        <span className="text-[11px] text-iota-muted group-hover:text-iota-label transition-colors">
          via CoinGecko
        </span>
      </div>
    </a>
  );
}
