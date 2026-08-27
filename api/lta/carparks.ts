import type { Request, Response } from 'express';
import { handleCarParkAvailability } from '../../server/lta';

export default async function handler(req: Request, res: Response) {
  return handleCarParkAvailability(req, res);
}
