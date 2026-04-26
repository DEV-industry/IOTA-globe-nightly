import { useValidators } from '../../hooks/useValidators';
import { useRecentTransactions } from '../../hooks/useRecentTransactions';
import { useMemo } from 'react';

interface EconomicStatCardProps {
  label: string;
  value: string;
  unit?: string;
  badge?: string;
  isLoading?: boolean;
}

function EconomicStatCard({ label, value, unit, badge = 'current', isLoading }: EconomicStatCardProps) {
  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between min-h-[82px] hover:bg-white/[0.02] transition-all group">
      <div className="flex items-center justify-between w-full">
        <span className="text-sm font-medium text-iota-label group-hover:text-white transition-colors">{label}</span>
        <div className="bg-white/[0.03] px-3 py-2 rounded-full border border-white/5 flex items-center justify-center h-fit">
          <span className="text-[10px] text-iota-muted uppercase tracking-widest font-bold leading-none">{badge}</span>
        </div>
      </div>

      <div className="flex justify-end items-baseline gap-2 mt-2">
        {isLoading ? (
          <div className="h-8 w-24 bg-white/5 animate-pulse rounded" />
        ) : (
          <>
            <span className="text-3xl font-bold text-white tabular-nums tracking-tight">
              {value}
            </span>
            {unit && (
              <span className="text-sm font-semibold text-iota-muted uppercase tracking-wider">
                {unit}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function RefGasCard() {
  const { referenceGasPrice, isLoading } = useValidators();
  return (
    <EconomicStatCard
      label="Ref. Gas Price"
      value={`${referenceGasPrice || '0'}`}
      unit="nanos"
      isLoading={isLoading}
    />
  );
}

export function AvgTxnCard() {
  const { transactions, isLoading } = useRecentTransactions();
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
      badge="live"
    />
  );
}

export function StorageFundCard() {
  const { storageFundTotalObjectStorageRebates, storageFundNonRefundableBalance, isLoading } = useValidators();
  const storageFund = useMemo(() => {
    if (!storageFundTotalObjectStorageRebates) return { value: '0', unit: 'IOTA' };
    const rebates = BigInt(storageFundTotalObjectStorageRebates);
    const nonRefundable = storageFundNonRefundableBalance ? BigInt(storageFundNonRefundableBalance) : BigInt(0);
    const total = rebates + nonRefundable;
    const iota = Number(total) / 1_000_000_000;
    if (iota >= 1_000_000_000) return { value: (iota / 1_000_000_000).toFixed(2), unit: 'B IOTA' };
    if (iota >= 1_000_000) return { value: (iota / 1_000_000).toFixed(2), unit: 'M IOTA' };
    return { value: iota.toFixed(2), unit: 'IOTA' };
  }, [storageFundTotalObjectStorageRebates, storageFundNonRefundableBalance]);

  return (
    <EconomicStatCard
      label="Storage Fund"
      value={storageFund.value}
      unit={storageFund.unit}
      isLoading={isLoading}
    />
  );
}
