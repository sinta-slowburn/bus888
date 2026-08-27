import type { Request, Response } from 'express';

const getAccountKey = (): string | undefined => {
  return process.env.LTA_ACCOUNT_KEY || process.env.ACCOUNT_KEY || process.env.LTA_DATAMALL_API_KEY;
};

const LTA_BASE_URL = 'https://datamall2.mytransport.sg/ltaodataservice';

export default async function handler(_req: Request, res: Response) {
  const accountKey = getAccountKey();
  if (!accountKey) {
    res.status(500).json({ error: 'credential not configured' });
    return;
  }

  try {
    const url = `${LTA_BASE_URL}/TrafficIncidents`;
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
    res.setHeader('Cache-Control', 'public, max-age=30');
    res.status(200).json(data);
  } catch (error: any) {
    res.status(502).json({
      error: 'Failed to fetch traffic incidents from LTA DataMall',
      message: error?.message || 'Network error'
    });
  }
}
