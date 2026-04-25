/**
 * DataTable — tabbed data table with transaction/epoch/checkpoint views.
 *
 * Replicates the explorer's bottom section with:
 * - Tab bar (Transactions | Epochs | Checkpoints)
 * - "Show System Transactions" toggle
 * - Professional data table with hover effects
 */

import { useState, useMemo } from 'react';
import { generatePlaceholderTxRows } from '../../utils/formatters';
import type { Validator, DataTableTab, TransactionRow } from '../../types';

interface DataTableProps {
  validators: Validator[];
}

export function DataTable({ validators }: DataTableProps) {
  const [activeTab, setActiveTab] = useState<DataTableTab>('transactions');
  const [showSystemTx, setShowSystemTx] = useState(true);

  const txRows = useMemo(
    () => generatePlaceholderTxRows(validators),
    [validators],
  );

  const tabs: { key: DataTableTab; label: string }[] = [
    { key: 'transactions', label: 'Transactions' },
    { key: 'epochs', label: 'Epochs' },
    { key: 'checkpoints', label: 'Checkpoints' },
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

        {/* System Transactions Toggle */}
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
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-iota-border/50">
              <th className="text-left text-[11px] font-medium uppercase tracking-wider text-iota-muted px-6 py-3">
                Digest
              </th>
              <th className="text-left text-[11px] font-medium uppercase tracking-wider text-iota-muted px-4 py-3">
                Sender
              </th>
              <th className="text-center text-[11px] font-medium uppercase tracking-wider text-iota-muted px-4 py-3">
                Txns
              </th>
              <th className="text-right text-[11px] font-medium uppercase tracking-wider text-iota-muted px-4 py-3">
                Gas
              </th>
              <th className="text-right text-[11px] font-medium uppercase tracking-wider text-iota-muted px-6 py-3">
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {txRows.map((row: TransactionRow, i: number) => (
              <tr
                key={`${row.digest}-${i}`}
                className="border-b border-iota-border/30 table-row-hover cursor-pointer"
              >
                <td className="px-6 py-3">
                  <span className="text-sm text-white font-mono hover:underline">
                    {row.digest}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm text-iota-label">
                      {row.sender}
                    </span>
                    <span className="text-xs text-iota-muted font-mono">
                      {row.senderAddress}
                    </span>
                  </div>
                </td>
                <td className="text-center px-4 py-3">
                  <span className="text-sm text-iota-muted">{row.txns}</span>
                </td>
                <td className="text-right px-4 py-3">
                  <span className="text-sm text-white">{row.gas}</span>
                </td>
                <td className="text-right px-6 py-3">
                  <span className="text-sm text-iota-muted">{row.time}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center py-3 border-t border-iota-border/50">
        <button className="text-xs text-white hover:text-iota-label transition-colors font-medium">
          View All →
        </button>
      </div>
    </div>
  );
}
