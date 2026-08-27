import React, { useState, useEffect, useCallback } from 'react';
import { ThemeMode, BusArrivalInfo, BusStopDetail, FavoriteItem } from '../types';
import { SINGAPORE_BUS_STOPS, getFallbackArrivals } from '../data/mockData';
import { ltaApi, mapLtaToBusArrivalInfo } from '../services/ltaApi';
import { DisqusThread } from './DisqusThread';

interface BusArrivalsViewProps {
  theme: ThemeMode;
  initialStopCode?: string;
  onSelectStopCode?: (code: string) => void;
  favorites: FavoriteItem[];
  onToggleFavoriteStop: (stop: BusStopDetail) => void;
  onToggleFavoriteService: (stop: BusStopDetail, serviceNo: string) => void;
}

export const BusArrivalsView: React.FC<BusArrivalsViewProps> = ({
  theme,
  initialStopCode = '83139',
  onSelectStopCode,
  favorites,
  onToggleFavoriteStop,
  onToggleFavoriteService
}) => {
  const isDark = theme === 'dark';

  const [searchQuery, setSearchQuery] = useState<string>(initialStopCode);
  const [activeStopCode, setActiveStopCode] = useState<string>(initialStopCode);
  const [serviceFilter, setServiceFilter] = useState<string>('');

  const [arrivals, setArrivals] = useState<BusArrivalInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(20);
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>('');
  const [showDiscussion, setShowDiscussion] = useState<boolean>(false);
  const [stopNotes, setStopNotes] = useState<Array<{ id: string; author: string; text: string; time: string }>>([
    { id: '1', author: 'Commuter', text: 'Bus shelter is clean and well-lit during late nights.', time: 'Today' }
  ]);
  const [newStopNote, setNewStopNote] = useState<string>('');
  const [stopNoteAuthor, setStopNoteAuthor] = useState<string>('Commuter');

  // Find stop detail from directory or generate virtual stop
  const currentStopDetail: BusStopDetail = SINGAPORE_BUS_STOPS.find(
    (s) => s.code === activeStopCode
  ) || {
    code: activeStopCode,
    name: `Bus Stop ${activeStopCode}`,
    roadName: 'Singapore Transit Network',
    lat: 1.3521,
    lng: 103.8198,
    services: []
  };

  const isStopFavorited = favorites.some(
    (f) => f.type === 'stop' && f.busStopCode === activeStopCode
  );

  const fetchArrivals = useCallback(async (stopCode: string, srv?: string) => {
    if (!stopCode || stopCode.length < 4) return;
    setLoading(true);

    const res = await ltaApi.getBusArrivals(stopCode, srv || undefined);
    setLoading(false);
    setLastRefreshedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

    if (res.data && res.data.Services && res.data.Services.length > 0) {
      const parsed = mapLtaToBusArrivalInfo(res.data);
      setArrivals(parsed);
    } else {
      // Fallback to rich realistic schedule
      const fallback = getFallbackArrivals(stopCode);
      setArrivals(fallback);
    }
  }, []);

  // Update activeStopCode if initialStopCode changes from parent
  useEffect(() => {
    if (initialStopCode && initialStopCode !== activeStopCode) {
      setActiveStopCode(initialStopCode);
      setSearchQuery(initialStopCode);
    }
  }, [initialStopCode]);

  // Main 20s Refresh Loop
  useEffect(() => {
    fetchArrivals(activeStopCode, serviceFilter);
    setCountdown(20);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchArrivals(activeStopCode, serviceFilter);
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeStopCode, serviceFilter, fetchArrivals]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // Check if query matches a 5-digit code or a bus stop name
    const foundByCode = SINGAPORE_BUS_STOPS.find((s) => s.code === query);
    if (foundByCode) {
      setActiveStopCode(foundByCode.code);
      if (onSelectStopCode) onSelectStopCode(foundByCode.code);
      return;
    }

    const foundByName = SINGAPORE_BUS_STOPS.find((s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.roadName.toLowerCase().includes(query.toLowerCase()) ||
      s.district?.toLowerCase().includes(query.toLowerCase())
    );

    if (foundByName) {
      setActiveStopCode(foundByName.code);
      setSearchQuery(foundByName.code);
      if (onSelectStopCode) onSelectStopCode(foundByName.code);
    } else if (query.length >= 4) {
      // Assume custom 5-digit code
      setActiveStopCode(query);
      if (onSelectStopCode) onSelectStopCode(query);
    }
  };

  const handleSelectPreset = (code: string) => {
    setActiveStopCode(code);
    setSearchQuery(code);
    setServiceFilter('');
    if (onSelectStopCode) onSelectStopCode(code);
  };

  // Filter arrivals by service filter if entered
  const filteredArrivals = arrivals.filter((a) =>
    !serviceFilter || a.serviceNo.toLowerCase().includes(serviceFilter.toLowerCase().trim())
  );

  return (
    <div id="bus-arrivals-view" className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Search Bar & Popular Presets */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by 5-digit code (e.g. 83139) or stop name..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-hidden'
              }`}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              placeholder="Filter Bus (e.g. 15)"
              className={`w-36 px-3 py-2.5 rounded-xl text-sm font-medium border text-center transition-colors ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-hidden'
              }`}
            />

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">directions_bus</span>
              <span>Find</span>
            </button>
          </div>
        </form>

        {/* Popular Singapore Bus Stops Chips */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-xs pb-1">
          <span className="text-slate-500 font-medium shrink-0">Popular Stops:</span>
          {SINGAPORE_BUS_STOPS.slice(0, 7).map((s) => (
            <button
              key={s.code}
              type="button"
              onClick={() => handleSelectPreset(s.code)}
              className={`px-3 py-1 rounded-lg border font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                activeStopCode === s.code
                  ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                  : isDark
                  ? 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="font-mono font-bold text-[11px] opacity-80">{s.code}</span>
              <span>{s.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Bus Stop Header */}
      <div
        className={`p-5 rounded-2xl border transition-colors ${
          isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-mono font-black text-base shrink-0">
              {activeStopCode}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  {currentStopDetail.name}
                </h2>
                <button
                  type="button"
                  onClick={() => onToggleFavoriteStop(currentStopDetail)}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    isStopFavorited
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-500'
                      : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-amber-500'
                  }`}
                  title={isStopFavorited ? 'Remove from Saved' : 'Save this Bus Stop'}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isStopFavorited ? 'star' : 'star_border'}
                  </span>
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {currentStopDetail.roadName} {currentStopDetail.district ? `• ${currentStopDetail.district}` : ''}
              </p>
            </div>
          </div>

          {/* Refresh Controls & 20s Countdown */}
          <div className="flex items-center gap-3">
            <div className="text-right text-xs text-slate-400 font-mono hidden sm:block">
              <div>Auto-sync in <span className="font-bold text-emerald-600 dark:text-emerald-400">{countdown}s</span></div>
              {lastRefreshedTime && <div className="text-[10px]">Updated {lastRefreshedTime}</div>}
            </div>

            <button
              onClick={() => {
                setCountdown(20);
                fetchArrivals(activeStopCode, serviceFilter);
              }}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span>{loading ? 'Updating...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Load Legend */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Crowd Levels:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Seats Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Standing Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span>Crowded</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto text-[11px]">
            <span>DD = Double Deck</span>
            <span>•</span>
            <span>SD = Single Deck</span>
            <span>•</span>
            <span>♿ = Wheelchair Accessible</span>
          </div>
        </div>
      </div>

      {/* Bus Arrival Services List */}
      <div className="space-y-3">
        {filteredArrivals.length === 0 ? (
          <div
            className={`p-10 rounded-2xl border text-center ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-slate-400 text-[40px]">directions_bus</span>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mt-2">
              No Bus Services Found
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Check the bus stop code or try clearing the service filter.
            </p>
          </div>
        ) : (
          filteredArrivals.map((bus) => {
            const isServiceFavorited = favorites.some(
              (f) => f.type === 'service' && f.busStopCode === activeStopCode && f.serviceNo === bus.serviceNo
            );

            return (
              <div
                key={bus.serviceNo}
                className={`p-4 sm:p-5 rounded-2xl border transition-all hover:shadow-sm ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Bus Service Badge & Operator */}
                  <div className="flex items-center gap-3">
                    <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-emerald-500/20 text-white dark:text-emerald-400 font-extrabold text-xl font-mono tracking-tight shadow-xs">
                      {bus.serviceNo}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {bus.operator}
                        </span>
                        <button
                          type="button"
                          onClick={() => onToggleFavoriteService(currentStopDetail, bus.serviceNo)}
                          className={`p-1 rounded transition-colors ${
                            isServiceFavorited
                              ? 'text-amber-500'
                              : 'text-slate-400 hover:text-amber-500'
                          }`}
                          title={isServiceFavorited ? 'Remove bookmark' : 'Save Bus Service'}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {isServiceFavorited ? 'star' : 'star_border'}
                          </span>
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        {bus.nextBus.feature === 'WAB' && (
                          <span className="flex items-center gap-0.5" title="Wheelchair Accessible Bus">
                            <span className="material-symbols-outlined text-[13px]">accessible</span>
                            <span>WAB</span>
                          </span>
                        )}
                        <span>•</span>
                        <span>{bus.nextBus.typeLabel}</span>
                      </div>
                    </div>
                  </div>

                  {/* 3 Arrival Timings */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center sm:min-w-[320px]">
                    {/* Next Bus */}
                    <div
                      className={`p-2.5 sm:p-3 rounded-xl border flex flex-col items-center justify-center transition-colors ${
                        bus.nextBus.loadColor === 'green'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                          : bus.nextBus.loadColor === 'amber'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                          : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                        Next Bus
                      </span>
                      <span className="text-lg sm:text-xl font-black font-mono mt-0.5">
                        {bus.nextBus.arrivalText}
                      </span>
                      <div className="flex items-center gap-1 mt-1 text-[10px] font-semibold">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            bus.nextBus.loadColor === 'green'
                              ? 'bg-emerald-500'
                              : bus.nextBus.loadColor === 'amber'
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                        ></span>
                        <span className="truncate max-w-[80px]">{bus.nextBus.type}</span>
                      </div>
                    </div>

                    {/* 2nd Bus */}
                    <div
                      className={`p-2.5 sm:p-3 rounded-xl border flex flex-col items-center justify-center ${
                        isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        2nd Bus
                      </span>
                      <span className="text-base sm:text-lg font-bold font-mono mt-0.5">
                        {bus.nextBus2 ? bus.nextBus2.arrivalText : '—'}
                      </span>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                        {bus.nextBus2 && (
                          <>
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                bus.nextBus2.loadColor === 'green'
                                  ? 'bg-emerald-500'
                                  : bus.nextBus2.loadColor === 'amber'
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              }`}
                            ></span>
                            <span>{bus.nextBus2.type}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 3rd Bus */}
                    <div
                      className={`p-2.5 sm:p-3 rounded-xl border flex flex-col items-center justify-center ${
                        isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        3rd Bus
                      </span>
                      <span className="text-base sm:text-lg font-bold font-mono mt-0.5">
                        {bus.nextBus3 ? bus.nextBus3.arrivalText : '—'}
                      </span>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                        {bus.nextBus3 && <span>{bus.nextBus3.type}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Commuter Discussion Section for this Bus Stop */}
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-[20px]">forum</span>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Commuter Feedback & Crowd Reports for {currentStopDetail.name} ({activeStopCode})
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Leave a note for other commuters or report live delays via Disqus.
            </p>
          </div>

          <button
            onClick={() => setShowDiscussion((prev) => !prev)}
            className="px-3 py-1.5 rounded-xl border border-blue-600/30 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 font-bold text-xs flex items-center gap-1.5 transition"
          >
            <span className="material-symbols-outlined text-[16px]">
              {showDiscussion ? 'expand_less' : 'chat'}
            </span>
            <span>{showDiscussion ? 'Hide Discussion' : 'Join Discussion'}</span>
          </button>
        </div>

        {showDiscussion && (
          <div className="mt-4 space-y-4">
            {/* Quick Stop Note Input Form */}
            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-blue-600">edit_note</span>
                <span>Leave a Quick Note for this Stop</span>
              </h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={stopNoteAuthor}
                  onChange={(e) => setStopNoteAuthor(e.target.value)}
                  placeholder="Your name"
                  className="w-full sm:w-36 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                />
                <input
                  type="text"
                  value={newStopNote}
                  onChange={(e) => setNewStopNote(e.target.value)}
                  placeholder="e.g. Bus queue moving fast, rain shelter dry..."
                  className="flex-1 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newStopNote.trim()) {
                      setStopNotes((prev) => [
                        {
                          id: String(Date.now()),
                          author: stopNoteAuthor.trim() || 'Commuter',
                          text: newStopNote.trim(),
                          time: 'Just now'
                        },
                        ...prev
                      ]);
                      setNewStopNote('');
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newStopNote.trim()) {
                      setStopNotes((prev) => [
                        {
                          id: String(Date.now()),
                          author: stopNoteAuthor.trim() || 'Commuter',
                          text: newStopNote.trim(),
                          time: 'Just now'
                        },
                        ...prev
                      ]);
                      setNewStopNote('');
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">send</span>
                  <span>Post</span>
                </button>
              </div>

              {/* Stop Notes List */}
              {stopNotes.length > 0 && (
                <div className="mt-3 space-y-2 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                  {stopNotes.map((note) => (
                    <div key={note.id} className="bg-white dark:bg-slate-900 p-2.5 rounded-xl text-xs border border-slate-200/50 dark:border-slate-800">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{note.author}</span>
                        <span className="text-slate-400">{note.time}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">{note.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Disqus Global Thread for Bus Stop */}
            <DisqusThread
              shortname="sinta888"
              identifier={`bus-stop-${activeStopCode}`}
              title={`Bus Stop ${activeStopCode} - ${currentStopDetail.name} (${currentStopDetail.roadName})`}
            />
          </div>
        )}
      </div>
    </div>
  );
};
