import type { Request, Response } from 'express';
import { handleOneMapRoute } from '../../server/onemap';

export default async function handler(req: Request, res: Response) {
  return handleOneMapRoute(req, res);
}
