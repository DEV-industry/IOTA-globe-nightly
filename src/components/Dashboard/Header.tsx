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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  
  const { settings, updateSetting } = useSettings();

  // Close mobile search on ESC
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsMobileSearchOpen(false);
    }
    if (isMobileSearchOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isMobileSearchOpen]);

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
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
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
        {/* Left Section (Logo + Nav) */}
        <div className="flex items-center flex-1 min-w-0">
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
        </div>

        {/* Search Bar (perfectly centered) */}
        <div className="hidden sm:flex justify-center flex-[2] px-4 min-w-0">
          <div className="w-full max-w-xl">
            <SearchBar />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center justify-end gap-3 flex-1 min-w-0">
          {/* Network Selector */}
          <div
            id="network-selector"
            className="flex items-center gap-2 px-4 py-2 bg-iota-card/60 border border-iota-border rounded-lg
                       text-sm text-white shrink-0"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-medium">Mainnet</span>
          </div>

          {/* Settings Menu (desktop only) */}
          <div className="relative shrink-0 hidden sm:block" ref={settingsRef}>
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
                  className="absolute right-0 mt-2 w-64 bg-[#050609]/95 backdrop-blur-xl border border-iota-border rounded-lg shadow-xl overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-iota-border/50">
                    <h3 className="text-sm font-medium text-white">Settings</h3>
                  </div>
                  <div className="p-2 flex flex-col gap-1">
                    <label className="flex items-center justify-between px-2 py-2.5 hover:bg-iota-hover rounded-md cursor-pointer transition-colors group">
                      <span className="text-sm text-iota-muted group-hover:text-white transition-colors">Globe Animations</span>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings.enableGlobeAnimations}
                          onChange={(e) => updateSetting('enableGlobeAnimations', e.target.checked)}
                        />
                        <div className="w-9 h-5 bg-black/40 border border-iota-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-iota-muted peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-iota-blue"></div>
                      </div>
                    </label>

                    <label className="flex items-center justify-between px-2 py-2.5 hover:bg-iota-hover rounded-md cursor-pointer transition-colors group">
                      <span className="text-sm text-iota-muted group-hover:text-white transition-colors">Auto-Rotate Globe</span>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings.autoRotateGlobe}
                          onChange={(e) => updateSetting('autoRotateGlobe', e.target.checked)}
                        />
                        <div className="w-9 h-5 bg-black/40 border border-iota-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-iota-muted peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-iota-blue"></div>
                      </div>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Search Button */}
          <button
            onClick={() => setIsMobileSearchOpen(true)}
            className="flex sm:hidden items-center justify-center w-10 h-10
                       text-white transition-colors focus:outline-none shrink-0"
            aria-label="Search"
          >
            <svg className="w-5 h-5 text-iota-muted hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Mobile Menu Button */}
          <div className="relative sm:hidden shrink-0" ref={mobileMenuRef}>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center justify-center w-10 h-10
                         text-white transition-colors focus:outline-none"
              aria-label="Menu"
            >
              <svg className="w-6 h-6 text-iota-muted hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            <AnimatePresence>
              {isMobileMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 mt-2 w-64 bg-[#050609]/95 backdrop-blur-xl border border-iota-border rounded-lg shadow-xl overflow-hidden z-50 flex flex-col"
                >

                  {/* Navigation */}
                  <nav className="flex flex-col p-2 gap-1 border-b border-iota-border/50">
                    <Link
                      to="/"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                        location.pathname === '/'
                          ? 'text-white bg-white/[0.06]'
                          : 'text-iota-muted hover:text-white hover:bg-iota-hover'
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/charts"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                        location.pathname === '/charts'
                          ? 'text-white bg-white/[0.06]'
                          : 'text-iota-muted hover:text-white hover:bg-iota-hover'
                      }`}
                    >
                      Charts
                    </Link>
                  </nav>

                  {/* Settings */}
                  <div className="p-2 flex flex-col gap-1">
                    <div className="px-3 pt-1 pb-0.5">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-iota-muted">Settings</span>
                    </div>
                    <label className="flex items-center justify-between px-3 py-2.5 hover:bg-iota-hover rounded-md cursor-pointer transition-colors group">
                      <span className="text-sm text-iota-muted group-hover:text-white transition-colors">Globe Animations</span>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings.enableGlobeAnimations}
                          onChange={(e) => updateSetting('enableGlobeAnimations', e.target.checked)}
                        />
                        <div className="w-9 h-5 bg-black/40 border border-iota-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-iota-muted peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-iota-blue"></div>
                      </div>
                    </label>
                    <label className="flex items-center justify-between px-3 py-2.5 hover:bg-iota-hover rounded-md cursor-pointer transition-colors group">
                      <span className="text-sm text-iota-muted group-hover:text-white transition-colors">Auto-Rotate Globe</span>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings.autoRotateGlobe}
                          onChange={(e) => updateSetting('autoRotateGlobe', e.target.checked)}
                        />
                        <div className="w-9 h-5 bg-black/40 border border-iota-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-iota-muted peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-iota-blue"></div>
                      </div>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Mobile Search Modal ── */}
      <AnimatePresence>
        {isMobileSearchOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
              onClick={() => setIsMobileSearchOpen(false)}
            />
            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.96 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed top-20 left-4 right-4 z-[70] max-w-lg mx-auto"
              ref={mobileSearchRef}
            >
              <div className="bg-[#0a0b10]/95 backdrop-blur-xl border border-iota-border/60 rounded-2xl shadow-2xl shadow-black/60">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-iota-border/40">
                  <svg className="w-5 h-5 text-iota-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <div className="flex-1">
                    <SearchBar />
                  </div>
                  <button
                    onClick={() => setIsMobileSearchOpen(false)}
                    className="text-[11px] text-iota-muted bg-white/5 border border-iota-border/50 rounded px-2 py-1 font-mono hover:text-white transition-colors shrink-0"
                  >
                    ESC
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
