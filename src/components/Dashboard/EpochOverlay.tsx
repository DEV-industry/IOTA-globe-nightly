/**
 * EpochOverlay — gmonads-style epoch widget with rotating validator.
 *
 * Shows:
 *  - SVG circular progress ring around epoch number
 *  - Rotating validator showcase (logo, name, city) cycling every 4s
 *  - Network stats badges (validators, countries, cities)
 *  - Linear progress bar + countdown timer
 *
 * Inspired by the epoch widget on gmonads.com.
 */

import { useState, useEffect, useCallback } from 'react';
import { useEpochTimer } from '../../hooks/useEpochTimer';
import {
  getValidatorCity,
  getUniqueCities,
  getUniqueCountries,
} from '../../utils/validatorLocations';
import type { Validator } from '../../types';

// ─── Constants ──────────────────────────────────────────────────

const ROTATE_INTERVAL = 700; // ms between validator switches
const RING_SIZE = 72; // SVG viewBox size
const RING_CENTER = RING_SIZE / 2;
const RING_RADIUS = 28;
const RING_STROKE = 3.5;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// ─── Sub-components ─────────────────────────────────────────────

/** SVG circular progress ring */
function EpochRing({
  epoch,
  progress,
}: {
  epoch: string;
  progress: number;
}) {
  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="relative flex-shrink-0 animate-ring-pulse">
      <svg
        width={RING_SIZE}
        height={RING_SIZE}
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        className="transform -rotate-90"
      >
        <defs>
          <linearGradient id="epochRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>

        {/* Background track */}
        <circle
          cx={RING_CENTER}
          cy={RING_CENTER}
          r={RING_RADIUS}
          fill="none"
          stroke="#1f2937"
          strokeWidth={RING_STROKE}
          opacity={0.5}
        />

        {/* Progress arc */}
        <circle
          cx={RING_CENTER}
          cy={RING_CENTER}
          r={RING_RADIUS}
          fill="none"
          stroke="url(#epochRingGrad)"
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>

      {/* Center content — epoch number + label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[15px] font-bold text-white leading-none tracking-tight">
          #{epoch}
        </span>
        <span className="text-[9px] text-iota-muted uppercase tracking-widest mt-0.5">
          epoch
        </span>
      </div>
    </div>
  );
}

/** Rotating validator card */
function ValidatorShowcase({
  validator,
  animKey,
}: {
  validator: Validator;
  animKey: number;
}) {
  const city = getValidatorCity(validator);

  return (
    <div
      key={animKey}
      className="flex items-center gap-3 animate-fade-in-up min-w-0"
    >
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full overflow-hidden bg-white/10 flex-shrink-0 border border-white/10 shadow-lg shadow-iota-blue/10">
        {validator.imageUrl ? (
          <img
            src={validator.imageUrl}
            alt={validator.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-iota-blue/30 to-iota-cyan/30 flex items-center justify-center">
            <span className="text-xs font-bold text-white/60">
              {validator.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Name + City */}
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-semibold text-white truncate leading-tight">
          {validator.name}
        </span>
        <span className="text-[11px] text-iota-muted truncate leading-tight mt-0.5">
          {city}
        </span>
      </div>
    </div>
  );
}

/** Stat badge pill */
function StatBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-sm font-bold text-white tabular-nums leading-tight">
        {value}
      </span>
      <span className="text-[9px] text-iota-muted uppercase tracking-wider leading-tight">
        {label}
      </span>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────

interface EpochOverlayProps {
  epoch?: string;
  epochStartTimestampMs?: string;
  epochDurationMs?: string;
  validators?: Validator[];
}

export function EpochOverlay({
  epoch,
  epochStartTimestampMs,
  epochDurationMs,
  validators = [],
}: EpochOverlayProps) {
  const { timeLeft, progress, startLabel } = useEpochTimer(
    epochStartTimestampMs,
    epochDurationMs,
  );

  // ─── Rotating validator index ───────────────────────────────

  const [currentIndex, setCurrentIndex] = useState(0);

  const advanceValidator = useCallback(() => {
    if (validators.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % validators.length);
  }, [validators.length]);

  useEffect(() => {
    if (validators.length <= 1) return;
    const timer = setInterval(advanceValidator, ROTATE_INTERVAL);
    return () => clearInterval(timer);
  }, [advanceValidator, validators.length]);

  // ─── Network stats ─────────────────────────────────────────

  const totalValidators = validators.length;
  const uniqueCountries = getUniqueCountries(validators);
  const uniqueCities = getUniqueCities(validators);
  const currentValidator = validators[currentIndex];

  if (!epoch) return null;

  return (
    <a
      href={`https://explorer.iota.org/epoch/${epoch}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-[#0F141C] backdrop-blur-md rounded-xl p-4
                 transition-all cursor-pointer group animate-slide-up
                 hover:bg-[#151c28] border border-white/[0.04]"
    >
      {/* ─── Top row: Ring | Divider | Validator | Stats ─── */}
      <div className="flex items-center gap-4">
        {/* Epoch Ring */}
        <EpochRing epoch={epoch} progress={progress} />

        {/* Vertical divider */}
        <div className="w-px h-12 bg-gradient-to-b from-transparent via-iota-border/60 to-transparent flex-shrink-0" />

        {/* Rotating Validator */}
        <div className="flex-1 min-w-0">
          {currentValidator ? (
            <ValidatorShowcase
              validator={currentValidator}
              animKey={currentIndex}
            />
          ) : (
            <div className="text-xs text-iota-muted">Loading validators…</div>
          )}
        </div>

        {/* Vertical divider */}
        <div className="w-px h-12 bg-gradient-to-b from-transparent via-iota-border/60 to-transparent flex-shrink-0 hidden sm:block" />

        {/* Network stats badges */}
        {totalValidators > 0 && (
          <div className="hidden sm:flex items-center gap-4">
            <StatBadge label="validators" value={totalValidators} />
            <StatBadge label="countries" value={uniqueCountries} />
            <StatBadge label="cities" value={uniqueCities} />
          </div>
        )}
      </div>

      {/* ─── Progress bar + labels ─────────────────────────── */}
      <div className="mt-3 pt-3 border-t border-white/[0.04]">
        <div className="w-full h-1 bg-iota-border/40 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-iota-blue to-iota-cyan rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(progress * 100, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-iota-muted">{startLabel}</span>
          <span className="text-[10px] text-iota-label font-medium tabular-nums">
            {timeLeft}
          </span>
        </div>
      </div>
    </a>
  );
}
