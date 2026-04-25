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

  return (
    <div className="min-h-screen bg-iota-bg text-white">
      <Header />

      <main className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-20 pb-8">
        {/* ─── Top Globe Section ──────────────────────────── */}
        <div className=" w-full -mx-4 px-4 lg:mx-0 lg:px-0">
          <ErrorBoundary>
            <HeroGlobe validators={validators} />
          </ErrorBoundary>
        </div>

        {/* ─── Dashboard Cards Grid ─────────────────────────── */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 max-w-5xl mx-auto gap-4 mb-6 -mt-[5vh]">
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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}