/**
 * App — root layout composing the IOTA Explorer Dashboard.
 *
 * Structure:
 *  - Fixed Header (logo, search, network selector)
 *  - Hero Globe (top full-width visualization)
 *  - Dashboard grid: NetworkActivity + overlays, TransactionBlocks
 *  - Data Table with tabbed navigation
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from './components/Dashboard/Header';
import { NetworkActivityCard } from './components/Dashboard/NetworkActivityCard';
import { TransactionBlocksCard } from './components/Dashboard/TransactionBlocksCard';
import { HeroGlobe } from './components/Dashboard/HeroGlobe';
import { EpochOverlay } from './components/Dashboard/EpochOverlay';
import { PriceOverlay } from './components/Dashboard/PriceOverlay';
import { DataTable } from './components/Dashboard/DataTable';
import { ErrorBoundary } from './components/UI/ErrorBoundary';
import { useValidators } from './hooks/useValidators';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const {
    validators,
    epoch,
    totalStake,
    iotaTotalSupply,
    activeValidatorCount,
    data,
  } = useValidators();

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
    <div className="min-h-screen bg-iota-bg text-white">
      <Header />

      <main className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-20 pb-8">
        {/* ─── Top Globe Section ──────────────────────────── */}
        <div className="mb-8 w-full -mx-4 px-4 lg:mx-0 lg:px-0">
          <ErrorBoundary>
            <HeroGlobe validators={validators} />
          </ErrorBoundary>
        </div>

        {/* ─── Dashboard Cards Grid ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Column 1: Network Activity + Overlays */}
          <div className="flex flex-col gap-3">
            <NetworkActivityCard
              activeValidatorCount={activeValidatorCount}
              totalStake={totalStake}
              iotaTotalSupply={iotaTotalSupply}
              referenceGasPrice={data?.referenceGasPrice}
            />
            <EpochOverlay
              epoch={epoch}
              epochStartTimestampMs={data?.epochStartTimestampMs}
              epochDurationMs={data?.epochDurationMs}
            />
            <PriceOverlay />
          </div>

          {/* Column 2: Transaction Blocks */}
          <TransactionBlocksCard epoch={epoch} />
        </div>

        {/* ─── Data Table Section ───────────────────────────── */}
        <DataTable validators={validators} />
      </main>
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