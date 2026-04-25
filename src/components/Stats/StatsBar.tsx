/**
 * StatsBar — top bar showing live network stats.
 *
 * Displays: Total validators | Total staked IOTA | Current epoch | Network APY
 * Updates live with the same TanStack Query data.
 */

import { useValidators } from '../../hooks/useValidators';
import { formatStakeCompact, timeAgo } from '../../utils/formatters';

export function StatsBar() {
  const {
    validators,
    epoch,
    totalStake,
    activeValidatorCount,
    isRefetching,
    dataUpdatedAt,
  } = useValidators();

  // Calculate average APY across all validators
  const avgApy =
    validators.length > 0
      ? validators.reduce((sum, v) => sum + v.apy, 0) / validators.length
      : 0;

  return (
    <header
      id="stats-bar"
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-iota-dark/70 border-b border-iota-border"
    >
      <div className="flex items-center justify-between px-4 lg:px-6 h-14">
        {/* Logo / Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-iota-blue to-cyan-400 flex items-center justify-center">
              <span className="text-xs font-bold text-iota-dark">I</span>
            </div>
            {/* Live indicator */}
            <span
              className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-iota-dark
                ${isRefetching ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-400 animate-[pulse_2s_ease-in-out_infinite]'}`}
            />
          </div>
          <h1 className="text-base font-semibold text-white hidden sm:block">
            IOTA Globe
          </h1>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 lg:gap-8 overflow-x-auto">
          <StatItem
            label="Validators"
            value={activeValidatorCount.toString()}
          />
          <StatItem
            label="Total Staked"
            value={totalStake ? `${formatStakeCompact(totalStake)} IOTA` : '—'}
          />
          <StatItem label="Epoch" value={epoch ?? '—'} />
          <StatItem
            label="Avg APY"
            value={avgApy > 0 ? `${(avgApy * 100).toFixed(2)}%` : '—'}
          />
          <div className="hidden md:block text-xs text-iota-muted">
            {dataUpdatedAt
              ? `Updated ${timeAgo(dataUpdatedAt)}`
              : 'Loading...'}
          </div>
        </div>
      </div>
    </header>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center min-w-fit">
      <span className="text-[10px] uppercase tracking-wider text-iota-muted font-medium">
        {label}
      </span>
      <span className="text-sm font-semibold text-white tabular-nums">
        {value}
      </span>
    </div>
  );
}
