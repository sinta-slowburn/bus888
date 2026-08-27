import type { Request, Response } from 'express';

const getAccountKey = (): string | undefined => {
  return process.env.LTA_ACCOUNT_KEY || process.env.ACCOUNT_KEY || process.env.LTA_DATAMALL_API_KEY;
};

const LTA_BASE_URL = 'https://datamall2.mytransport.sg/ltaodataservice';

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
  const accountKey = getAccountKey();
  if (!accountKey) {
    res.status(500).json({ error: 'credential not configured' });
    return;
  }

  const busStopCode = getQuery(req, 'busStopCode') || getQuery(req, 'BusStopCode');
  const serviceNo = getQuery(req, 'serviceNo') || getQuery(req, 'ServiceNo');

  if (!busStopCode) {
    res.status(400).json({ error: 'Missing required busStopCode query parameter' });
    return;
  }

  try {
    let url = `${LTA_BASE_URL}/v3/BusArrival?BusStopCode=${encodeURIComponent(busStopCode)}`;
    if (serviceNo) {
      url += `&ServiceNo=${encodeURIComponent(serviceNo)}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        AccountKey: accountKey,
        accept: 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      res.status(response.status).json({
        error: `LTA API responded with status ${response.status}`,
        details: errorText
      });
      return;
    }

    const data = await response.json();
    res.setHeader('Cache-Control', 'public, max-age=15');
    res.status(200).json(data);
  } catch (error: any) {
    res.status(502).json({
      error: 'Failed to fetch bus arrival telemetry from LTA DataMall',
      message: error?.message || 'Network error'
    });
  }
}
