import React, { useState, useEffect } from 'react';
import { ThemeMode, NavTab, FavoriteItem, BusStopDetail } from './types';
import { SimpleHeader } from './components/SimpleHeader';
import { InteractiveMapRoutePlanner } from './components/InteractiveMapRoutePlanner';
import { BusArrivalsView } from './components/BusArrivalsView';
import { WeatherView } from './components/WeatherView';
import { FavoritesView } from './components/FavoritesView';
import { NearbyStopsView } from './components/NearbyStopsView';
import { CarparksView } from './components/CarparksView';
import { MrtStatusView } from './components/MrtStatusView';
import { CommunityDiscussionsView } from './components/CommunityDiscussionsView';
import { ltaApi } from './services/ltaApi';

const FAVORITES_STORAGE_KEY = 'sg_bus_favorites_v1';
const THEME_STORAGE_KEY = 'sg_bus_theme_v1';

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'light' ? 'light' : 'dark';
  });

  const [currentTab, setCurrentTab] = useState<NavTab>('planner');
  const [activeStopCode, setActiveStopCode] = useState<string>('83139');
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);

  // Favorites state persisted to localStorage
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return [
      {
        id: '83139',
        type: 'stop',
        busStopCode: '83139',
        busStopName: 'Opp Parkway Parade',
        roadName: 'Marine Parade Rd',
        addedAt: Date.now()
      },
      {
        id: '03011',
        type: 'stop',
        busStopCode: '03011',
        busStopName: 'Marina Bay Financial Ctr',
        roadName: 'Marina Blvd',
        addedAt: Date.now()
      }
    ];
  });

  // Save theme to localStorage and update HTML class
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Save favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // ignore
    }
  }, [favorites]);

  // Check backend LTA status
  useEffect(() => {
    ltaApi.getStatus().then((status) => {
      setIsBackendConnected(status.configured);
    });
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleToggleFavoriteStop = (stop: BusStopDetail) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.type === 'stop' && f.busStopCode === stop.code);
      if (exists) {
        return prev.filter((f) => !(f.type === 'stop' && f.busStopCode === stop.code));
      } else {
        const newItem: FavoriteItem = {
          id: stop.code,
          type: 'stop',
          busStopCode: stop.code,
          busStopName: stop.name,
          roadName: stop.roadName,
          addedAt: Date.now()
        };
        return [newItem, ...prev];
      }
    });
  };

  const handleToggleFavoriteService = (stop: BusStopDetail, serviceNo: string) => {
    const id = `${stop.code}-${serviceNo}`;
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === id);
      if (exists) {
        return prev.filter((f) => f.id !== id);
      } else {
        const newItem: FavoriteItem = {
          id,
          type: 'service',
          busStopCode: stop.code,
          busStopName: stop.name,
          roadName: stop.roadName,
          serviceNo,
          addedAt: Date.now()
        };
        return [newItem, ...prev];
      }
    });
  };

  const handleRemoveFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSelectStopCode = (code: string) => {
    setActiveStopCode(code);
    setCurrentTab('buses');
  };

  return (
    <div
      id="sg-transit-app"
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
        theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Universal Top Navigation Header */}
      <SimpleHeader
        theme={theme}
        onToggleTheme={toggleTheme}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        favoritesCount={favorites.length}
        isBackendConnected={isBackendConnected}
      />

      {/* Main View Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {currentTab === 'planner' && (
          <InteractiveMapRoutePlanner
            onSelectBusStop={handleSelectStopCode}
          />
        )}

        {currentTab === 'buses' && (
          <BusArrivalsView
            theme={theme}
            initialStopCode={activeStopCode}
            onSelectStopCode={setActiveStopCode}
            favorites={favorites}
            onToggleFavoriteStop={handleToggleFavoriteStop}
            onToggleFavoriteService={handleToggleFavoriteService}
          />
        )}

        {currentTab === 'weather' && (
          <WeatherView />
        )}

        {currentTab === 'community' && (
          <CommunityDiscussionsView />
        )}

        {currentTab === 'favorites' && (
          <FavoritesView
            theme={theme}
            favorites={favorites}
            onSelectStopCode={handleSelectStopCode}
            onRemoveFavorite={handleRemoveFavorite}
            onGoToSearch={() => setCurrentTab('buses')}
          />
        )}

        {currentTab === 'nearby' && (
          <NearbyStopsView
            theme={theme}
            onSelectStopCode={handleSelectStopCode}
          />
        )}

        {currentTab === 'carparks' && (
          <CarparksView
            theme={theme}
          />
        )}

        {currentTab === 'trains' && (
          <MrtStatusView
            theme={theme}
          />
        )}
      </main>

      {/* Modern Commuter Footer */}
      <footer
        className={`w-full border-t py-5 text-center text-xs transition-colors mt-auto ${
          theme === 'dark'
            ? 'border-slate-900 bg-slate-950 text-slate-500'
            : 'border-slate-200 bg-white text-slate-400'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <span>SG Transit Hub</span>
            <span>•</span>
            <span>Google Maps-style directions & weather radar</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Singapore OneMap (SLA)</span>
            <span>•</span>
            <span>LTA DataMall & NEA Telemetry</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
