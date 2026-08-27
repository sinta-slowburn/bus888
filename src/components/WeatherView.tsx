import React, { useEffect, useState } from 'react';
import {
  CloudSun,
  CloudRain,
  Sun,
  Cloud,
  Thermometer,
  Wind,
  RefreshCw,
  Umbrella,
  ShieldCheck,
  MapPin
} from 'lucide-react';
import { WeatherSummary } from '../types';
import { weatherApi } from '../services/weatherApi';

export const WeatherView: React.FC = () => {
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState<string>('');

  const fetchWeather = async () => {
    setLoading(true);
    const data = await weatherApi.get2HourNowcast();
    setWeather(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  const filteredForecasts = (weather?.forecasts || []).filter((item) =>
    item.area.toLowerCase().includes(searchFilter.toLowerCase()) ||
    item.forecast.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">
              <CloudSun className="w-4 h-4" />
              NEA Singapore Live Telemetry
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Singapore Commuter Weather Radar
            </h1>
            <p className="text-sm text-blue-100/90 mt-1 max-w-xl">
              2-Hour Nowcast & Precipitation Forecast across Singapore planning areas. Plan ahead for sheltered walkways and umbrella needs!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center">
              <div className="text-xs text-blue-100 font-semibold">Temperature</div>
              <div className="text-xl font-black text-white">{weather?.temperatureRange || '28°C - 32°C'}</div>
            </div>
            <button
              onClick={fetchWeather}
              disabled={loading}
              className="p-3 bg-white text-blue-700 hover:bg-blue-50 rounded-2xl shadow font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Rain Advisory Banner */}
        {weather?.rainAdvisory && (
          <div className="mt-5 p-3.5 bg-black/20 backdrop-blur-md rounded-2xl border border-white/15 flex items-center gap-3 text-xs text-white">
            <Umbrella className="w-5 h-5 text-amber-300 flex-shrink-0" />
            <span className="font-medium">{weather.rainAdvisory}</span>
          </div>
        )}
      </div>

      {/* Search & Area Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search planning area (e.g. Orchard, Bedok, Jurong)..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
          <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
        <div className="text-xs text-slate-500 font-semibold">
          Showing {filteredForecasts.length} Singapore areas
        </div>
      </div>

      {/* Grid of Weather Forecast Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {filteredForecasts.map((item, idx) => {
          const isRain =
            item.forecast.toLowerCase().includes('rain') ||
            item.forecast.toLowerCase().includes('shower') ||
            item.forecast.toLowerCase().includes('thunder');

          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                isRain
                  ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 shadow-sm'
                  : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {item.area}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                    {item.forecast}
                  </p>
                </div>
                <div className={`p-2 rounded-xl ${isRain ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' : 'bg-amber-100 dark:bg-amber-950 text-amber-600'}`}>
                  {isRain ? (
                    <CloudRain className="w-5 h-5" />
                  ) : item.forecast.toLowerCase().includes('cloud') ? (
                    <Cloud className="w-5 h-5" />
                  ) : (
                    <Sun className="w-5 h-5" />
                  )}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <span className={`font-bold px-2 py-0.5 rounded-md ${
                  isRain
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                }`}>
                  {isRain ? '🌧️ Bring Umbrella' : '☀️ Sheltered / Dry'}
                </span>
                <span className="text-slate-400 font-medium">Next 2 hrs</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
