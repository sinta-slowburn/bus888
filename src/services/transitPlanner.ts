import { LocationSearchResult, TransitRouteOption, RouteTransitStep } from '../types';
import { SINGAPORE_BUS_STOPS } from '../data/mockData';

export const transitPlanner = {
  /**
   * Search locations (Local Singapore Transit directory + OneMap geocoding)
   */
  async searchLocations(query: string): Promise<LocationSearchResult[]> {
    if (!query || query.trim().length === 0) return [];
    const q = query.trim().toLowerCase();

    const results: LocationSearchResult[] = [];

    // 1. Check local Bus Stops
    for (const stop of SINGAPORE_BUS_STOPS) {
      if (
        stop.code.includes(q) ||
        stop.name.toLowerCase().includes(q) ||
        stop.roadName.toLowerCase().includes(q) ||
        stop.services.some((srv) => srv.toLowerCase() === q)
      ) {
        results.push({
          name: stop.name,
          address: `${stop.code} • ${stop.roadName}`,
          lat: stop.lat,
          lng: stop.lng,
          type: 'bus-stop',
          code: stop.code
        });
      }
    }

    // 2. Popular Singapore MRT Stations & Landmarks
    const landmarks: LocationSearchResult[] = [
      { name: 'Raffles Place MRT (NS26/EW14)', address: 'Financial District, D01', lat: 1.2830, lng: 103.8515, type: 'mrt' },
      { name: 'City Hall MRT (NS25/EW13)', address: 'Stamford Rd, D06', lat: 1.2930, lng: 103.8522, type: 'mrt' },
      { name: 'Dhoby Ghaut MRT (NS24/NE6/CC1)', address: 'Orchard Rd, D09', lat: 1.2989, lng: 103.8458, type: 'mrt' },
      { name: 'Orchard MRT (NS22/TE14)', address: 'Orchard Blvd / ION Orchard', lat: 1.3040, lng: 103.8318, type: 'mrt' },
      { name: 'Marina Bay Sands', address: '10 Bayfront Ave, D10', lat: 1.2838, lng: 103.8591, type: 'landmark' },
      { name: 'Changi Airport Terminal 3', address: '65 Airport Blvd', lat: 1.3551, lng: 103.9864, type: 'landmark' },
      { name: 'VivoCity / HarbourFront', address: '1 HarbourFront Walk', lat: 1.2644, lng: 103.8222, type: 'landmark' },
      { name: 'Jurong East MRT & Hub', address: 'Jurong Gateway Rd', lat: 1.3331, lng: 103.7423, type: 'mrt' },
      { name: 'Bugis Junction & MRT', address: '200 Victoria St', lat: 1.3000, lng: 103.8560, type: 'mrt' },
      { name: 'Tampines MRT & Hub', address: 'Tampines Central 1', lat: 1.3533, lng: 103.9452, type: 'mrt' }
    ];

    for (const lm of landmarks) {
      if (lm.name.toLowerCase().includes(q) || lm.address.toLowerCase().includes(q)) {
        results.push(lm);
      }
    }

    // 3. Query OneMap if online
    try {
      const res = await fetch(`/api/onemap/search?searchVal=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && Array.isArray(data.results)) {
          for (const item of data.results.slice(0, 5)) {
            const lat = parseFloat(item.LATITUDE);
            const lng = parseFloat(item.LONGITUDE);
            if (!isNaN(lat) && !isNaN(lng)) {
              results.push({
                name: item.BUILDING && item.BUILDING !== 'NIL' ? item.BUILDING : item.SEARCHVAL,
                address: `${item.ROAD_NAME || ''} ${item.POSTAL && item.POSTAL !== 'NIL' ? `S(${item.POSTAL})` : ''}`.trim(),
                lat,
                lng,
                type: 'address'
              });
            }
          }
        }
      }
    } catch {
      // ignore
    }

    // Return unique results
    const seen = new Set<string>();
    return results.filter((r) => {
      const key = `${r.name}-${r.lat.toFixed(4)}-${r.lng.toFixed(4)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  /**
   * Compute transit route alternatives between Origin and Destination
   */
  planRoute(
    origin: LocationSearchResult,
    destination: LocationSearchResult,
    weatherNotice?: string
  ): TransitRouteOption[] {
    const lat1 = origin.lat;
    const lng1 = origin.lng;
    const lat2 = destination.lat;
    const lng2 = destination.lng;

    // Haversine distance in KM
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distKm = Math.max(0.8, Number((R * c).toFixed(1)));

    // Generate waypoints polyline (smooth curved interpolation for Singapore roads)
    const pointsCount = 10;
    const polyline: [number, number][] = [];
    for (let i = 0; i <= pointsCount; i++) {
      const t = i / pointsCount;
      // Slight arc offset for realistic transit routing shape
      const arcOffset = Math.sin(t * Math.PI) * 0.006 * (i % 2 === 0 ? 1 : -0.5);
      polyline.push([
        lat1 + (lat2 - lat1) * t + arcOffset,
        lng1 + (lng2 - lng1) * t + arcOffset * 0.7
      ]);
    }

    const now = new Date();
    const departStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Option 1: Direct Bus Service Route
    const busDuration = Math.round(distKm * 2.6 + 6);
    const busArrivalDate = new Date(now.getTime() + busDuration * 60000);
    const busArrivalStr = busArrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const busOption: TransitRouteOption = {
      id: 'route-bus-direct',
      title: 'Bus Transit Route (Direct)',
      viaSummary: `Via Bus 196 / 36 • ${distKm} km`,
      durationMinutes: busDuration,
      distanceKm: distKm,
      departureTime: departStr,
      arrivalTime: busArrivalStr,
      fare: `$${(1.09 + distKm * 0.08).toFixed(2)}`,
      isFastest: distKm < 6,
      isRecommended: true,
      weatherNotice,
      polyline,
      steps: [
        {
          id: 's1',
          instruction: `Walk 180m to ${origin.code ? `Bus Stop ${origin.code}` : 'nearest boarding stop'}`,
          detail: 'Head towards main road pedestrian sheltered crossing',
          distanceDisplay: '180m',
          durationMinutes: 3,
          mode: 'walk',
          icon: 'directions_walk'
        },
        {
          id: 's2',
          instruction: 'Board Bus 196 or Bus 36',
          detail: `Ride for ${Math.max(4, Math.round(distKm * 1.5))} stops along transit corridor`,
          distanceDisplay: `${distKm} km`,
          durationMinutes: busDuration - 6,
          mode: 'bus',
          icon: 'directions_bus',
          lineBadge: 'Bus 196',
          lineColor: 'bg-emerald-600 text-white',
          stopsCount: Math.max(4, Math.round(distKm * 1.5))
        },
        {
          id: 's3',
          instruction: `Alight and walk 120m to ${destination.name}`,
          detail: 'Arrive at destination',
          distanceDisplay: '120m',
          durationMinutes: 3,
          mode: 'walk',
          icon: 'pin_drop'
        }
      ]
    };

    // Option 2: MRT Rail Line Route
    const mrtDuration = Math.round(distKm * 1.9 + 8);
    const mrtArrivalDate = new Date(now.getTime() + mrtDuration * 60000);
    const mrtArrivalStr = mrtArrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const mrtOption: TransitRouteOption = {
      id: 'route-mrt-express',
      title: 'MRT Rail Line (Air-Conditioned / Weather-Proof)',
      viaSummary: `East-West / Thomson-East Coast Line • ${distKm} km`,
      durationMinutes: mrtDuration,
      distanceKm: distKm,
      departureTime: departStr,
      arrivalTime: mrtArrivalStr,
      fare: `$${(1.19 + distKm * 0.07).toFixed(2)}`,
      isFastest: distKm >= 6,
      weatherNotice: 'Sheltered underground stations — recommended if raining.',
      polyline,
      steps: [
        {
          id: 'm1',
          instruction: `Walk 350m to nearest MRT station concourse`,
          detail: 'Underground sheltered linkway',
          distanceDisplay: '350m',
          durationMinutes: 5,
          mode: 'walk',
          icon: 'directions_walk'
        },
        {
          id: 'm2',
          instruction: 'Board East-West Line or Thomson-East Coast Line',
          detail: `High-frequency service every 2-3 mins (${Math.max(3, Math.round(distKm * 0.9))} stations)`,
          distanceDisplay: `${distKm} km`,
          durationMinutes: mrtDuration - 8,
          mode: 'mrt',
          icon: 'train',
          lineBadge: 'TEL / EWL',
          lineColor: 'bg-emerald-700 text-white',
          stopsCount: Math.max(3, Math.round(distKm * 0.9))
        },
        {
          id: 'm3',
          instruction: `Exit via Gantry and walk to ${destination.name}`,
          detail: 'Follow station wayfinding signs',
          distanceDisplay: '200m',
          durationMinutes: 3,
          mode: 'walk',
          icon: 'pin_drop'
        }
      ]
    };

    return [busOption, mrtOption];
  }
};
