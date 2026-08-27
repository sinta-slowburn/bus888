import type { Request, Response } from 'express';
import { handleWeatherRainfall } from '../weather';

export default async function handler(req: Request, res: Response) {
  return handleWeatherRainfall(req, res);
}
