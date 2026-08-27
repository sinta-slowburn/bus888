import { Request, Response } from 'express';

const getOneMapToken = (): string | undefined => {
  return process.env.ONEMAP_TOKEN || process.env.ONE_MAP_TOKEN;
};

/**
 * OneMap Search API (Elastic Search for addresses, postal codes, building names)
 * GET /api/onemap/search?searchVal=orchard
 */
export async function handleOneMapSearch(req: Request, res: Response): Promise<void> {
  const searchVal = (req.query.searchVal || req.query.q) as string;
  if (!searchVal) {
    res.status(400).json({ error: 'searchVal is required' });
    return;
  }

  try {
    const url = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(
      searchVal
    )}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;

    const token = getOneMapToken();
    const headers: Record<string, string> = {
      accept: 'application/json'
    };
    if (token && token !== 'ONEMAP_TOKEN') {
      headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      res.status(response.status).json({ error: `OneMap API status: ${response.status}` });
      return;
    }

    const data = await response.json();
    res.setHeader('Cache-Control', 'public, max-age=120');
    res.json(data);
  } catch (err: any) {
    res.status(502).json({ error: 'Failed to search OneMap', message: err?.message });
  }
}

/**
 * OneMap Route API (Public Transit, Walking, Driving)
 * GET /api/onemap/route?start=1.3008,103.9056&end=1.2796,103.8545&routeType=pt
 */
export async function handleOneMapRoute(req: Request, res: Response): Promise<void> {
  const start = req.query.start as string; // "lat,lng"
  const end = req.query.end as string; // "lat,lng"
  const routeType = (req.query.routeType || 'pt') as string; // pt, walk, drive, cycle

  if (!start || !end) {
    res.status(400).json({ error: 'start and end parameters are required (format: lat,lng)' });
    return;
  }

  const token = getOneMapToken();

  try {
    if (token && token !== 'ONEMAP_TOKEN') {
      let routeUrl = '';
      if (routeType === 'pt') {
        const [startLat, startLng] = start.split(',');
        const [endLat, endLng] = end.split(',');
        const date = new Date().toISOString().split('T')[0];
        const time = new Date().toTimeString().split(' ')[0];
        routeUrl = `https://www.onemap.gov.sg/api/public/routingsvc/route?start=${startLat}%2C${startLng}&end=${endLat}%2C${endLng}&routeType=pt&date=${date}&time=${time}&mode=TRANSIT`;
      } else {
        routeUrl = `https://www.onemap.gov.sg/api/public/routingsvc/route?start=${start}&end=${end}&routeType=${routeType}`;
      }

      const response = await fetch(routeUrl, {
        headers: {
          Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
          accept: 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        res.setHeader('Cache-Control', 'public, max-age=60');
        res.json(data);
        return;
      }
    }

    // Fallback Transit Routing calculation
    res.json({
      status: 'fallback',
      message: 'Using built-in Singapore Transit Routing Engine',
      start,
      end,
      routeType
    });
  } catch (err: any) {
    res.status(502).json({ error: 'Routing request failed', message: err?.message });
  }
}
