import type { Request, Response } from 'express';
import { handleBusArrival } from '../../server/lta';

export default async function handler(req: Request, res: Response) {
  return handleBusArrival(req, res);
}
