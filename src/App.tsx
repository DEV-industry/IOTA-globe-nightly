/**
 * App — root layout composing StatsBar, Sidebar, and Globe.
 */

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatsBar } from './components/Stats/StatsBar';
import { ValidatorList } from './components/Sidebar/ValidatorList';
import { GlobeScene } from './components/Globe/GlobeScene';
import { ErrorBoundary } from './components/UI/ErrorBoundary';
import { useValidators } from './hooks/useValidators';
import type { Validator } from './types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { validators, isLoading } = useValidators();
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  const handleSelectValidator = (validator: Validator) => {
    setSelectedAddress(
      validator.iotaAddress === selectedAddress ? null : validator.iotaAddress,
    );
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Top stats bar */}
      <StatsBar />

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row pt-14">
        {/* Sidebar (validator list) */}
        <aside className="w-full lg:w-[360px] xl:w-[400px] h-[40vh] lg:h-full border-b lg:border-b-0 lg:border-r border-iota-border bg-iota-dark/80 backdrop-blur-sm shrink-0 flex flex-col">
          <ValidatorList
            validators={validators}
            isLoading={isLoading}
            selectedAddress={selectedAddress}
            onSelectValidator={handleSelectValidator}
          />
        </aside>

        {/* Globe */}
        <main className="flex-1 min-h-0 bg-iota-dark">
          <ErrorBoundary>
            <GlobeScene
              validators={validators}
              selectedAddress={selectedAddress}
              onSelectValidator={handleSelectValidator}
            />
          </ErrorBoundary>
        </main>
      </div>
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
