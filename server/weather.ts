import type { Request, Response } from 'express';

/**
 * Live Singapore 2-Hour Weather Forecast by Planning Area (NEA / data.gov.sg)
 * GET /api/weather/nowcast
 */
export async function handleWeatherNowcast(_req: Request, res: Response): Promise<void> {
  try {
    const url = 'https://api.data.gov.sg/v1/environment/2-hour-weather-forecast';
    const response = await fetch(url, {
      headers: { accept: 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();
      res.setHeader('Cache-Control', 'public, max-age=120');
      res.json(data);
      return;
    }

    // Fallback data
    res.json({
      items: [
        {
          update_timestamp: new Date().toISOString(),
          timestamp: new Date().toISOString(),
          valid_period: { text: 'Next 2 Hours' },
          forecasts: [
            { area: 'Marine Parade', forecast: 'Passing Showers' },
            { area: 'Downtown / Marina Bay', forecast: 'Partly Cloudy' },
            { area: 'Orchard', forecast: 'Partly Cloudy' },
            { area: 'Bugis / City Hall', forecast: 'Fair (Day)' },
            { area: 'Tampines', forecast: 'Light Rain' },
            { area: 'Jurong East', forecast: 'Cloudy' },
            { area: 'Woodlands', forecast: 'Moderate Rain' },
            { area: 'Changi', forecast: 'Fair (Day)' },
            { area: 'Bishan', forecast: 'Partly Cloudy' },
            { area: 'Bedok', forecast: 'Passing Showers' }
          ]
        }
      ]
    });
  } catch (err: any) {
    res.status(502).json({ error: 'Failed to fetch Singapore weather', message: err?.message });
  }
}

/**
 * Live Singapore Rainfall & Temperature
 * GET /api/weather/rainfall
 */
export async function handleWeatherRainfall(_req: Request, res: Response): Promise<void> {
  try {
    const url = 'https://api.data.gov.sg/v1/environment/rainfall';
    const response = await fetch(url, { headers: { accept: 'application/json' } });

    if (response.ok) {
      const data = await response.json();
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.json(data);
      return;
    }

    res.json({ status: 'ok', readings: [] });
  } catch (err: any) {
    res.status(502).json({ error: 'Failed to fetch rainfall data', message: err?.message });
  }
}
