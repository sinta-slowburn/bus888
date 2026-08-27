import type { Request, Response } from 'express';

const getAccountKey = (): string | undefined => {
  return process.env.LTA_ACCOUNT_KEY || process.env.ACCOUNT_KEY || process.env.LTA_DATAMALL_API_KEY;
};

export default function handler(_req: Request, res: Response) {
  const accountKey = getAccountKey();
  res.status(200).json({
    configured: Boolean(accountKey),
    endpoints: [
      '/api/lta/bus-arrival?busStopCode=83139',
      '/api/lta/carparks',
      '/api/lta/traffic-incidents',
      '/api/lta/train-alerts'
    ]
  });
}
