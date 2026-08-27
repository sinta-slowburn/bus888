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
  const searchVal = getQuery(req, 'searchVal') || getQuery(req, 'q');
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
    res.status(200).json(data);
  } catch (err: any) {
    res.status(502).json({ error: 'Failed to search OneMap', message: err?.message });
  }
}
