/**
 * Header — slim top navigation bar matching the IOTA Explorer.
 *
 * Layout: [Logo] [Search Bar (centered)] [Network Selector]
 */

import { useState, useEffect, useRef } from 'react';
import { IotaLogo } from '../UI/IotaLogo';
import { SearchBar } from '../UI/SearchBar';
import { Link, useLocation } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { AnimatePresence, motion } from 'framer-motion';

interface HeaderProps {
  showAnimations?: boolean;
}

export function Header({ showAnimations = true }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  
  const { settings, updateSetting } = useSettings();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    // Call once to set initial state
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close settings on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <motion.header
      id="explorer-header"
      initial={{ y: -50, opacity: 0 }}
      animate={showAnimations ? { y: 0, opacity: 1 } : { y: -50, opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        isScrolled
          ? 'bg-[#000]/80 backdrop-blur-xl border-b border-iota-border'
          : 'bg-transparent border-transparent'
      }`}
    >
      <div className="flex items-center justify-between px-4 lg:px-6 h-16 max-w-[1600px] mx-auto">
        {/* Logo */}
        <div className="shrink-0">
          <IotaLogo />
        </div>

        {/* Nav Links */}
        <nav className="hidden sm:flex items-center gap-1 ml-4">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === '/'
                ? 'text-white bg-white/[0.06]'
                : 'text-iota-muted hover:text-white'
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/charts"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === '/charts'
                ? 'text-white bg-white/[0.06]'
                : 'text-iota-muted hover:text-white'
            }`}
          >
            Charts
          </Link>
        </nav>

        {/* Search Bar (centered) */}
        <div className="hidden sm:flex flex-1 max-w-xl mx-6 lg:mx-12">
          <SearchBar />
        </div>

        {/* Right Actions */}
        <div className="shrink-0 flex items-center gap-3">
          {/* Network Selector */}
          <div
            id="network-selector"
            className="flex items-center gap-2 px-4 py-2 bg-iota-card/60 border border-iota-border rounded-lg
                       text-sm text-white"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-medium">Mainnet</span>
          </div>

          {/* Settings Menu */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="flex items-center justify-center w-10 h-10 bg-iota-card/60 border border-iota-border rounded-lg
                         text-white hover:bg-iota-hover transition-colors focus:outline-none"
              aria-label="Settings"
            >
              <svg className="w-5 h-5 text-iota-muted hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            <AnimatePresence>
              {isSettingsOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 mt-2 w-64 bg-[#111116] border border-iota-border rounded-lg shadow-xl overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-iota-border/50">
                    <h3 className="text-sm font-medium text-white">Settings</h3>
                  </div>
                  <div className="p-2">
                    <label className="flex items-center justify-between px-2 py-2.5 hover:bg-iota-hover rounded-md cursor-pointer transition-colors group">
                      <span className="text-sm text-iota-muted group-hover:text-white transition-colors">Globe Animations</span>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings.enableGlobeAnimations}
                          onChange={(e) => updateSetting('enableGlobeAnimations', e.target.checked)}
                        />
                        <div className="w-9 h-5 bg-iota-card border border-iota-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-iota-muted peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-iota-blue"></div>
                      </div>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
