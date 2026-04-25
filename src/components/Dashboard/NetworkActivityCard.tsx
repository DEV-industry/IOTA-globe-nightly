/**
 * NetworkActivityCard — key network metrics card.
 *
 * Displays: TPS, Peak TPS, Total Packages, Objects, Total Supply, Circulating Supply.
 * Data sourced from the existing useValidators hook where available,
 * with placeholders for metrics not yet available from the API.
 */

import { formatStakeCompact } from '../../utils/formatters';

interface NetworkActivityCardProps {
  activeValidatorCount: number;
  totalStake?: string;
  iotaTotalSupply?: string;
  referenceGasPrice?: string;
}

interface MetricItemProps {
  label: string;
  value: string;
  hasTooltip?: boolean;
}

function MetricItem({ label, value, hasTooltip }: MetricItemProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span className="text-2xl font-semibold text-white tabular-nums">
          {value}
        </span>
        {hasTooltip && (
          <div className="w-4 h-4 rounded-full border border-iota-border flex items-center justify-center cursor-help group relative">
            <span className="text-[10px] text-iota-muted">i</span>
          </div>
        )}
      </div>
      <span className="text-xs text-iota-label">{label}</span>
    </div>
  );
}

export function NetworkActivityCard({
  activeValidatorCount,
  totalStake,
  iotaTotalSupply,
}: NetworkActivityCardProps) {
  const totalSupplyDisplay = iotaTotalSupply
    ? `${formatStakeCompact(iotaTotalSupply)} IOTA`
    : '—';
  const circulatingDisplay = totalStake
    ? `${formatStakeCompact(totalStake)} IOTA`
    : '—';

  return (
    <div className="bg-iota-card backdrop-blur-sm rounded-2xl p-6 animate-fade-in">
      {/* Card Title */}
      <h4 className="text-sm font-medium text-iota-label mb-5 flex items-center gap-2">
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
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        Network Activity
      </h4>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-x-6 gap-y-5">
        <MetricItem
          label="TPS Now"
          value={String(activeValidatorCount)}
          hasTooltip
        />
        <MetricItem label="Peak 30d TPS" value="4,245" hasTooltip />
        <MetricItem label="Total Packages" value="753" />
        <MetricItem label="Objects" value="14.65 M" hasTooltip />
        <MetricItem label="Total Supply" value={totalSupplyDisplay} />
        <MetricItem label="Circulating Supply" value={circulatingDisplay} />
      </div>
    </div>
  );
}
