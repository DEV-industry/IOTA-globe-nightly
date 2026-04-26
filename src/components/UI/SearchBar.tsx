/**
 * SearchBar — advanced search component with debounced input,
 * animated dropdown suggestions, type badges, and click-outside dismiss.
 *
 * Designed for the IOTA Explorer Header with a dark glassmorphic aesthetic.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import type { ValidatorsResponse } from '../../types';

/* ─── Types ───────────────────────────────────────────────── */

/** Allowed entity types returned by the search. */
type SuggestionType = 'Address' | 'Transaction' | 'Block' | 'Epoch' | 'Validator';

/** A single search suggestion item. */
export interface SearchSuggestion {
  id: string;
  type: SuggestionType;
  label: string;
  /** Raw identifier used for navigation (address, hash, epoch number, etc.). */
  value: string;
  /** Optional image URL — used for Validator avatars. */
  imageUrl?: string;
}

/* ─── Badge colour map ────────────────────────────────────── */

const BADGE_STYLES: Record<
  SuggestionType,
  { bg: string; text: string; border: string }
> = {
  Address: {
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-400',
    border: 'border-cyan-500/25',
  },
  Transaction: {
    bg: 'bg-violet-500/15',
    text: 'text-violet-400',
    border: 'border-violet-500/25',
  },
  Block: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/25',
  },
  Epoch: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/25',
  },
  Validator: {
    bg: 'bg-sky-500/15',
    text: 'text-sky-400',
    border: 'border-sky-500/25',
  },
};

/** Short label displayed inside the badge. */
const BADGE_LABELS: Record<SuggestionType, string> = {
  Address: 'Addr',
  Transaction: 'Tx',
  Block: 'Block',
  Epoch: 'Epoch',
  Validator: 'Val',
};

/** Base URL for the official IOTA Explorer. */
const EXPLORER_BASE = 'https://explorer.iota.org';

/** Maps a suggestion type to its explorer path segment. */
const EXPLORER_PATHS: Record<SuggestionType, string> = {
  Address: 'address',
  Transaction: 'txblock',
  Block: 'checkpoint',
  Epoch: 'epoch',
  Validator: 'address',
};

/* ─── Mock fetch ──────────────────────────────────────────── */

/**
 * Simulates an API call that resolves after a short delay.
 * Returns different result types based on the query string:
 *   • Only digits → Epoch
 *   • Starts with "0x" or length ≥ 40 → Address + Transaction
 *   • Otherwise → mixed results (no validators — those are matched separately)
 */
function mockFetchSuggestions(query: string): Promise<SearchSuggestion[]> {
  return new Promise((resolve) => {
    const delay = 300 + Math.random() * 400; // 300-700 ms
    setTimeout(() => {
      const q = query.trim().toLowerCase();

      // Pure numeric → Epoch suggestions
      if (/^\d+$/.test(q)) {
        resolve([
          { id: `epoch-${q}`, type: 'Epoch', label: `Epoch #${q}`, value: q },
          {
            id: `epoch-${Number(q) + 1}`,
            type: 'Epoch',
            label: `Epoch #${Number(q) + 1}`,
            value: String(Number(q) + 1),
          },
        ]);
        return;
      }

      // Hex-like or long string → Address / Transaction
      if (q.startsWith('0x') || q.length >= 40) {
        const short = q.length > 12 ? `${q.slice(0, 6)}…${q.slice(-4)}` : q;
        resolve([
          { id: `addr-${q}`, type: 'Address', label: short, value: q },
          { id: `tx-${q}`, type: 'Transaction', label: short, value: q },
        ]);
        return;
      }

      // Generic → mixed results
      resolve([
        {
          id: `addr-${q}`,
          type: 'Address',
          label: `0x${q.replace(/\s/g, '')}…a3f8`,
          value: `0x${q.replace(/\s/g, '')}a3f8`,
        },
        {
          id: `tx-${q}`,
          type: 'Transaction',
          label: `0x${q.replace(/\s/g, '')}…7b2c`,
          value: `0x${q.replace(/\s/g, '')}7b2c`,
        },
        {
          id: `block-${q}`,
          type: 'Block',
          label: `Block containing "${q}"`,
          value: q,
        },
        { id: `epoch-${q}`, type: 'Epoch', label: `Epoch matching "${q}"`, value: q },
      ]);
    }, delay);
  });
}

/**
 * Searches the cached validator list for names/addresses matching the query.
 * Returns up to 5 validator suggestions with their avatar imageUrl.
 */
function matchValidators(
  query: string,
  cachedData: ValidatorsResponse | undefined,
): SearchSuggestion[] {
  if (!cachedData?.validators) return [];
  const q = query.trim().toLowerCase();
  if (q.length < 3) return [];

  return cachedData.validators
    .filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.iotaAddress.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q),
    )
    .slice(0, 5)
    .map((v) => ({
      id: `validator-${v.iotaAddress}`,
      type: 'Validator' as const,
      label: v.name || v.iotaAddress.slice(0, 10) + '…',
      value: v.iotaAddress,
      imageUrl: v.imageUrl || undefined,
    }));
}

/* ─── Component ───────────────────────────────────────────── */

