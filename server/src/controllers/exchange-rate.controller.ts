import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import {
  fetchRatesFromProvider,
  storeRates,
  getLatestRate,
  convertAmount,
  fetchGoldPrice,
} from '../services/exchange-rate.service';
import { SetOverrideInput, RemoveOverrideInput, ConvertQueryInput } from '../routes/exchange-rate.schemas';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * GET /api/exchange-rates
 * List all exchange rates relevant to user's accounts
 */
export async function listRates(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get user's accounts to find unique currencies
    const accounts = await prisma.account.findMany({
      where: { userId },
      select: { currency: true },
    });

    const currencies = Array.from(new Set(accounts.map((a) => a.currency)));
    const baseCurrency = (
      await prisma.user.findUnique({
        where: { id: userId },
        select: { baseCurrency: true },
      })
    )?.baseCurrency || 'EGP';

    // Fetch latest rates for each currency pair relative to baseCurrency
    const rates = [];

    for (const currency of currencies) {
      if (currency === baseCurrency) continue;

      const rateResult = await getLatestRate(currency, baseCurrency);
      if (rateResult !== null) {
        const rateRecord = await prisma.exchangeRate.findFirst({
          where: {
            fromCurrency: currency,
            toCurrency: baseCurrency,
          },
          orderBy: { fetchedAt: 'desc' },
        });

        if (rateRecord) {
          rates.push({
            fromCurrency: currency,
            toCurrency: baseCurrency,
            rate: rateResult.rate.toString(),
            source: rateRecord.source,
            fetchedAt: rateRecord.fetchedAt.toISOString(),
          });
        }
      }
    }

    // Include gold rate if user has gold accounts
    const hasGold = accounts.some((a) => a.currency === 'GOLD_GRAM');
    if (hasGold && baseCurrency !== 'GOLD_GRAM') {
      const goldRateResult = await getLatestRate('GOLD_GRAM', baseCurrency);
      if (goldRateResult !== null) {
        const goldRecord = await prisma.exchangeRate.findFirst({
          where: {
            fromCurrency: 'GOLD_GRAM',
            toCurrency: baseCurrency,
          },
          orderBy: { fetchedAt: 'desc' },
        });

        if (goldRecord) {
          rates.push({
            fromCurrency: 'GOLD_GRAM',
            toCurrency: baseCurrency,
            rate: goldRateResult.rate.toString(),
            source: goldRecord.source,
            fetchedAt: goldRecord.fetchedAt.toISOString(),
          });
        }
      }
    }

    const lastUpdated = rates.length > 0 ? new Date(Math.max(...rates.map((r) => new Date(r.fetchedAt).getTime()))) : new Date();

    res.json({
      rates,
      baseCurrency,
      lastUpdated: lastUpdated.toISOString(),
    });
  } catch (error) {
    console.error('Error listing rates:', error);
    res.status(500).json({ error: 'Failed to list exchange rates' });
  }
}

/**
 * GET /api/exchange-rates/convert
 * Convert amount from one currency to another
 */
export async function convert(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { amount: amountStr, from, to, date: dateStr } = req.query as unknown as ConvertQueryInput;
    const amount = parseFloat(amountStr);
    const date = dateStr ? new Date(dateStr) : undefined;

    if (isNaN(amount) || amount < 0) {
      res.status(400).json({ error: 'Invalid amount' });
      return;
    }

    const result = await convertAmount(amount, from, to, date);

    res.json({
      from,
      to,
      originalAmount: amount.toString(),
      convertedAmount: result.convertedAmount.toString(),
      rate: result.rate.toString(),
      rateDate: result.rateDate?.toISOString(),
      isApproximate: result.isApproximate,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('Exchange rate not available')) {
      res.status(404).json({ error: message });
    } else {
      console.error('Error converting amount:', error);
      res.status(500).json({ error: 'Failed to convert amount' });
    }
  }
}

/**
 * POST /api/exchange-rates/fetch
 * Trigger immediate fetch of exchange rates
 */
export async function triggerFetch(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const rates = await fetchRatesFromProvider();
      const count = await storeRates(rates);

      // Also try to fetch gold price
      try {
        await fetchGoldPrice();
      } catch {
        // Gold fetch is optional
      }

      res.json({
        message: 'Exchange rates updated',
        ratesUpdated: count,
        fetchedAt: new Date().toISOString(),
      });
    } catch (fetchError) {
      // Provider failure: return 503 with lastFetchedAt
      const lastRate = await prisma.exchangeRate.findFirst({
        orderBy: { fetchedAt: 'desc' },
        select: { fetchedAt: true },
      });

      res.status(503).json({
        error: 'Failed to fetch from provider',
        message: fetchError instanceof Error ? fetchError.message : String(fetchError),
        lastFetchedAt: lastRate?.fetchedAt.toISOString() || null,
      });
    }
  } catch (error) {
    console.error('Error triggering fetch:', error);
    res.status(500).json({ error: 'Failed to trigger fetch' });
  }
}

