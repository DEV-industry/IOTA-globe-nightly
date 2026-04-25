export default function App() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden font-sans">
      {/* ─── Top Navigation Bar ─────────────────────────────────── */}
      <TopNav />

      {/* ─── Hero Section — Globe ───────────────────────────────── */}
      <HeroSection />

      {/* ─── Dashboard Grid ─────────────────────────────────────── */}
      <DashboardGrid />

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TOP NAVIGATION
   ═══════════════════════════════════════════════════════════════ */
function TopNav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#00c2ff] to-[#7b61ff] shadow-lg shadow-[#00c2ff]/20 transition-shadow group-hover:shadow-[#00c2ff]/40">
            <span className="text-sm font-bold text-white tracking-tight">IO</span>
          </div>
          <span className="text-base font-semibold tracking-tight">
            IOTA <span className="text-iota-muted font-normal">Globe</span>
          </span>
        </a>

        {/* Center nav links */}
        <nav className="hidden md:flex items-center gap-8">
          {['Dashboard', 'Validators', 'Staking', 'Network'].map((link) => (
            <a
              key={link}
              href="#"
              className="nav-link text-sm text-iota-muted hover:text-[#00c2ff] transition-colors"
            >
              {link}
            </a>
          ))}
        </nav>

        {/* Right side — Network status */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
            </span>
            <span className="text-emerald-300 font-medium">Mainnet</span>
          </div>
          {/* Mobile menu button */}
          <button className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg bg-white/5 text-iota-muted hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HERO SECTION — Globe + Floating Panels
   ═══════════════════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="relative w-full" style={{ height: 'clamp(400px, 58vh, 720px)' }}>
      {/* Subtle radial gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#00c2ff]/[0.03] blur-[120px]" />
      </div>

      {/* Globe placeholder */}
      <div className="relative z-10 flex h-full w-full items-center justify-center px-4">
        <div className="w-full h-full max-w-5xl flex items-center justify-center border border-dashed border-gray-700 rounded-2xl text-iota-muted text-lg">
          GLOBE PLACEHOLDER
        </div>
      </div>

      {/* ── Left Floating Panel — Epoch & Featured Validator ──── */}
      <div className="absolute left-4 sm:left-6 lg:left-8 top-6 z-20 glass-panel p-4 w-64 animate-fade-in-up hidden lg:block">
        {/* Epoch */}
        <div className="mb-4">
          <p className="text-[11px] uppercase tracking-widest text-iota-muted mb-1">Current Epoch</p>
          <p className="text-2xl font-semibold stat-value">1,247</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-iota-muted">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
              <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
            </svg>
            <span>Ends in <span className="text-white font-medium">3h 24m</span></span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-white/5 my-3" />

        {/* Featured Validator */}
        <div>
          <p className="text-[11px] uppercase tracking-widest text-iota-muted mb-2">Featured Validator</p>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#00c2ff]/20 to-[#7b61ff]/20 border border-white/10 text-xs font-bold text-[#00c2ff]">
              IF
            </div>
            <div>
              <p className="text-sm font-medium text-white">IOTA Foundation</p>
              <p className="text-xs text-iota-muted">12.4% Voting Power</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Floating Panel — Global Stats ──────────────── */}
      <div className="absolute right-4 sm:right-6 lg:right-8 top-6 z-20 glass-panel p-4 w-56 animate-fade-in-up animation-delay-100 hidden lg:block">
        <p className="text-[11px] uppercase tracking-widest text-iota-muted mb-3">Network Stats</p>
        <div className="space-y-3.5">
          <StatRow label="Total Validators" value="142" />
          <StatRow label="Countries" value="38" />
          <StatRow label="Total Staked" value="4.2B" suffix="IOTA" />
          <StatRow label="Avg APY" value="6.12" suffix="%" />
        </div>
      </div>
    </section>
  );
}

