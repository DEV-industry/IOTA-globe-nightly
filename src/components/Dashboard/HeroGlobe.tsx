/**
 * HeroGlobe — top-level globe visualization container without card styling.
 *
 * Sits at the very top of the dashboard.
 */

import { useState, useMemo, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { GlobeScene } from '../Globe/GlobeScene';
import { ValidatorModal } from '../Globe/ValidatorModal';
import type { Validator } from '../../types';

interface HeroGlobeProps {
  validators: Validator[];
  onReady?: () => void;
}

export function HeroGlobe({ validators, onReady }: HeroGlobeProps) {
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [showModalFor, setShowModalFor] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state && (location.state as any).selectValidator) {
      const address = (location.state as any).selectValidator;
      setSelectedAddress(address);
      setShowModalFor(null); // hide immediately
      
      // Delay the modal to let globe animation finish
      setTimeout(() => {
        setShowModalFor(address);
      }, 1200);

      // Clear the state after reading it so we don't re-trigger on un-related renders
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleSelectValidator = (validator: Validator) => {
    const isDeselecting = validator.iotaAddress === selectedAddress;
    
    if (isDeselecting) {
      setSelectedAddress(null);
      setShowModalFor(null);
    } else {
      setSelectedAddress(validator.iotaAddress);
      setShowModalFor(null);
      
      // Delay showing the modal
      setTimeout(() => {
        setShowModalFor(validator.iotaAddress);
      }, 1200);
    }
  };

  const selectedValidator = useMemo(() => {
    if (!showModalFor) return null;
    return validators.find(v => v.iotaAddress === showModalFor) || null;
  }, [showModalFor, validators]);

  return (
    <div className="w-full relative animate-fade-in h-[70vh]">
      <GlobeScene
        validators={validators}
        selectedAddress={selectedAddress}
        onSelectValidator={handleSelectValidator}
        onReady={onReady}
      />
      
      {/* Bottom fade overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black to-transparent pointer-events-none z-10" />

      {/* Optional: Add a subtle overlay for validator count if needed, or leave it pure */}
      <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-iota-dark/40 backdrop-blur-sm border border-white/5 text-xs text-iota-muted">
        <span className="text-white font-medium">{validators.length}</span> validators
      </div>

      <AnimatePresence>
        {selectedValidator && (
          <ValidatorModal
            validator={selectedValidator}
            onClose={() => {
              setSelectedAddress(null);
              setShowModalFor(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
