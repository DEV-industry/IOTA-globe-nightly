import { useValidators } from '../../hooks/useValidators';
import { useRecentTransactions } from '../../hooks/useRecentTransactions';
import { useMemo } from 'react';

interface EconomicStatCardProps {
  label: string;
  value: string;
  unit?: string;
  badge?: string;
  isLoading?: boolean;
  isRefetching?: boolean;
}

function DecorativeSparkline({ isRefetching }: { isRefetching?: boolean }) {
  // A set of 12 bars with varying initial heights
  const heights = [30, 60, 45, 80, 40, 70, 50, 90, 35, 65, 50, 75];

  return (
    <div className="flex items-end gap-[3px] h-6 opacity-80 mb-0.5 shrink-0">
      {heights.map((h, i) => (
        <div
          key={i}
          className={`w-1 rounded-t-sm transition-colors duration-500 ${
            isRefetching ? 'bg-iota-blue animate-sparkline-fast' : 'bg-iota-blue/40 animate-sparkline'
          }`}
          style={{ 
            height: `${h}%`,
            animationDelay: `-${i * 150}ms` // Negative delay so they start moving immediately out of sync
          }}
        />
      ))}
    </div>
  );
}

function EconomicStatCard({ label, value, unit, badge = 'current', isLoading, isRefetching }: EconomicStatCardProps) {
  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between min-h-[82px] hover:bg-white/[0.02] transition-all group">
      <div className="flex items-center justify-between w-full gap-2">
        <span className="text-sm font-medium text-iota-label group-hover:text-white transition-colors truncate">{label}</span>
        <div className="bg-white/[0.03] px-2.5 py-1.5 rounded-full border border-white/5 flex items-center justify-center h-fit shrink-0">
          <span className="text-[10px] text-iota-muted uppercase tracking-widest font-bold leading-none">{badge}</span>
        </div>
      </div>

      <div className="flex justify-between items-end mt-2 overflow-hidden gap-2">
        {/* Left side: Sparkline graph */}
        <DecorativeSparkline isRefetching={isRefetching} />
        
        {/* Right side: Value */}
        <div className="flex items-baseline gap-1.5 whitespace-nowrap overflow-hidden">
          {isLoading ? (
            <div className="h-8 w-24 bg-white/5 animate-pulse rounded" />
          ) : (
            <>
              <span className="text-xl lg:text-2xl font-bold text-white tabular-nums tracking-tight truncate">
                {value}
              </span>
              {unit && (
                <span className="text-[10px] lg:text-xs font-semibold text-iota-muted uppercase tracking-wider shrink-0">
                  {unit}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function RefGasCard() {
  const { referenceGasPrice, isLoading, isRefetching } = useValidators();
  return (
    <EconomicStatCard
      label="Ref. Gas Price"
      value={`${referenceGasPrice || '0'}`}
      unit="nanos"
      isLoading={isLoading}
      isRefetching={isRefetching}
    />
  );
}

export function AvgTxnCard() {
  const { transactions, isLoading, isRefetching } = useRecentTransactions();
  const avgGasCost = useMemo(() => {
    if (!transactions || transactions.length === 0) return null;
    const validTxs = transactions.filter(tx => tx.kind === 'ProgrammableTransaction');
    if (validTxs.length === 0) return null;
    const total = validTxs.reduce((acc, tx) => acc + (Number(tx.gasUsed.computationCost) + Number(tx.gasUsed.storageCost) - Number(tx.gasUsed.storageRebate)), 0);
    const avgNanos = total / validTxs.length;
    const avgIota = avgNanos / 1_000_000_000;
    if (avgIota >= 1) return { value: avgIota.toFixed(2), unit: 'IOTA' };
    if (avgIota >= 0.001) return { value: (avgIota * 1000).toFixed(2), unit: 'mIOTA' };
    return { value: avgNanos.toFixed(0), unit: 'nanos' };
  }, [transactions]);

  return (
    <EconomicStatCard
      label="Avg. Txn Cost"
      value={avgGasCost ? avgGasCost.value : '—'}
      unit={avgGasCost ? avgGasCost.unit : ''}
      isLoading={isLoading}
      isRefetching={isRefetching}
      badge="live"
    />
  );
}

export function StorageFundCard() {
  const { storageFundTotalObjectStorageRebates, storageFundNonRefundableBalance, isLoading, isRefetching } = useValidators();
  const storageFund = useMemo(() => {
    if (!storageFundTotalObjectStorageRebates) return { value: '0', unit: 'IOTA' };
    const rebates = BigInt(storageFundTotalObjectStorageRebates);
    const nonRefundable = storageFundNonRefundableBalance ? BigInt(storageFundNonRefundableBalance) : BigInt(0);
    const total = rebates + nonRefundable;
    const iota = Number(total) / 1_000_000_000;
    if (iota >= 1_000_000_000) return { value: (iota / 1_000_000_000).toFixed(2), unit: 'B IOTA' };
    if (iota >= 1_000_000) return { value: (iota / 1_000_000).toFixed(2), unit: 'M IOTA' };
    if (iota >= 1_000) return { value: (iota / 1_000).toFixed(1), unit: 'K IOTA' };
    return { value: iota.toFixed(2), unit: 'IOTA' };
  }, [storageFundTotalObjectStorageRebates, storageFundNonRefundableBalance]);

  return (
    <EconomicStatCard
      label="Storage Fund"
      value={storageFund.value}
      unit={storageFund.unit}
      isLoading={isLoading}
      isRefetching={isRefetching}
    />
  );
}

export function TotalStakedCard() {
  const { totalStake, isLoading, isRefetching } = useValidators();
  const staked = useMemo(() => {
    if (!totalStake) return { value: '0', unit: 'IOTA' };
    const iota = Number(totalStake) / 1_000_000_000;
    if (iota >= 1_000_000_000) return { value: (iota / 1_000_000_000).toFixed(2), unit: 'B IOTA' };
    if (iota >= 1_000_000) return { value: (iota / 1_000_000).toFixed(2), unit: 'M IOTA' };
    if (iota >= 1_000) return { value: (iota / 1_000).toFixed(1), unit: 'K IOTA' };
    return { value: iota.toFixed(2), unit: 'IOTA' };
  }, [totalStake]);

  return (
    <EconomicStatCard
      label="Total Staked"
      value={staked.value}
      unit={staked.unit}
      isLoading={isLoading}
      isRefetching={isRefetching}
    />
  );
}

export function NetworkApyCard() {
  const { validators, isLoading, isRefetching } = useValidators();
  const avgApy = useMemo(() => {
    if (!validators || validators.length === 0) return null;
    const validApys = validators.filter(v => v.apy > 0);
    if (validApys.length === 0) return null;
    const sum = validApys.reduce((acc, v) => acc + v.apy, 0);
    return (sum / validApys.length) * 100; // convert to percentage
  }, [validators]);

  return (
    <EconomicStatCard
      label="Avg. Staking APY"
      value={avgApy !== null ? avgApy.toFixed(2) : '—'}
      unit={avgApy !== null ? '%' : ''}
      isLoading={isLoading}
      isRefetching={isRefetching}
    />
  );
}
