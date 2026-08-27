import type { Request, Response } from 'express';

const getOneMapToken = (): string | undefined => {
  return process.env.ONEMAP_TOKEN || process.env.ONE_MAP_TOKEN;
};

const getQuery = (req: Request, key: string): string | undefined => {
  if (req.query && req.query[key]) {
    const val = req.query[key];
    return Array.isArray(val) ? (val[0] as string) : (val as string);
  }
  try {
    const parsed = new URL(req.url || '', 'http://localhost');
    return parsed.searchParams.get(key) || undefined;
  } catch {
    return undefined;
  }
};

export default async function handler(req: Request, res: Response) {
  const start = getQuery(req, 'start');
  const end = getQuery(req, 'end');
  const routeType = getQuery(req, 'routeType') || 'pt';

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
        res.status(200).json(data);
        return;
      }
    }

    res.status(200).json({
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
