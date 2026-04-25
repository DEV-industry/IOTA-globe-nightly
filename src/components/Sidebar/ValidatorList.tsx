/**
 * ValidatorList — scrollable list of validators with search & sort.
 */

import { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ValidatorCard } from './ValidatorCard';
import { Spinner } from '../UI/Spinner';
import type { Validator } from '../../types';

type SortKey = 'stake' | 'name' | 'apy';

interface ValidatorListProps {
  validators: Validator[];
  isLoading: boolean;
  selectedAddress: string | null;
  onSelectValidator: (validator: Validator) => void;
}

export function ValidatorList({
  validators,
  isLoading,
  selectedAddress,
  onSelectValidator,
}: ValidatorListProps) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('stake');

  // Filter + sort
  const filtered = useMemo(() => {
    let result = validators;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.iotaAddress.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q),
      );
    }

    // Sort
    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'stake':
          return (
            Number(b.stakingPoolIotaBalance) -
            Number(a.stakingPoolIotaBalance)
          );
        case 'name':
          return a.name.localeCompare(b.name);
        case 'apy':
          return b.apy - a.apy;
        default:
          return 0;
      }
    });
  }, [validators, search, sortBy]);

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="p-3 space-y-2">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-iota-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            id="validator-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search validators..."
            className="w-full pl-10 pr-3 py-2 bg-iota-dark/60 border border-iota-border rounded-lg
                       text-sm text-white placeholder-iota-muted
                       focus:outline-none focus:border-iota-blue/50 focus:ring-1 focus:ring-iota-blue/20
                       transition-colors"
          />
        </div>

        {/* Sort tabs */}
        <div className="flex gap-1 bg-iota-dark/40 rounded-lg p-0.5">
          {(['stake', 'name', 'apy'] as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`flex-1 px-2 py-1 text-xs font-medium rounded-md transition-all
                ${
                  sortBy === key
                    ? 'bg-iota-blue/20 text-iota-blue'
                    : 'text-iota-muted hover:text-white'
                }`}
            >
              {key === 'stake' ? 'Stake' : key === 'name' ? 'Name' : 'APY'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5 scrollbar-thin">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 pt-12">
            <Spinner />
            <p className="text-sm text-iota-muted">Loading validators...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center pt-12">
            <p className="text-sm text-iota-muted">
              {search ? 'No validators found' : 'No validators available'}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((v) => (
              <ValidatorCard
                key={v.iotaAddress}
                validator={v}
                allValidators={validators}
                isSelected={v.iotaAddress === selectedAddress}
                onClick={() => onSelectValidator(v)}
              />
            ))}
          </AnimatePresence>
        )}

        {/* Result count */}
        {!isLoading && filtered.length > 0 && (
          <p className="text-xs text-iota-muted text-center pt-2 pb-1">
            {filtered.length} of {validators.length} validators
          </p>
        )}
      </div>
    </div>
  );
}
