import type { Request, Response } from 'express';
import { handleOneMapSearch } from '../onemap';

export default async function handler(req: Request, res: Response) {
  return handleOneMapSearch(req, res);
}