/**
 * PUT /api/exchange-rates/override
 * Set a manual exchange rate override
 */
export async function setOverride(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { fromCurrency, toCurrency, rate: rateStr } = req.body as SetOverrideInput;
    const rate = parseFloat(rateStr);

    if (isNaN(rate) || rate <= 0) {
      res.status(400).json({ error: 'Rate must be a positive number' });
      return;
    }

    const now = new Date();
    await prisma.exchangeRate.create({
      data: {
        fromCurrency,
        toCurrency,
        rate: new Decimal(rate),
        fetchedAt: now,
        source: 'manual',
      },
    });

    res.json({
      message: 'Override set successfully',
      fromCurrency,
      toCurrency,
      rate: rate.toString(),
      setAt: now.toISOString(),
    });
  } catch (error) {
    console.error('Error setting override:', error);
    res.status(500).json({ error: 'Failed to set override' });
  }
}

/**
 * DELETE /api/exchange-rates/override
 * Remove a manual exchange rate override
 */
export async function removeOverride(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { fromCurrency, toCurrency } = req.body as RemoveOverrideInput;

    // Find and delete the most recent manual override
    const override = await prisma.exchangeRate.findFirst({
      where: {
        fromCurrency,
        toCurrency,
        source: 'manual',
      },
      orderBy: { fetchedAt: 'desc' },
    });

    if (!override) {
      res.status(404).json({ error: 'Override not found' });
      return;
    }

    await prisma.exchangeRate.delete({
      where: { id: override.id },
    });

    res.json({
      message: 'Override removed successfully',
      fromCurrency,
      toCurrency,
    });
  } catch (error) {
    console.error('Error removing override:', error);
    res.status(500).json({ error: 'Failed to remove override' });
  }
}

/**
 * GET /api/exchange-rates/net-worth
 * Get total net worth aggregated across all user accounts in base currency
 */
export async function getNetWorth(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { baseCurrency: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const baseCurrency = user.baseCurrency;
    const accounts = await prisma.account.findMany({
      where: { userId },
    });

    const breakdown = [];
    let totalNetWorth = 0;
    let lastRateUpdate = new Date(0);

    for (const account of accounts) {
      const divisor = account.currency === 'GOLD_GRAM' ? 1000 : 100;
      const balance = Number(account.balance) / divisor; // Convert from smallest unit

      let convertedBalance = balance;
      let rate = 1;
      let isApproximate = false;

      if (account.currency !== baseCurrency) {
        if (account.type === 'gold' && account.currency === 'GOLD_GRAM') {
          // Gold: convert grams → EGP → baseCurrency
          const gramToEgpResult = await getLatestRate('GOLD_GRAM', 'EGP');
          if (gramToEgpResult) {
            const gramToEgp = gramToEgpResult.rate;
            const egpAmount = balance * gramToEgp;
            if (baseCurrency !== 'EGP') {
              const egpToBaseResult = await getLatestRate('EGP', baseCurrency);
              if (egpToBaseResult) {
                const egpToBase = egpToBaseResult.rate;
                convertedBalance = egpAmount * egpToBase;
                rate = gramToEgp * egpToBase;
                // Mark as approximate since it's a multi-step conversion
                isApproximate = true;
              } else {
                // No rate found for second step
                isApproximate = true;
              }
            } else {
              convertedBalance = egpAmount;
              rate = gramToEgp;
            }
          } else {
            // No rate found for gold conversion
            isApproximate = true;
          }
        } else {
          // Regular currency conversion
          const conversionRateResult = await getLatestRate(account.currency, baseCurrency);
          if (conversionRateResult) {
            const conversionRate = conversionRateResult.rate;
            convertedBalance = balance * conversionRate;
            rate = conversionRate;
            // Mark as approximate if rate is derived (not direct)
            isApproximate = !conversionRateResult.isDirect;
          } else {
            // No rate available - conversion failed silently
            isApproximate = true;
          }
        }
      }

      // Get the timestamp of the rate used
      const rateRecord = await prisma.exchangeRate.findFirst({
        where: {
          fromCurrency: account.currency,
          toCurrency: baseCurrency,
        },
        orderBy: { fetchedAt: 'desc' },
        select: { fetchedAt: true },
      });

      if (rateRecord && rateRecord.fetchedAt > lastRateUpdate) {
        lastRateUpdate = rateRecord.fetchedAt;
      }

      breakdown.push({
        accountId: account.id,
        accountName: account.name,
        originalCurrency: account.currency,
        originalBalance: balance.toString(),
        convertedBalance: convertedBalance.toString(),
        rate: rate.toString(),
        isApproximate,
      });

      totalNetWorth += convertedBalance;
    }

    res.json({
      baseCurrency,
      totalNetWorth: totalNetWorth.toString(),
      breakdown,
      lastRateUpdate: lastRateUpdate.toISOString(),
    });
  } catch (error) {
    console.error('Error calculating net worth:', error);
    res.status(500).json({ error: 'Failed to calculate net worth' });
  }
}
