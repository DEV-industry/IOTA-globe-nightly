/**
 * HeroGlobe — top-level globe visualization container without card styling.
 *
 * Sits at the very top of the dashboard.
 */

import { useState } from 'react';
import { GlobeScene } from '../Globe/GlobeScene';
import type { Validator } from '../../types';

interface HeroGlobeProps {
  validators: Validator[];
}

export function HeroGlobe({ validators }: HeroGlobeProps) {
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  const handleSelectValidator = (validator: Validator) => {
    setSelectedAddress(
      validator.iotaAddress === selectedAddress ? null : validator.iotaAddress,
    );
  };

  return (
    <div className="w-full relative animate-fade-in h-[70vh]">
      <GlobeScene
        validators={validators}
        selectedAddress={selectedAddress}
        onSelectValidator={handleSelectValidator}
      />
      {/* Optional: Add a subtle overlay for validator count if needed, or leave it pure */}
      <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-iota-dark/40 backdrop-blur-sm border border-white/5 text-xs text-iota-muted">
        <span className="text-white font-medium">{validators.length}</span> validators
      </div>
    </div>
  );
}
