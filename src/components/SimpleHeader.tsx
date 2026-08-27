import React from 'react';
import { ThemeMode, NavTab } from '../types';

interface SimpleHeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  favoritesCount: number;
  isBackendConnected: boolean;
}

export const SimpleHeader: React.FC<SimpleHeaderProps> = ({
  theme,
  onToggleTheme,
  currentTab,
  onTabChange,
  favoritesCount,
  isBackendConnected
}) => {
  const isDark = theme === 'dark';

  const navItems: { id: NavTab; label: string; icon: string; badge?: number | string }[] = [
    { id: 'planner', label: 'Map & Routes', icon: 'map' },
    { id: 'buses', label: 'Bus Arrivals', icon: 'directions_bus' },
    { id: 'weather', label: 'Weather Radar', icon: 'cloud' },
    { id: 'community', label: 'Discussions', icon: 'forum' },
    { id: 'favorites', label: 'Saved', icon: 'star', badge: favoritesCount > 0 ? favoritesCount : undefined },
    { id: 'nearby', label: 'Bus Stops', icon: 'location_on' },
    { id: 'carparks', label: 'Carparks', icon: 'local_parking' },
    { id: 'trains', label: 'MRT Status', icon: 'train' }
  ];

  return (
    <header
      id="app-main-header"
      className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors ${
        isDark
          ? 'bg-slate-950/90 border-slate-800 text-slate-100'
          : 'bg-white/95 border-slate-200 text-slate-900 shadow-xs'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* App Brand */}
          <div
            onClick={() => onTabChange('planner')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[22px]">explore</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight">SG TRANSIT</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  MAP & LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Singapore OneMap • LTA Live • Weather
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[17px]">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls: LTA Status + Theme Toggle */}
          <div className="flex items-center gap-2">
            <div
              title={isBackendConnected ? 'Connected to LTA & OneMap APIs' : 'Live Sync active'}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Sync</span>
            </div>

            <button
              onClick={onToggleTheme}
              aria-label="Toggle dark mode"
              className={`p-2 rounded-xl border transition-colors ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Navigation Tabs */}
        <div className="flex lg:hidden items-center justify-start py-2 border-t border-slate-200 dark:border-slate-800 overflow-x-auto gap-1 no-scrollbar">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`text-[9px] px-1 rounded-full ${
                      isActive ? 'bg-white text-blue-800 font-bold' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
