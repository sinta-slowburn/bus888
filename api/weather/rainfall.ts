import type { Request, Response } from 'express';

export default async function handler(_req: Request, res: Response) {
  try {
    const url = 'https://api.data.gov.sg/v1/environment/rainfall';
    const response = await fetch(url, { headers: { accept: 'application/json' } });

    if (response.ok) {
      const data = await response.json();
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.status(200).json(data);
      return;
    }

    res.status(200).json({ status: 'ok', readings: [] });
  } catch (err: any) {
    res.status(502).json({ error: 'Failed to fetch rainfall data', message: err?.message });
  }
}
