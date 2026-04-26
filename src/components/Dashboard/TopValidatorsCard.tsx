/**
 * TopValidatorsCard — Top 5 Validators by Voting Power.
 *
 * Displays a ranked list of the top validators sorted by
 * votingPower (basis-points). Each row shows avatar, name/address,
 * staked amount, a proportional voting-power bar, and APY.
 *
 * Uses the existing `useValidators` hook for live data,
 * auto-refreshes every 30 s.
 */

import { useValidators } from '../../hooks/useValidators';
import {
  formatStakeCompact,
  truncateAddress,
  formatApy,
} from '../../utils/formatters';
import type { Validator } from '../../types';

// ─── Skeleton placeholder ───────────────────────────────────────

function SkeletonRow({ index }: { index: number }) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-3 animate-pulse"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Rank */}
      <div className="w-5 h-4 rounded bg-white/5" />

      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-white/5 flex-shrink-0" />

      {/* Name + bar */}
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="w-24 h-3 rounded bg-white/5" />
        <div className="w-full h-1.5 rounded-full bg-white/5" />
      </div>

      {/* Stake */}
      <div className="w-16 h-4 rounded bg-white/5" />
    </div>
  );
}

// ─── Single validator row ───────────────────────────────────────

interface ValidatorRowProps {
  validator: Validator;
  rank: number;
  maxVotingPower: number;
  index: number;
}

function ValidatorRow({
  validator,
  rank,
  maxVotingPower,
  index,
}: ValidatorRowProps) {
  const votingPower = Number(validator.votingPower);
  const barPercent =
    maxVotingPower > 0 ? (votingPower / maxVotingPower) * 100 : 0;
  const displayName =
    validator.name || truncateAddress(validator.iotaAddress, 6);
  const votingPowerPct = (votingPower / 100).toFixed(2); // basis points → %

  // Rank badge colors: gold / silver / bronze / default
  const rankColors: Record<number, string> = {
    1: 'text-amber-400',
    2: 'text-slate-300',
    3: 'text-amber-600',
  };

  return (
    <div
      className="group flex items-center gap-3 px-3 py-2.5 rounded-xl
                 hover:bg-white/[0.04] transition-all duration-200 cursor-pointer
                 animate-fade-in-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Rank */}
      <span
        className={`w-5 text-center text-xs font-bold tabular-nums
                     ${rankColors[rank] ?? 'text-iota-muted'}`}
      >
        {rank}
      </span>

      {/* Avatar */}
      <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-white/10">
        {validator.imageUrl ? (
          <img
            src={validator.imageUrl}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-iota-blue/30 to-iota-cyan/20 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white/60">
              {displayName.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
        {/* Subtle glow for top 3 */}
        {rank <= 3 && (
          <div className="absolute inset-0 rounded-full ring-1 ring-iota-cyan/20" />
        )}
      </div>

      {/* Name + Voting Power Bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-white font-medium truncate mr-2">
            {displayName}
          </span>
          <span className="text-[10px] text-iota-muted tabular-nums whitespace-nowrap">
            {votingPowerPct}%
          </span>
        </div>

        {/* Bar */}
        <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${barPercent}%`,
              background:
                rank <= 3
                  ? 'linear-gradient(90deg, #06b6d4, #3b82f6)'
                  : 'linear-gradient(90deg, rgba(6,182,212,0.5), rgba(59,130,246,0.3))',
            }}
          />
        </div>
      </div>

      {/* Stake + APY */}
      <div className="flex flex-col items-end flex-shrink-0">
        <span className="text-xs text-white font-semibold tabular-nums">
          {formatStakeCompact(validator.stakingPoolIotaBalance)}
        </span>
        <span className="text-[10px] text-emerald-400/80 tabular-nums">
          {formatApy(validator.apy)}
        </span>
      </div>
    </div>
  );
}

// ─── Main card ──────────────────────────────────────────────────

export function TopValidatorsCard() {
  const { validators, isLoading, isError, refetch } = useValidators();

  // Sort by voting power and take top 5
  const topValidators = [...validators]
    .sort((a, b) => Number(b.votingPower) - Number(a.votingPower))
    .slice(0, 5);

  const maxVotingPower = Number(topValidators[0]?.votingPower ?? 0);

  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 animate-fade-in flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-iota-label flex items-center gap-2">
          {/* Shield/validator icon */}
          <svg
            className="w-4 h-4 text-iota-cyan"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          Top Validators
        </h4>

        {/* Live dot */}
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[10px] text-emerald-400/70 font-medium uppercase tracking-wider">
            Live
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {/* Loading skeleton */}
        {isLoading && (
          <div className="flex flex-col">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} index={i} />
            ))}
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <svg
              className="w-8 h-8 text-red-400/60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <p className="text-xs text-red-400/80">
              Failed to load validators
            </p>
            <button
              onClick={() => refetch()}
              className="text-[10px] text-iota-cyan hover:text-white border border-iota-cyan/30
                         hover:border-iota-cyan/60 px-3 py-1 rounded-full transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Data rows */}
        {!isLoading && !isError && topValidators.length > 0 && (
          <div className="flex flex-col -mx-1">
            {topValidators.map((v, i) => (
              <ValidatorRow
                key={v.iotaAddress}
                validator={v}
                rank={i + 1}
                maxVotingPower={maxVotingPower}
                index={i}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && topValidators.length === 0 && (
          <div className="text-center text-xs text-iota-muted py-8">
            No validator data available
          </div>
        )}
      </div>

      {/* Footer — total voting power */}
      {!isLoading && !isError && topValidators.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
          <span className="text-[10px] text-iota-muted uppercase tracking-wider">
            Top 5 Combined Power
          </span>
          <span className="text-xs text-white/70 font-mono tabular-nums">
            {(
              topValidators.reduce(
                (acc, v) => acc + Number(v.votingPower),
                0,
              ) / 100
            ).toFixed(2)}
            %
          </span>
        </div>
      )}
    </div>
  );
}
