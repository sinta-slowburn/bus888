import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Navigation,
  ArrowUpDown,
  Bus,
  Train,
  Footprints,
  CloudRain,
  Sun,
  Cloud,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Info,
  Maximize2
} from 'lucide-react';
import { LocationSearchResult, TransitRouteOption, WeatherSummary } from '../types';
import { transitPlanner } from '../services/transitPlanner';
import { weatherApi } from '../services/weatherApi';

interface InteractiveMapRoutePlannerProps {
  onSelectBusStop?: (code: string) => void;
}

export const InteractiveMapRoutePlanner: React.FC<InteractiveMapRoutePlannerProps> = ({
  onSelectBusStop
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  // Search states
  const [originQuery, setOriginQuery] = useState('Marine Parade (83139)');
  const [destQuery, setDestQuery] = useState('Marina Bay Sands (03011)');
  const [originResult, setOriginResult] = useState<LocationSearchResult>({
    name: 'Marine Parade Promenade',
    address: '83139 • Marine Parade Rd',
    lat: 1.3025,
    lng: 103.9058,
    type: 'bus-stop',
    code: '83139'
  });
  const [destResult, setDestResult] = useState<LocationSearchResult>({
    name: 'Marina Bay Sands',
    address: '03011 • 10 Bayfront Ave',
    lat: 1.2838,
    lng: 103.8591,
    type: 'landmark',
    code: '03011'
  });

  const [originSuggestions, setOriginSuggestions] = useState<LocationSearchResult[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<LocationSearchResult[]>([]);
  const [activeSearchInput, setActiveSearchInput] = useState<'origin' | 'dest' | null>(null);

  // Routing and weather
  const [routeOptions, setRouteOptions] = useState<TransitRouteOption[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [selectedMode, setSelectedMode] = useState<'all' | 'bus' | 'mrt' | 'walk'>('all');
  const [weatherData, setWeatherData] = useState<WeatherSummary | null>(null);
  const [showWeatherOverlay, setShowWeatherOverlay] = useState<boolean>(true);
  const [mapTileTheme, setMapTileTheme] = useState<'onemap' | 'osm' | 'dark'>('onemap');

  // Load weather and default route on mount
  useEffect(() => {
    weatherApi.get2HourNowcast().then((res) => {
      setWeatherData(res);
      calculateRoutes(originResult, destResult, res.rainAdvisory);
    });
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Singapore center coordinates [1.3521, 103.8198]
      const map = L.map(mapContainerRef.current, {
        center: [1.2950, 103.8750],
        zoom: 13,
        zoomControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Base tile layer
      const tileUrl =
        mapTileTheme === 'dark'
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png';

      const tileLayer = L.tileLayer(tileUrl, {
        maxZoom: 19,
        attribution: '© Singapore Land Authority (OneMap) | OpenStreetMap'
      }).addTo(map);

      mapInstanceRef.current = map;
      markersGroupRef.current = L.layerGroup().addTo(map);

      // Fix sizing after DOM render
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }

    return () => {
      // Keep instance alive or clean up
    };
  }, []);

  // Update Tile Layer when tile theme changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        mapInstanceRef.current?.removeLayer(layer);
      }
    });

    let tileUrl = 'https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png';
    let attr = '© Singapore Land Authority (OneMap) | SLA';

    if (mapTileTheme === 'dark') {
      tileUrl = 'https://www.onemap.gov.sg/maps/tiles/Night/{z}/{x}/{y}.png';
    } else if (mapTileTheme === 'osm') {
      tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      attr = '© OpenStreetMap contributors';
    }

    L.tileLayer(tileUrl, { maxZoom: 19, attribution: attr }).addTo(mapInstanceRef.current);
  }, [mapTileTheme]);

  // Redraw route polylines and markers whenever route or selectedRouteIndex changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;

    markersGroup.clearLayers();

    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    const currentRoute = routeOptions[selectedRouteIndex];
    if (!currentRoute) return;

    // Custom Origin Marker (Green Pin A)
    const originIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="background-color: #059669; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.35);">
          A
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    // Custom Dest Marker (Red Pin B)
    const destIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="background-color: #dc2626; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.35);">
          B
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const startMarker = L.marker([originResult.lat, originResult.lng], { icon: originIcon })
      .bindPopup(
        `<div style="font-family: sans-serif; padding: 4px;">
          <strong style="color: #059669;">From: ${originResult.name}</strong><br/>
          <span style="font-size: 11px; color: #64748b;">${originResult.address}</span>
        </div>`
      );
    markersGroup.addLayer(startMarker);

    const endMarker = L.marker([destResult.lat, destResult.lng], { icon: destIcon })
      .bindPopup(
        `<div style="font-family: sans-serif; padding: 4px;">
          <strong style="color: #dc2626;">To: ${destResult.name}</strong><br/>
          <span style="font-size: 11px; color: #64748b;">${destResult.address}</span>
        </div>`
      );
    markersGroup.addLayer(endMarker);

    // Draw Route Polyline
    if (currentRoute.polyline && currentRoute.polyline.length > 0) {
      const polyline = L.polyline(currentRoute.polyline, {
        color: selectedRouteIndex === 0 ? '#2563eb' : '#059669',
        weight: 6,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: selectedMode === 'walk' ? '8, 8' : undefined
      }).addTo(map);

      routePolylineRef.current = polyline;

      // Fit bounds to show entire route with padding
      const bounds = L.latLngBounds([
        [originResult.lat, originResult.lng],
        [destResult.lat, destResult.lng]
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [routeOptions, selectedRouteIndex, originResult, destResult, selectedMode]);

  // Calculate Routes
  const calculateRoutes = (
    from: LocationSearchResult,
    to: LocationSearchResult,
    notice?: string
  ) => {
    const plans = transitPlanner.planRoute(from, to, notice);
    setRouteOptions(plans);
    setSelectedRouteIndex(0);
  };

  // Search input handler
  const handleOriginSearch = async (val: string) => {
    setOriginQuery(val);
    if (val.length > 1) {
      const res = await transitPlanner.searchLocations(val);
      setOriginSuggestions(res);
    } else {
      setOriginSuggestions([]);
    }
  };

  const handleDestSearch = async (val: string) => {
    setDestQuery(val);
    if (val.length > 1) {
      const res = await transitPlanner.searchLocations(val);
      setDestSuggestions(res);
    } else {
      setDestSuggestions([]);
    }
  };

  const selectOrigin = (item: LocationSearchResult) => {
    setOriginResult(item);
    setOriginQuery(`${item.name} ${item.code ? `(${item.code})` : ''}`);
    setActiveSearchInput(null);
    calculateRoutes(item, destResult, weatherData?.rainAdvisory);
  };

  const selectDest = (item: LocationSearchResult) => {
    setDestResult(item);
    setDestQuery(`${item.name} ${item.code ? `(${item.code})` : ''}`);
    setActiveSearchInput(null);
    calculateRoutes(originResult, item, weatherData?.rainAdvisory);
  };

  const swapLocations = () => {
    const tempResult = originResult;
    const tempQuery = originQuery;
    setOriginResult(destResult);
    setOriginQuery(destQuery);
    setDestResult(tempResult);
    setDestQuery(tempQuery);
    calculateRoutes(destResult, tempResult, weatherData?.rainAdvisory);
  };

  const useCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLoc: LocationSearchResult = {
            name: 'Current Location (GPS)',
            address: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            type: 'landmark'
          };
          selectOrigin(userLoc);
        },
        () => {
          // Default to Raffles Place if GPS denied
          selectOrigin({
            name: 'Raffles Place MRT (NS26/EW14)',
            address: 'Financial District, Singapore',
            lat: 1.2830,
            lng: 103.8515,
            type: 'mrt'
          });
        }
      );
    }
  };

  const currentRoute = routeOptions[selectedRouteIndex];

  return (
    <div id="interactive-map-route-planner" className="w-full flex flex-col lg:flex-row min-h-[calc(100vh-130px)] gap-4">
      {/* LEFT / TOP: Google Maps-Style Direction Controls & Route Cards */}
      <div className="w-full lg:w-[440px] flex-shrink-0 flex flex-col gap-4">
        {/* Search & Location Fill Box */}
        <div className="bg-white dark:bg-slate-850 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 relative">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                Singapore Transit Directions
              </h2>
            </div>
            <button
              id="gps-location-btn"
              onClick={useCurrentLocation}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-lg transition"
            >
              <Navigation className="w-3.5 h-3.5" />
              My GPS
            </button>
          </div>

          {/* Mode Selector Tabs (Google Maps style) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl mb-3.5">
            <button
              onClick={() => setSelectedMode('all')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                selectedMode === 'all'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <Bus className="w-3.5 h-3.5" />
              All Transit
            </button>
            <button
              onClick={() => setSelectedMode('bus')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                selectedMode === 'bus'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <Bus className="w-3.5 h-3.5" />
              Bus Only
            </button>
            <button
              onClick={() => setSelectedMode('mrt')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                selectedMode === 'mrt'
                  ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <Train className="w-3.5 h-3.5" />
              MRT / Train
            </button>
            <button
              onClick={() => setSelectedMode('walk')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                selectedMode === 'walk'
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <Footprints className="w-3.5 h-3.5" />
              Walk
            </button>
          </div>

          {/* From / To Text Inputs with Connector Graphic */}
          <div className="flex gap-2 items-center relative">
            {/* Visual connector dots */}
            <div className="flex flex-col items-center justify-between py-3 h-20">
              <div className="w-3 h-3 rounded-full border-2 border-emerald-600 bg-white"></div>
              <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700"></div>
              <div className="w-3 h-3 rounded-full bg-red-600"></div>
            </div>

            {/* Input boxes */}
            <div className="flex-1 flex flex-col gap-2 relative">
              {/* Origin Input */}
              <div className="relative">
                <input
                  id="origin-input"
                  type="text"
                  value={originQuery}
                  onChange={(e) => handleOriginSearch(e.target.value)}
                  onFocus={() => setActiveSearchInput('origin')}
                  placeholder="Choose starting point or bus stop..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
                {activeSearchInput === 'origin' && originSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-850 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 max-h-56 overflow-y-auto">
                    {originSuggestions.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectOrigin(item)}
                        className="w-full text-left px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-0 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {item.name}
                          </div>
                          <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                            {item.address}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {item.type}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Destination Input */}
              <div className="relative">
                <input
                  id="dest-input"
                  type="text"
                  value={destQuery}
                  onChange={(e) => handleDestSearch(e.target.value)}
                  onFocus={() => setActiveSearchInput('dest')}
                  placeholder="Choose destination..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
                {activeSearchInput === 'dest' && destSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-850 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 max-h-56 overflow-y-auto">
                    {destSuggestions.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectDest(item)}
                        className="w-full text-left px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-0 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {item.name}
                          </div>
                          <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                            {item.address}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {item.type}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Swap Button */}
            <button
              id="swap-locations-btn"
              onClick={swapLocations}
              title="Reverse starting point and destination"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Presets Chips */}
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            <span className="text-slate-400 font-semibold flex-shrink-0">Quick:</span>
            {[
              { label: 'Orchard MRT', code: 'NS22', lat: 1.3040, lng: 103.8318 },
              { label: 'Changi Airport', code: '03011', lat: 1.3551, lng: 103.9864 },
              { label: 'VivoCity', code: '14141', lat: 1.2644, lng: 103.8222 },
              { label: 'Jurong East', code: '28009', lat: 1.3331, lng: 103.7423 }
            ].map((preset, idx) => (
              <button
                key={idx}
                onClick={() =>
                  selectDest({
                    name: preset.label,
                    address: `Singapore Hub`,
                    lat: preset.lat,
                    lng: preset.lng,
                    type: 'landmark',
                    code: preset.code
                  })
                }
                className="whitespace-nowrap px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-slate-600 dark:text-slate-300 transition font-medium"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Weather Integration Card */}
        {weatherData && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-3.5 shadow-sm flex items-start gap-3 relative overflow-hidden">
            <div className="p-2 rounded-xl bg-white/15 flex-shrink-0 backdrop-blur-sm">
              {weatherData.rainAdvisory?.includes('rain') || weatherData.rainAdvisory?.includes('shower') ? (
                <CloudRain className="w-5 h-5 text-blue-200 animate-bounce" />
              ) : (
                <Sun className="w-5 h-5 text-amber-300" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-100">
                <span>Singapore 2-Hour Nowcast</span>
                <span className="font-bold text-white">{weatherData.temperatureRange}</span>
              </div>
              <p className="text-xs text-white/95 mt-1 font-medium leading-relaxed">
                {weatherData.rainAdvisory}
              </p>
            </div>
          </div>
        )}

        {/* Route Options List */}
        <div className="flex flex-col gap-2.5">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1 flex items-center justify-between">
            <span>Suggested Routes</span>
            <span>{routeOptions.length} Options</span>
          </div>

          {routeOptions.map((route, idx) => (
            <div
              key={route.id}
              onClick={() => setSelectedRouteIndex(idx)}
              className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                selectedRouteIndex === idx
                  ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20'
                  : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-slate-900 dark:text-white">
                    {route.durationMinutes} min
                  </span>
                  {route.isFastest && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      Fastest
                    </span>
                  )}
                  {route.isRecommended && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> Best Transit
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold text-slate-500">
                  {route.departureTime} - {route.arrivalTime}
                </div>
              </div>

              <div className="mt-1 text-xs text-slate-600 dark:text-slate-300 font-medium">
                {route.viaSummary} • {route.fare}
              </div>

              {/* Step Badges Preview */}
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                {route.steps.map((step, sIdx) => (
                  <React.Fragment key={sIdx}>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200">
                      {step.mode === 'bus' && <Bus className="w-3 h-3 text-emerald-600" />}
                      {step.mode === 'mrt' && <Train className="w-3 h-3 text-purple-600" />}
                      {step.mode === 'walk' && <Footprints className="w-3 h-3 text-slate-400" />}
                      <span>{step.lineBadge || step.distanceDisplay}</span>
                    </div>
                    {sIdx < route.steps.length - 1 && (
                      <span className="text-slate-300 dark:text-slate-600 text-xs">›</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Selected Route Turn-by-Turn Steps */}
        {currentRoute && (
          <div className="bg-white dark:bg-slate-850 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              Turn-by-Turn Journey Details
            </h3>

            <div className="space-y-4">
              {currentRoute.steps.map((step, stepIdx) => (
                <div key={step.id} className="flex gap-3 text-xs relative">
                  {/* Step mode icon */}
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0 h-fit">
                    {step.mode === 'bus' && <Bus className="w-4 h-4 text-emerald-600" />}
                    {step.mode === 'mrt' && <Train className="w-4 h-4 text-purple-600" />}
                    {step.mode === 'walk' && <Footprints className="w-4 h-4 text-slate-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {step.instruction}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 mt-0.5 text-[11px]">
                      {step.detail}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <span>{step.durationMinutes} mins</span>
                      <span>•</span>
                      <span>{step.distanceDisplay}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {originResult.code && onSelectBusStop && (
              <button
                onClick={() => onSelectBusStop(originResult.code!)}
                className="w-full mt-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <Bus className="w-3.5 h-3.5" />
                View Live Bus Arrival Board for {originResult.code}
              </button>
            )}
          </div>
        )}
      </div>

      {/* RIGHT: High-Performance Interactive Map Canvas (Leaflet & OneMap) */}
      <div className="flex-1 flex flex-col min-h-[460px] lg:min-h-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative bg-slate-100 dark:bg-slate-900">
        {/* Map Header Toolbar (Layer Toggles & Weather Status) */}
        <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center justify-between gap-2 pointer-events-none">
          <div className="flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200/60 dark:border-slate-700/60 pointer-events-auto text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              Singapore OneMap & Transit
            </span>
            <div className="h-3 w-px bg-slate-300 dark:bg-slate-700 mx-1"></div>
            <select
              value={mapTileTheme}
              onChange={(e) => setMapTileTheme(e.target.value as any)}
              className="bg-transparent text-slate-600 dark:text-slate-300 font-semibold focus:outline-none cursor-pointer text-xs"
            >
              <option value="onemap">OneMap Standard</option>
              <option value="dark">OneMap Night / Dark</option>
              <option value="osm">OpenStreetMap</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.setView([1.3521, 103.8198], 12);
                }
              }}
              title="Recenter Singapore"
              className="p-2 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 transition flex items-center gap-1 text-xs font-semibold"
            >
              <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Fit Singapore</span>
            </button>
          </div>
        </div>

        {/* Leaflet Map DOM Element */}
        <div ref={mapContainerRef} className="w-full h-full min-h-[460px] lg:min-h-full z-0" />

        {/* Bottom Floating Legend / Weather Notice */}
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 text-[11px] flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Point A (Start)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-600 inline-block"></span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Point B (End)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-1 bg-blue-600 rounded inline-block"></span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Transit Path</span>
          </div>
        </div>
      </div>
    </div>
  );
};
