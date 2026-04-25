/**
 * Header — slim top navigation bar matching the IOTA Explorer.
 *
 * Layout: [Logo] [Search Bar (centered)] [Network Selector]
 */

import { useState } from 'react';
import { IotaLogo } from '../UI/IotaLogo';

export function Header() {
  const [searchValue, setSearchValue] = useState('');

  return (
    <header
      id="explorer-header"
      className="fixed top-0 left-0 right-0 z-50 bg-iota-bg/80 backdrop-blur-xl border-b border-iota-border"
    >
      <div className="flex items-center justify-between px-4 lg:px-6 h-16 max-w-[1600px] mx-auto">
        {/* Logo */}
        <div className="shrink-0">
          <IotaLogo />
        </div>

        {/* Search Bar (centered) */}
        <div className="hidden sm:flex flex-1 max-w-xl mx-6 lg:mx-12">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
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
              id="explorer-search"
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search for Addresses / Objects / Transactions"
              className="w-full h-10 pl-10 pr-4 bg-iota-card/60 border border-iota-border rounded-lg
                         text-sm text-white placeholder:text-iota-muted
                         focus:outline-none focus:border-iota-blue/50 focus:ring-1 focus:ring-iota-blue/20
                         transition-colors"
            />
          </div>
        </div>

        {/* Network Selector */}
        <div className="shrink-0">
          <button
            id="network-selector"
            className="flex items-center gap-2 px-4 py-2 bg-iota-card/60 border border-iota-border rounded-lg
                       text-sm text-white hover:bg-iota-hover transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Mainnet</span>
            <svg
              className="w-3.5 h-3.5 text-iota-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
