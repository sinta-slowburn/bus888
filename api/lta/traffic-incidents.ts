import type { Request, Response } from 'express';
import { handleTrafficIncidents } from '../lta';

export default async function handler(req: Request, res: Response) {
  return handleTrafficIncidents(req, res);
}
