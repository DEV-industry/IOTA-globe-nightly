/**
 * DataTable — tabbed data table with real Transactions, Epochs & Checkpoints.
 *
 * - Transactions tab: real tx data from recent checkpoints
 * - Checkpoints tab: real checkpoint data from useCheckpoints
 * - Epochs tab: epoch info derived from validators system state
 *
 * All tabs feature loading skeletons, error states and the
 * "Show System Transactions" toggle for the Transactions tab.
 */

import { useState } from 'react';
import { useRecentTransactions } from '../../hooks/useRecentTransactions';
import type { TransactionDetail } from '../../hooks/useRecentTransactions';
import { useCheckpoints } from '../../hooks/useCheckpoints';
import { useValidators } from '../../hooks/useValidators';
import { truncateAddress, formatStakeCompact } from '../../utils/formatters';
import type { DataTableTab, Checkpoint } from '../../types';

// ─── Helpers ────────────────────────────────────────────────────

const NANOS_PER_IOTA = 1_000_000_000;

function formatGas(gasUsed: TransactionDetail['gasUsed']): string {
  const total =
    Number(gasUsed.computationCost) +
    Number(gasUsed.storageCost) -
    Number(gasUsed.storageRebate);
  if (total <= 0) return '0';
  const iota = total / NANOS_PER_IOTA;
  if (iota >= 1) return `${iota.toFixed(4)} IOTA`;
  if (iota >= 0.001) return `${(iota * 1000).toFixed(2)} mIOTA`;
  return `${total.toLocaleString()} nanos`;
}

function timeAgo(timestampMs: string): string {
  const diff = Date.now() - Number(timestampMs);
  const seconds = Math.max(0, Math.floor(diff / 1000));
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function formatKind(kind: string): string {
  const map: Record<string, string> = {
    ProgrammableTransaction: 'Programmable',
    ConsensusCommitPrologueV1: 'Consensus Commit',
    RandomnessStateUpdate: 'Randomness Update',
    AuthenticatorStateUpdateV1: 'Authenticator Update',
    EndOfEpochTransaction: 'End of Epoch',
  };
  return map[kind] ?? kind;
}

const SYSTEM_SENDER = '0x0000000000000000000000000000000000000000000000000000000000000000';

// ─── Skeleton row ───────────────────────────────────────────────

function SkeletonRows({ count = 8 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr
          key={i}
          className="border-b border-iota-border/30 animate-pulse"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <td className="px-6 py-3">
            <div className="w-28 h-4 rounded bg-white/5" />
          </td>
          <td className="px-4 py-3">
            <div className="w-20 h-4 rounded bg-white/5" />
          </td>
          <td className="px-4 py-3">
            <div className="w-16 h-4 rounded bg-white/5 mx-auto" />
          </td>
          <td className="px-4 py-3">
            <div className="w-20 h-4 rounded bg-white/5 ml-auto" />
          </td>
          <td className="px-6 py-3">
            <div className="w-12 h-4 rounded bg-white/5 ml-auto" />
          </td>
        </tr>
      ))}
    </>
  );
}

// ─── Error row ──────────────────────────────────────────────────

