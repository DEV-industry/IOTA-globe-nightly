/**
 * HeroGlobe — top-level globe visualization container without card styling.
 *
 * Sits at the very top of the dashboard.
 */

import { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { GlobeScene } from '../Globe/GlobeScene';
import { ValidatorModal } from '../Globe/ValidatorModal';
import type { Validator } from '../../types';

interface HeroGlobeProps {
  validators: Validator[];
  onReady?: () => void;
}

export function HeroGlobe({ validators, onReady }: HeroGlobeProps) {
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  const handleSelectValidator = (validator: Validator) => {
    setSelectedAddress(
      validator.iotaAddress === selectedAddress ? null : validator.iotaAddress,
    );
  };

  const selectedValidator = useMemo(() => {
    if (!selectedAddress) return null;
    return validators.find(v => v.iotaAddress === selectedAddress) || null;
  }, [selectedAddress, validators]);

  return (
    <div className="w-full relative animate-fade-in h-[70vh]">
      <GlobeScene
        validators={validators}
        selectedAddress={selectedAddress}
        onSelectValidator={handleSelectValidator}
        onReady={onReady}
      />
      {/* Optional: Add a subtle overlay for validator count if needed, or leave it pure */}
      <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-iota-dark/40 backdrop-blur-sm border border-white/5 text-xs text-iota-muted">
        <span className="text-white font-medium">{validators.length}</span> validators
      </div>

      <AnimatePresence>
        {selectedValidator && (
          <ValidatorModal
            validator={selectedValidator}
            onClose={() => setSelectedAddress(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
