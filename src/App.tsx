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
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnalyticsPage } from './components/Dashboard/AnalyticsPage';
import { Header } from './components/Dashboard/Header';
import { NetworkActivityCard } from './components/Dashboard/NetworkActivityCard';
import { TransactionBlocksCard } from './components/Dashboard/TransactionBlocksCard';
import { HeroGlobe } from './components/Dashboard/HeroGlobe';
import { EpochOverlay } from './components/Dashboard/EpochOverlay';
import { PriceOverlay } from './components/Dashboard/PriceOverlay';
import { TopValidatorsCard } from './components/Dashboard/TopValidatorsCard';
import { LiveTpsCard } from './components/Dashboard/LiveTpsCard';
import { DataTable } from './components/Dashboard/DataTable';
import { RefGasCard, AvgTxnCard, StorageFundCard, TotalStakedCard, NetworkApyCard } from './components/Dashboard/NetworkEconomicsCard';
import { ErrorBoundary } from './components/UI/ErrorBoundary';
import { StarsBackground } from './components/UI/StarsBackground';
import { GlobalLoader } from './components/UI/GlobalLoader';
import { IotaLogo } from './components/UI/IotaLogo';
import { Footer } from './components/UI/Footer';
import { useValidators } from './hooks/useValidators';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function AppContent() {
  const {
    validators,
    epoch,
    totalStake,
    iotaTotalSupply,
    activeValidatorCount,
    data,
    isLoading,
  } = useValidators();

  const [isGlobeReady, setIsGlobeReady] = useState(false);
  const [showAnimations, setShowAnimations] = useState(false);

  // When isLoading is false AND globe is ready, trigger animations
  useEffect(() => {
    if (!isLoading && isGlobeReady) {
      // Small delay to ensure loader has started fading out
      const t = setTimeout(() => setShowAnimations(true), 100);
      return () => clearTimeout(t);
    }
  }, [isLoading, isGlobeReady]);

  const isFullyLoaded = !isLoading && isGlobeReady;

  return (
    <div className="min-h-screen bg-[#000] text-white relative">
      <AnimatePresence>
        {!isFullyLoaded && <GlobalLoader />}
      </AnimatePresence>

      <StarsBackground />
      <Header showAnimations={showAnimations} />

      <main className="max-w-[1400px] mx-auto pt-20 pb-8">
        {/* ─── Top Globe Section ──────────────────────────── */}
        <div className={`w-full transition-opacity duration-1000 ${isFullyLoaded ? 'opacity-100' : 'opacity-0'}`}>
          <ErrorBoundary>
            <HeroGlobe validators={validators} onReady={() => setIsGlobeReady(true)} />
          </ErrorBoundary>
        </div>

        {/* ─── Dashboard Cards Grid ─────────────────────────── */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 max-w-5xl mx-auto gap-4 mb-3 -mt-[5vh] px-4 lg:px-8">
          {/* Column 1: Network Activity + Overlays */}
          <div className="flex flex-col gap-3">
            <motion.div initial={{ y: 30, opacity: 0 }} animate={showAnimations ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
              <EpochOverlay
                epoch={epoch}
                epochStartTimestampMs={data?.epochStartTimestampMs}
                epochDurationMs={data?.epochDurationMs}
                validators={validators}
              />
            </motion.div>

            <motion.div initial={{ y: 30, opacity: 0 }} animate={showAnimations ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }} transition={{ duration: 0.5, delay: 0.5 }}>
              <NetworkActivityCard
                activeValidatorCount={activeValidatorCount}
                totalStake={totalStake}
                iotaTotalSupply={iotaTotalSupply}
                referenceGasPrice={data?.referenceGasPrice}
              />
            </motion.div>

            <motion.div initial={{ y: 30, opacity: 0 }} animate={showAnimations ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }} transition={{ duration: 0.5, delay: 0.6 }}>
              <PriceOverlay />
            </motion.div>

            <motion.div initial={{ y: 30, opacity: 0 }} animate={showAnimations ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }} transition={{ duration: 0.5, delay: 0.7 }}>
              <TopValidatorsCard />
            </motion.div>
          </div>

          {/* Column 2: Live TPS + Transaction Blocks */}
          <div className="flex flex-col gap-3">
            <motion.div initial={{ y: 30, opacity: 0 }} animate={showAnimations ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }} transition={{ duration: 0.5, delay: 0.8 }}>
              <LiveTpsCard />
            </motion.div>

            <motion.div initial={{ y: 30, opacity: 0 }} animate={showAnimations ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }} transition={{ duration: 0.5, delay: 0.9 }}>
              <TransactionBlocksCard />
            </motion.div>

            <motion.div initial={{ y: 30, opacity: 0 }} animate={showAnimations ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }} transition={{ duration: 0.5, delay: 1.0 }}>
              <RefGasCard />
            </motion.div>
          </div>
        </div>

        {/* ─── Bottom Economics Row ─────────────────────────── */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto gap-4 mb-6 px-4 lg:px-8">
          <motion.div initial={{ y: 30, opacity: 0 }} animate={showAnimations ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }} transition={{ duration: 0.5, delay: 1.1 }}>
            <AvgTxnCard />
          </motion.div>
          <motion.div initial={{ y: 30, opacity: 0 }} animate={showAnimations ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }} transition={{ duration: 0.5, delay: 1.15 }}>
            <StorageFundCard />
          </motion.div>
          <motion.div initial={{ y: 30, opacity: 0 }} animate={showAnimations ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }} transition={{ duration: 0.5, delay: 1.2 }}>
            <TotalStakedCard />
          </motion.div>
          <motion.div initial={{ y: 30, opacity: 0 }} animate={showAnimations ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }} transition={{ duration: 0.5, delay: 1.25 }}>
            <NetworkApyCard />
          </motion.div>
        </div>

        {/* ─── Divider ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={showAnimations ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.8, delay: 1.25 }}
          className="flex items-center justify-center max-w-5xl mx-auto px-4 lg:px-8 my-10"
        >
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent flex-1" />
          <div className="mx-6 text-white/20 hover:text-white/40 transition-colors duration-500">
            <IotaLogo />
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent flex-1" />
        </motion.div>

        {/* ─── Data Table Section ───────────────────────────── */}
        <motion.div initial={{ y: 30, opacity: 0 }} animate={showAnimations ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }} transition={{ duration: 0.5, delay: 1.3 }} className="px-4 lg:px-8">
          <DataTable />
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}

import { SettingsProvider } from './context/SettingsContext';

function ChartsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [showAnimations, setShowAnimations] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setIsLoading(false);
      setTimeout(() => setShowAnimations(true), 100);
    }, 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#000] text-white relative">
      <AnimatePresence>
        {isLoading && <GlobalLoader />}
      </AnimatePresence>

      <StarsBackground />
      <Header showAnimations={showAnimations} />
      <motion.div
        initial={{ opacity: 0 }}
        animate={showAnimations ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6 }}
      >
        <AnalyticsPage />
      </motion.div>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <SettingsProvider>
          <Routes>
            <Route path="/" element={<AppContent />} />
            <Route path="/charts" element={<ChartsPage />} />
          </Routes>
        </SettingsProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}