export function SearchBar() {
  const queryClient = useQueryClient();
  /* ── state ─────────────────────────────── */
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  /* ── refs ──────────────────────────────── */
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── click-outside ────────────────────── */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  /* ── debounced search ─────────────────── */
  const performSearch = useCallback(async (value: string) => {
    if (value.trim().length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Match real validators from the cached query data
      const cachedValidators = queryClient.getQueryData<ValidatorsResponse>(['validators']);
      const validatorHits = matchValidators(value, cachedValidators);

      // Also run the mock fetch for other entity types
      const otherResults = await mockFetchSuggestions(value);

      // Validators first, then other types
      const combined = [...validatorHits, ...otherResults];
      setSuggestions(combined);
      setIsOpen(combined.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [queryClient]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setActiveIndex(-1);

    // Cancel any pending debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    // Show spinner immediately while debouncing
    setIsLoading(true);
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 350);
  };

  /* ── keyboard navigation ──────────────── */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0,
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1,
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          const selected = suggestions[activeIndex];
          if (selected) handleSelect(selected);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  /* ── selection handler ────────────────── */
  const handleSelect = (suggestion: SearchSuggestion) => {
    const path = EXPLORER_PATHS[suggestion.type];
    const url = `${EXPLORER_BASE}/${path}/${encodeURIComponent(suggestion.value)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setQuery(suggestion.label);
    setIsOpen(false);
  };

  /* ── cleanup debounce on unmount ───────── */
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  /* ── render ────────────────────────────── */
  return (
    <div ref={containerRef} className="relative w-full" id="search-bar">
      {/* ── Input wrapper ── */}
      <div
        className={`
          relative flex items-center w-full h-10
          bg-black/40 backdrop-blur-md
          border rounded-full
          transition-all duration-300
          ${
            isOpen
              ? 'border-cyan-500/50 shadow-[0_0_15px_-3px_rgba(6,182,212,0.15)]'
              : 'border-iota-border hover:border-iota-muted/60'
          }
          focus-within:border-cyan-500/50
          focus-within:shadow-[0_0_15px_-3px_rgba(6,182,212,0.15)]
        `}
      >
        {/* Magnifying glass icon */}
        <div className="absolute left-3.5 flex items-center pointer-events-none">
          <svg
            className="w-4 h-4 text-iota-muted"
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
        </div>

        <input
          ref={inputRef}
          id="explorer-search"
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder="Search Addresses / Transactions / Blocks / Epochs"
          autoComplete="off"
          className="
            w-full h-full pl-10 pr-10
            bg-transparent
            text-sm text-white placeholder:text-iota-muted
            focus:outline-none
          "
        />

        {/* Spinner — shown while debouncing / fetching */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.15 }}
              className="absolute right-3.5 flex items-center"
            >
              <svg
                className="w-4 h-4 text-cyan-400 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Dropdown ── */}
      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="
              absolute top-[calc(100%+6px)] left-0 right-0
              bg-black/80 backdrop-blur-xl
              border border-iota-border rounded-xl
              shadow-2xl shadow-black/50
              overflow-hidden z-50
              py-1
            "
            role="listbox"
            id="search-suggestions"
          >
            {suggestions.map((item, idx) => {
              const badge = BADGE_STYLES[item.type];
              const isActive = idx === activeIndex;

              return (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.12, delay: idx * 0.03 }}
                  role="option"
                  aria-selected={isActive}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => handleSelect(item)}
                  className={`
                    flex items-center gap-3 px-4 py-2.5 cursor-pointer
                    transition-colors duration-150
                    ${
                      isActive
                        ? 'bg-white/[0.06]'
                        : 'hover:bg-white/[0.04]'
                    }
                  `}
                >
                  {/* Validator avatar */}
                  {item.type === 'Validator' && item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.label}
                      className="w-7 h-7 rounded-lg border border-white/10 object-cover shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : item.type === 'Validator' ? (
                    <div className="w-7 h-7 rounded-lg border border-white/10 bg-sky-500/10 flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  ) : null}

                  {/* Type badge */}
                  <span
                    className={`
                      inline-flex items-center justify-center
                      min-w-[52px] px-2 py-0.5
                      text-[11px] font-semibold tracking-wide
                      rounded-md border
                      ${badge.bg} ${badge.text} ${badge.border}
                    `}
                  >
                    {BADGE_LABELS[item.type]}
                  </span>

                  {/* Label */}
                  <span className={`text-sm text-iota-label truncate ${item.type === 'Validator' ? 'font-sans font-medium' : 'font-mono'}`}>
                    {item.label}
                  </span>

                  {/* Arrow icon on active */}
                  {isActive && (
                    <svg
                      className="w-3.5 h-3.5 text-iota-muted ml-auto shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  )}
                </motion.li>
              );
            })}

            {/* Footer hint */}
            <div className="px-4 py-2 border-t border-iota-border/50">
              <p className="text-[11px] text-iota-muted/70 flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-[10px] border border-iota-border/50 font-mono">
                  ↑↓
                </kbd>
                navigate
                <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-[10px] border border-iota-border/50 font-mono ml-1">
                  ↵
                </kbd>
                select
                <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-[10px] border border-iota-border/50 font-mono ml-1">
                  esc
                </kbd>
                close
              </p>
            </div>
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
