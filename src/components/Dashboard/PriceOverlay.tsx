/**
 * PriceOverlay — floating IOTA price display.
 *
 * Shows the current IOTA price with a link to CoinGecko.
 */

export function PriceOverlay() {
  return (
    <a
      href="https://www.coingecko.com/en/coins/iota"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-4 bg-black/40 backdrop-blur-md border border-white/10
                 rounded-2xl px-5 py-3.5 transition-all group animate-slide-up hover:bg-white/5"
    >
      {/* IOTA icon - Classic Logo */}
      <div className="w-10 h-10 shrink-0 shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-shadow rounded-full overflow-hidden bg-white/5 p-0.5">
        <img 
          src="https://cryptologos.cc/logos/iota-miota-logo.png" 
          alt="IOTA"
          className="w-full h-full object-contain drop-shadow-md"
          onError={(e) => {
            // Fallback if image fails to load
            (e.target as HTMLImageElement).src = 'https://s2.coinmarketcap.com/static/img/coins/64x64/1720.png';
          }}
        />
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-[16px] leading-tight font-bold text-white tracking-tight">
          1 IOTA = $0.06
        </span>
        <span className="text-[11px] leading-none text-iota-muted font-medium transition-colors">
          via CoinGecko
        </span>
      </div>
    </a>
  );
}
