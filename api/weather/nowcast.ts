import type { Request, Response } from 'express';
import { handleWeatherNowcast } from '../../server/weather';

export default async function handler(req: Request, res: Response) {
  return handleWeatherNowcast(req, res);
}
