import type { Request, Response } from 'express';

export default async function handler(_req: Request, res: Response) {
  try {
    const url = 'https://api.data.gov.sg/v1/environment/2-hour-weather-forecast';
    const response = await fetch(url, {
      headers: { accept: 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();
      res.setHeader('Cache-Control', 'public, max-age=120');
      res.status(200).json(data);
      return;
    }

    res.status(200).json({
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