/* ── Stat row helper ────────────────────────────────────────── */
function StatRow({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-iota-muted">{label}</span>
      <span className="text-sm font-semibold text-white">
        {value}
        {suffix && <span className="ml-1 text-xs text-iota-muted font-normal">{suffix}</span>}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD GRID
   ═══════════════════════════════════════════════════════════════ */
function DashboardGrid() {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12 -mt-4">
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-white">
          Network Overview
        </h2>
        <div className="flex items-center gap-2 text-xs text-iota-muted">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60"></span>
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
          </span>
          Live data
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card 1 — Proposal History */}
        <DashboardCard
          title="Proposal History"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
            </svg>
          }
          animationDelay="animation-delay-100"
        >
          <div className="space-y-2.5">
            {[
              { epoch: '1,247', proposals: 892, success: 99.2 },
              { epoch: '1,246', proposals: 887, success: 98.9 },
              { epoch: '1,245', proposals: 901, success: 99.5 },
              { epoch: '1,244', proposals: 878, success: 99.1 },
            ].map((row) => (
              <div key={row.epoch} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-iota-muted font-mono">E{row.epoch}</span>
                  <span className="text-sm text-white">{row.proposals} proposals</span>
                </div>
                <span className="text-xs font-medium text-emerald-400">{row.success}%</span>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Card 2 — Recent Blocks */}
        <DashboardCard
          title="Recent Blocks"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          }
          animationDelay="animation-delay-200"
        >
          <div className="space-y-2.5">
            {[
              { height: '14,892,301', txns: 234, time: '2s ago' },
              { height: '14,892,300', txns: 189, time: '4s ago' },
              { height: '14,892,299', txns: 312, time: '6s ago' },
              { height: '14,892,298', txns: 157, time: '8s ago' },
            ].map((block) => (
              <div key={block.height} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#00c2ff]/10 text-[#00c2ff]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-white font-mono">#{block.height}</p>
                    <p className="text-xs text-iota-muted">{block.txns} txns</p>
                  </div>
                </div>
                <span className="text-xs text-iota-muted">{block.time}</span>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Card 3 — Top Validators */}
        <DashboardCard
          title="Top Validators"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 15l-2 5l9-11h-5l2-5l-9 11h5z" />
            </svg>
          }
          animationDelay="animation-delay-300"
        >
          <div className="space-y-2.5">
            {[
              { name: 'IOTA Foundation', stake: '580M', apy: 6.2, rank: 1 },
              { name: 'Everstake', stake: '420M', apy: 5.9, rank: 2 },
              { name: 'Staking Defense', stake: '310M', apy: 6.5, rank: 3 },
              { name: 'Figment', stake: '285M', apy: 5.7, rank: 4 },
            ].map((v) => (
              <div key={v.name} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#00c2ff]/15 to-[#7b61ff]/15 border border-white/10 text-[10px] font-bold text-[#00c2ff]">
                    {v.rank}
                  </div>
                  <div>
                    <p className="text-sm text-white">{v.name}</p>
                    <p className="text-xs text-iota-muted">{v.stake} IOTA staked</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-[#00c2ff]">{v.apy}% APY</span>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Card 4 — Network Health */}
        <DashboardCard
          title="Network Health"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          }
          animationDelay="animation-delay-400"
        >
          <div className="space-y-4">
            <HealthBar label="Finality" value={99.8} />
            <HealthBar label="Uptime" value={99.95} />
            <HealthBar label="TPS (current)" value={72} max={100} unit="" />
            <div className="pt-2 mt-1 border-t border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-iota-muted">Reference Gas Price</span>
                <span className="text-sm font-mono text-white">1,000 <span className="text-iota-muted text-xs">NANOS</span></span>
              </div>
            </div>
          </div>
        </DashboardCard>
      </div>
    </section>
  );
}

/* ── Dashboard Card wrapper ─────────────────────────────────── */
function DashboardCard({
  title,
  icon,
  children,
  animationDelay,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  animationDelay?: string;
}) {
  return (
    <div className={`dashboard-card p-5 animate-fade-in-up ${animationDelay ?? ''}`}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-[#00c2ff]">
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

/* ── Health bar helper ──────────────────────────────────────── */
function HealthBar({ label, value, max = 100, unit = '%' }: { label: string; value: number; max?: number; unit?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  const color = pct > 95 ? 'bg-emerald-400' : pct > 80 ? 'bg-yellow-400' : 'bg-red-400';

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-iota-muted">{label}</span>
        <span className="text-sm font-semibold text-white">
          {value}{unit}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="border-t border-white/5 py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-iota-muted">
          © 2026 IOTA Globe — Real-time validator map
        </p>
        <div className="flex items-center gap-5">
          {['Docs', 'GitHub', 'Discord'].map((link) => (
            <a
              key={link}
              href="#"
              className="text-xs text-iota-muted hover:text-[#00c2ff] transition-colors"
            >
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}