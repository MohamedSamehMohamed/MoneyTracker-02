import express, { Router, Request, Response } from 'express';

const router: Router = express.Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export default router;
