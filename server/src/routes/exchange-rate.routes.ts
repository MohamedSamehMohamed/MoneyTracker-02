import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as controller from '../controllers/exchange-rate.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  setOverrideSchema,
  removeOverrideSchema,
  convertQuerySchema,
} from './exchange-rate.schemas';

const router = express.Router();

// Middleware to validate request body/query against Zod schema
const validate = (schema: z.ZodSchema, source: 'body' | 'query' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (source === 'body') {
        const validated = schema.parse(req.body);
        req.body = validated;
      } else {
        const queryData = req.query as Record<string, unknown>;
        const validated = schema.parse(queryData);
        (req.query as unknown) = validated;
      }
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: (error as z.ZodError).issues });
      } else {
        res.status(400).json({ error: 'Invalid request' });
      }
    }
  };
};

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/exchange-rates
 * List all relevant exchange rates for user's accounts
 */
router.get('/', controller.listRates);

/**
 * GET /api/exchange-rates/convert
 * Convert amount from one currency to another
 * Query params: amount, from, to, date (optional)
 */
router.get('/convert', validate(convertQuerySchema, 'query'), controller.convert);

/**
 * POST /api/exchange-rates/fetch
 * Trigger immediate fetch of exchange rates from provider
 */
router.post('/fetch', controller.triggerFetch);

/**
 * PUT /api/exchange-rates/override
 * Set a manual exchange rate override
 * Body: { fromCurrency, toCurrency, rate }
 */
router.put('/override', validate(setOverrideSchema), controller.setOverride);

/**
 * DELETE /api/exchange-rates/override
 * Remove a manual exchange rate override
 * Body: { fromCurrency, toCurrency }
 */
router.delete('/override', validate(removeOverrideSchema), controller.removeOverride);

/**
 * GET /api/exchange-rates/net-worth
 * Get total net worth in user's base currency
 */
router.get('/net-worth', controller.getNetWorth);

export default router;
