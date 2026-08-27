import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import {
  handleBusArrival,
  handleCarParkAvailability,
  handleTrafficIncidents,
  handleTrainServiceAlerts,
  handleLtaStatus
} from './api/lta';
import { handleOneMapSearch, handleOneMapRoute } from './api/onemap';
import { handleWeatherNowcast, handleWeatherRainfall } from './api/weather';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // LTA DataMall API proxy routes (Guardrail: Credential read strictly inside api/)
  app.get('/api/lta/status', handleLtaStatus);
  app.get('/api/lta/bus-arrival', handleBusArrival);
  app.get('/api/lta/carparks', handleCarParkAvailability);
  app.get('/api/lta/traffic-incidents', handleTrafficIncidents);
  app.get('/api/lta/train-alerts', handleTrainServiceAlerts);

  // OneMap SLA API routes
  app.get('/api/onemap/search', handleOneMapSearch);
  app.get('/api/onemap/route', handleOneMapRoute);

  // Singapore Weather API routes (NEA / data.gov.sg)
  app.get('/api/weather/nowcast', handleWeatherNowcast);
  app.get('/api/weather/rainfall', handleWeatherRainfall);

  // Healthcheck endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Vite development middleware or production static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AETHER QUANT] Backend server live on http://0.0.0.0:${PORT}`);
  });
}

startServer();
