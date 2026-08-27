import type { Request, Response } from 'express';
import { handleLtaStatus } from '../lta';

export default async function handler(req: Request, res: Response) {
  return handleLtaStatus(req, res);
}