function ErrorRow({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <tr>
      <td colSpan={5} className="px-6 py-10 text-center">
        <div className="flex flex-col items-center gap-3">
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
          <p className="text-xs text-red-400/80">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-[10px] text-iota-cyan hover:text-white border border-iota-cyan/30
                         hover:border-iota-cyan/60 px-3 py-1 rounded-full transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Transactions Tab ───────────────────────────────────────────

function TransactionsTable({
  showSystemTx,
}: {
  showSystemTx: boolean;
}) {
  const { transactions, isLoading, isError, refetch } =
    useRecentTransactions();

  const filtered = showSystemTx
    ? transactions
    : transactions.filter((tx) => tx.sender !== SYSTEM_SENDER);

  return (
    <table className="w-full min-w-[640px]">
      <thead className="sticky top-0 z-10 bg-[#0a0a0f]/95 backdrop-blur-xl">
        <tr className="border-b border-iota-border/50">
          <th className="text-center text-[11px] font-medium uppercase tracking-wider text-iota-muted px-6 py-3">
            Digest
          </th>
          <th className="text-center text-[11px] font-medium uppercase tracking-wider text-iota-muted px-4 py-3">
            Type
          </th>
          <th className="text-center text-[11px] font-medium uppercase tracking-wider text-iota-muted px-4 py-3">
            Sender
          </th>
          <th className="text-center text-[11px] font-medium uppercase tracking-wider text-iota-muted px-4 py-3">
            Gas
          </th>
          <th className="text-center text-[11px] font-medium uppercase tracking-wider text-iota-muted px-6 py-3">
            Time
          </th>
        </tr>
      </thead>
      <tbody>
        {isLoading && <SkeletonRows />}
        {isError && (
          <ErrorRow
            message="Failed to load transactions"
            onRetry={() => refetch()}
          />
        )}
        {!isLoading && !isError && filtered.length === 0 && (
          <tr>
            <td
              colSpan={5}
              className="text-center text-xs text-iota-muted py-10"
            >
              No transactions found
            </td>
          </tr>
        )}
        {!isLoading &&
          !isError &&
          filtered.map((tx, i) => (
            <tr
              key={`${tx.digest}-${i}`}
              className="border-b border-iota-border/30 table-row-hover cursor-pointer group"
            >
              <td className="text-center px-6 py-3">
                <span className="text-sm text-white font-mono group-hover:text-iota-cyan transition-colors">
                  {truncateAddress(tx.digest, 6)}
                </span>
              </td>
              <td className="text-center px-4 py-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${
                      tx.kind === 'ProgrammableTransaction'
                        ? 'bg-iota-cyan/10 text-iota-cyan'
                        : 'bg-white/5 text-iota-muted'
                    }`}
                >
                  {formatKind(tx.kind)}
                </span>
              </td>
              <td className="text-center px-4 py-3">
                <span className="text-sm text-iota-label font-mono">
                  {tx.sender === SYSTEM_SENDER
                    ? '⚙ System'
                    : truncateAddress(tx.sender, 4)}
                </span>
              </td>
              <td className="text-center px-4 py-3">
                <span className="text-sm text-white tabular-nums">
                  {formatGas(tx.gasUsed)}
                </span>
              </td>
              <td className="text-center px-6 py-3">
                <span className="text-sm text-iota-muted tabular-nums">
                  {timeAgo(tx.timestampMs)}
                </span>
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}

// ─── Checkpoints Tab ────────────────────────────────────────────

function CheckpointsTable() {
  const { checkpoints, isLoading, isError, refetch } = useCheckpoints();

  return (
    <table className="w-full min-w-[640px]">
      <thead className="sticky top-0 z-10 bg-[#0a0a0f]/95 backdrop-blur-xl">
        <tr className="border-b border-iota-border/50">
          <th className="text-center text-[11px] font-medium uppercase tracking-wider text-iota-muted px-6 py-3">
            Sequence
          </th>
          <th className="text-center text-[11px] font-medium uppercase tracking-wider text-iota-muted px-4 py-3">
            Digest
          </th>
          <th className="text-center text-[11px] font-medium uppercase tracking-wider text-iota-muted px-4 py-3">
            Epoch
          </th>
          <th className="text-center text-[11px] font-medium uppercase tracking-wider text-iota-muted px-4 py-3">
            Txns
          </th>
          <th className="text-center text-[11px] font-medium uppercase tracking-wider text-iota-muted px-6 py-3">
            Time
          </th>
        </tr>
      </thead>
      <tbody>
        {isLoading && <SkeletonRows />}
        {isError && (
          <ErrorRow
            message="Failed to load checkpoints"
            onRetry={() => refetch()}
          />
        )}
        {!isLoading && !isError && checkpoints.length === 0 && (
          <tr>
            <td
              colSpan={5}
              className="text-center text-xs text-iota-muted py-10"
            >
              No checkpoints found
            </td>
          </tr>
        )}
        {!isLoading &&
          !isError &&
          checkpoints.map((cp: Checkpoint) => (
            <tr
              key={cp.digest}
              className="border-b border-iota-border/30 table-row-hover cursor-pointer group"
            >
              <td className="text-center px-6 py-3">
                <span className="text-sm text-white font-mono tabular-nums group-hover:text-iota-cyan transition-colors">
                  #{cp.sequenceNumber}
                </span>
              </td>
              <td className="text-center px-4 py-3">
                <span className="text-sm text-iota-label font-mono">
                  {truncateAddress(cp.digest, 6)}
                </span>
              </td>
              <td className="text-center px-4 py-3">
                <span className="text-xs bg-white/5 text-iota-muted px-2 py-0.5 rounded-full font-medium tabular-nums">
                  {cp.epoch}
                </span>
              </td>
              <td className="text-center px-4 py-3">
                <span className="text-sm text-white tabular-nums">
                  {cp.transactions?.length ?? 0}
                </span>
              </td>
              <td className="text-center px-6 py-3">
                <span className="text-sm text-iota-muted tabular-nums">
                  {timeAgo(cp.timestampMs)}
                </span>
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}

// ─── Validators Tab ─────────────────────────────────────────────────

function ValidatorsTable() {
  const {
    data,
    isLoading,
    isError,
  } = useValidators();

  const validators = data?.validators || [];

  return (
    <table className="w-full min-w-[640px]">
      <thead className="sticky top-0 z-10 bg-[#0a0a0f]/95 backdrop-blur-xl">
        <tr className="border-b border-iota-border/50">
          <th className="text-left text-[11px] font-medium uppercase tracking-wider text-iota-muted px-6 py-3">
            Name
          </th>
          <th className="text-center text-[11px] font-medium uppercase tracking-wider text-iota-muted px-4 py-3">
            Stake
          </th>
          <th className="text-center text-[11px] font-medium uppercase tracking-wider text-iota-muted px-4 py-3">
            Voting Power
          </th>
          <th className="text-center text-[11px] font-medium uppercase tracking-wider text-iota-muted px-4 py-3">
            APY
          </th>
          <th className="text-center text-[11px] font-medium uppercase tracking-wider text-iota-muted px-6 py-3">
            Commission
          </th>
        </tr>
      </thead>
      <tbody>
        {isLoading && <SkeletonRows />}
        {isError && <ErrorRow message="Failed to load validators data" />}
        {!isLoading &&
          !isError &&
          validators.map((val) => (
            <tr
              key={val.iotaAddress}
              className="border-b border-iota-border/30 table-row-hover cursor-pointer group"
            >
              <td className="text-left px-6 py-3">
                <div className="flex items-center justify-start gap-3">
                  <img
                    src={val.imageUrl || '/default-avatar.png'}
                    alt={val.name}
                    className="w-6 h-6 rounded-full object-cover bg-iota-border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-avatar.png';
                    }}
                  />
                  <span className="text-sm text-white font-medium group-hover:text-iota-cyan transition-colors">
                    {val.name}
                  </span>
                </div>
              </td>
              <td className="text-center px-4 py-3">
                <span className="text-sm text-white tabular-nums">
                  {formatStakeCompact(val.stakingPoolIotaBalance)} IOTA
                </span>
              </td>
              <td className="text-center px-4 py-3">
                <span className="text-sm text-white tabular-nums">
                  {(Number(val.votingPower) / 100).toFixed(2)}%
                </span>
              </td>
              <td className="text-center px-4 py-3">
                <span className="text-sm text-emerald-400 tabular-nums">
                  {val.apy > 0 ? `${val.apy.toFixed(2)}%` : '--'}
                </span>
              </td>
              <td className="text-center px-6 py-3">
                <span className="text-sm text-iota-muted tabular-nums">
                  {(Number(val.commissionRate) / 100).toFixed(2)}%
                </span>
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}

// ─── Main DataTable component ───────────────────────────────────

export function DataTable() {
  const [activeTab, setActiveTab] = useState<DataTableTab>('transactions');
  const [showSystemTx, setShowSystemTx] = useState(true);

  const tabs: { key: DataTableTab; label: string }[] = [
    { key: 'transactions', label: 'Transactions' },
    { key: 'checkpoints', label: 'Checkpoints' },
    { key: 'validators', label: 'Validators' },
  ];

  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl animate-slide-up overflow-hidden">
      {/* Tab Bar */}
      <div className="flex items-center justify-between border-b border-iota-border px-6">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3.5 text-sm font-medium transition-colors relative
                ${
                  activeTab === tab.key
                    ? 'text-white'
                    : 'text-iota-label hover:text-white'
                }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* System Transactions Toggle — only on Transactions tab */}
        {activeTab === 'transactions' && (
          <div className="hidden sm:flex items-center gap-2.5">
            <span className="text-xs text-iota-muted">
              Show System Transactions
            </span>
            <button
              onClick={() => setShowSystemTx((p) => !p)}
              className={`toggle-switch ${showSystemTx ? 'active' : ''}`}
              role="switch"
              aria-checked={showSystemTx}
            />
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto overflow-y-auto max-h-[500px] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {activeTab === 'transactions' && (
          <TransactionsTable showSystemTx={showSystemTx} />
        )}
        {activeTab === 'checkpoints' && <CheckpointsTable />}
        {activeTab === 'validators' && <ValidatorsTable />}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-iota-border/50">
        <span className="text-[10px] text-iota-muted">
          {activeTab === 'transactions' && 'Auto-refreshes every 10s'}
          {activeTab === 'checkpoints' && 'Auto-refreshes every 5s'}
          {activeTab === 'validators' && 'Auto-refreshes every 30s'}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          <span className="text-[10px] text-emerald-400/70 font-medium uppercase tracking-wider">
            Live
          </span>
        </div>
      </div>
    </div>
  );
}
