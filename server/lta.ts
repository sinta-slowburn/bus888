import type { Request, Response } from 'express';

// Read credential ONLY in api/ directory via process.env
const getAccountKey = (): string | undefined => {
  return process.env.LTA_ACCOUNT_KEY || process.env.ACCOUNT_KEY || process.env.LTA_DATAMALL_API_KEY;
};

const LTA_BASE_URL = 'https://datamall2.mytransport.sg/ltaodataservice';

/**
 * Next buses at a stop (v3)
 * GET /api/lta/bus-arrival?busStopCode=83139&serviceNo=15
 */
export async function handleBusArrival(req: Request, res: Response): Promise<void> {
  const accountKey = getAccountKey();
  if (!accountKey) {
    res.status(500).json({ error: 'credential not configured' });
    return;
  }

  const busStopCode = (req.query.busStopCode || req.query.BusStopCode) as string;
  const serviceNo = (req.query.serviceNo || req.query.ServiceNo) as string | undefined;

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
    res.json(data);
  } catch (error: any) {
    res.status(502).json({
      error: 'Failed to fetch bus arrival telemetry from LTA DataMall',
      message: error?.message || 'Network error'
    });
  }
}

/**
 * Live carpark lots (HDB + LTA + URA)
 * GET /api/lta/carparks
 */
export async function handleCarParkAvailability(req: Request, res: Response): Promise<void> {
  const accountKey = getAccountKey();
  if (!accountKey) {
    res.status(500).json({ error: 'credential not configured' });
    return;
  }

  try {
    const url = `${LTA_BASE_URL}/CarParkAvailabilityv2`;
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
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json(data);
  } catch (error: any) {
    res.status(502).json({
      error: 'Failed to fetch carpark availability from LTA DataMall',
      message: error?.message || 'Network error'
    });
  }
}

/**
 * Traffic incidents
 * GET /api/lta/traffic-incidents
 */
export async function handleTrafficIncidents(req: Request, res: Response): Promise<void> {
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
    res.json(data);
  } catch (error: any) {
    res.status(502).json({
      error: 'Failed to fetch traffic incidents from LTA DataMall',
      message: error?.message || 'Network error'
    });
  }
}

/**
 * MRT/LRT status / Train Service Alerts
 * GET /api/lta/train-alerts
 */
export async function handleTrainServiceAlerts(req: Request, res: Response): Promise<void> {
  const accountKey = getAccountKey();
  if (!accountKey) {
    res.status(500).json({ error: 'credential not configured' });
    return;
  }

  try {
    const url = `${LTA_BASE_URL}/TrainServiceAlerts`;
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
    res.json(data);
  } catch (error: any) {
    res.status(502).json({
      error: 'Failed to fetch train service alerts from LTA DataMall',
      message: error?.message || 'Network error'
    });
  }
}

/**
 * Status check endpoint to see if credentials are configured
 * GET /api/lta/status
 */
export async function handleLtaStatus(_req: Request, res: Response): Promise<void> {
  const accountKey = getAccountKey();
  res.json({
    configured: Boolean(accountKey),
    endpoints: [
      '/api/lta/bus-arrival?busStopCode=83139',
      '/api/lta/carparks',
      '/api/lta/traffic-incidents',
      '/api/lta/train-alerts'
    ]
  });
}
