import type { Request, Response } from 'express';
import { handleTrainServiceAlerts } from '../../server/lta';

export default async function handler(req: Request, res: Response) {
  return handleTrainServiceAlerts(req, res);
}
