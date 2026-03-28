import { prisma } from '../utils/prisma';
import { Decimal } from '@prisma/client/runtime/library';

interface RateData {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
}

interface ExternalRateResponse {
  rates: Record<string, number>;
  base: string;
}

/**
 * Fetches exchange rates from external API (USD-based)
 * Returns all rates relative to USD
 */
export async function fetchRatesFromProvider(): Promise<RateData[]> {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  const baseUrl = process.env.EXCHANGE_RATE_BASE_URL || 'https://open.er-api.com/v6';

  if (!apiKey) {
    throw new Error('EXCHANGE_RATE_API_KEY environment variable is not set');
  }

  try {
    const response = await fetch(`${baseUrl}/latest/USD?apikey=${apiKey}`);
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = (await response.json()) as ExternalRateResponse;

    // Validate API response structure
    if (!data.rates || typeof data.rates !== 'object') {
      throw new Error('Invalid API response: missing rates object');
    }

    const rates: RateData[] = [];

    // Store USD base rates
    for (const [currency, rate] of Object.entries(data.rates)) {
      if (typeof rate === 'number' && rate > 0) {
        rates.push({
          fromCurrency: 'USD',
          toCurrency: currency,
          rate,
        });
      }
    }

    return rates;
  } catch (error) {
    throw new Error(`Failed to fetch exchange rates: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Stores rates in the database with validation
 * Rejects rates <= 0 and anomalies (>50% change from previous)
 */
export async function storeRates(rates: RateData[]): Promise<number> {
  const now = new Date();
  let storedCount = 0;

  for (const rate of rates) {
    try {
      // Validate rate is positive
      if (rate.rate <= 0) {
        console.warn(`Rejected rate: ${rate.fromCurrency}/${rate.toCurrency} = ${rate.rate} (not positive)`);
        continue;
      }

      // Check for anomalies (>50% change)
      const previousRate = await prisma.exchangeRate.findFirst({
        where: {
          fromCurrency: rate.fromCurrency,
          toCurrency: rate.toCurrency,
          source: 'auto',
        },
        orderBy: { fetchedAt: 'desc' },
      });

      if (previousRate) {
        const prevValue = previousRate.rate.toNumber();
        const percentChange = Math.abs((rate.rate - prevValue) / prevValue);
        if (percentChange > 0.5) {
          console.warn(
            `Rejected rate: ${rate.fromCurrency}/${rate.toCurrency} (${(percentChange * 100).toFixed(1)}% change, threshold 50%)`
          );
          continue;
        }
      }

      // Store the rate
      await prisma.exchangeRate.create({
        data: {
          fromCurrency: rate.fromCurrency,
          toCurrency: rate.toCurrency,
          rate: new Decimal(rate.rate),
          fetchedAt: now,
          source: 'auto',
        },
      });

      storedCount++;
    } catch (error) {
      console.error(`Error storing rate ${rate.fromCurrency}/${rate.toCurrency}:`, error);
    }
  }

  return storedCount;
}

interface GoldApiResponse {
  name: string;
  price: number;
  symbol: string;
  updatedAt: string;
}

/**
 * Fetches gold price from gold-api.com (free, no API key required)
 * Returns USD per troy ounce, converts to EGP/gram
 * Stores as GOLD_GRAM → EGP exchange rate
 */
export async function fetchGoldPrice(): Promise<void> {
  try {
    const response = await fetch('https://api.gold-api.com/price/XAU');
    if (!response.ok) {
      throw new Error(`Gold price API returned status ${response.status}`);
    }

    const data = (await response.json()) as GoldApiResponse;

    if (!data.price || data.price <= 0) {
      throw new Error('Invalid gold price response: missing or invalid price');
    }

    const usdPerOz = data.price;

    // Get USD to EGP rate
    const usdToEgpResult = await getLatestRate('USD', 'EGP');
    if (!usdToEgpResult) {
      console.warn('Cannot fetch gold price: USD/EGP rate not available');
      return;
    }

    // Convert USD/oz to EGP/gram: (USDperOz / 31.1035) × rate(USD→EGP)
    const egpPerGram = (usdPerOz / 31.1035) * usdToEgpResult.rate;

    const now = new Date();
    await prisma.exchangeRate.create({
      data: {
        fromCurrency: 'GOLD_GRAM',
        toCurrency: 'EGP',
        rate: new Decimal(egpPerGram),
        fetchedAt: now,
        source: 'auto',
      },
    });

    console.log(`Gold price updated: ${egpPerGram.toFixed(2)} EGP/gram (source: ${usdPerOz.toFixed(2)} USD/oz)`);
  } catch (error) {
    console.error('Failed to fetch gold price:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Gets the latest exchange rate between two currencies with metadata
 * Priority: manual override > auto rate > cross-rate via USD
 */
export async function getLatestRate(
  from: string,
  to: string
): Promise<{ rate: number; isDirect: boolean } | null> {
  if (from === to) return { rate: 1, isDirect: true };

  // 1. Check for manual override
  const manualRate = await prisma.exchangeRate.findFirst({
    where: {
      fromCurrency: from,
      toCurrency: to,
      source: 'manual',
    },
    orderBy: { fetchedAt: 'desc' },
  });

  if (manualRate) {
    return { rate: manualRate.rate.toNumber(), isDirect: true };
  }

  // 2. Check for direct auto rate
  const directRate = await prisma.exchangeRate.findFirst({
    where: {
      fromCurrency: from,
      toCurrency: to,
      source: 'auto',
    },
    orderBy: { fetchedAt: 'desc' },
  });

  if (directRate) {
    return { rate: directRate.rate.toNumber(), isDirect: true };
  }

  // 3. Try reverse rate (to/from) and invert
  const reverseRate = await prisma.exchangeRate.findFirst({
    where: {
      fromCurrency: to,
      toCurrency: from,
      source: 'auto',
    },
    orderBy: { fetchedAt: 'desc' },
  });

  if (reverseRate) {
    return { rate: 1 / reverseRate.rate.toNumber(), isDirect: false };
  }

  // 4. Cross-rate via USD
  // If neither from nor to is USD, compute: (from→USD) × (USD→to)
  if (from !== 'USD' && to !== 'USD') {
    let fromToUsd = await prisma.exchangeRate.findFirst({
      where: {
        fromCurrency: from,
        toCurrency: 'USD',
        source: 'auto',
      },
      orderBy: { fetchedAt: 'desc' },
    });

    // Try inverse if direct lookup fails
    let fromToUsdInverted = false;
    if (!fromToUsd) {
      const usdToFrom = await prisma.exchangeRate.findFirst({
        where: {
          fromCurrency: 'USD',
          toCurrency: from,
          source: 'auto',
        },
        orderBy: { fetchedAt: 'desc' },
      });
      if (usdToFrom) {
        fromToUsd = usdToFrom;
        fromToUsdInverted = true;
      }
    }

    let usdToTo = await prisma.exchangeRate.findFirst({
      where: {
        fromCurrency: 'USD',
        toCurrency: to,
        source: 'auto',
      },
      orderBy: { fetchedAt: 'desc' },
    });

    // Try inverse if direct lookup fails
    let usdToToInverted = false;
    if (!usdToTo) {
      const toToUsd = await prisma.exchangeRate.findFirst({
        where: {
          fromCurrency: to,
          toCurrency: 'USD',
          source: 'auto',
        },
        orderBy: { fetchedAt: 'desc' },
      });
      if (toToUsd) {
        usdToTo = toToUsd;
        usdToToInverted = true;
      }
    }

    if (fromToUsd && usdToTo) {
      let rate = fromToUsd.rate.mul(usdToTo.rate).toNumber();
      if (fromToUsdInverted) {
        rate = 1 / rate;
      }
      if (usdToToInverted) {
        rate = 1 / rate;
      }
      return { rate, isDirect: false };
    }
  }

  // 5. If from is USD, look for USD→to
  if (from === 'USD') {
    const rate = await prisma.exchangeRate.findFirst({
      where: {
        fromCurrency: 'USD',
        toCurrency: to,
        source: 'auto',
      },
      orderBy: { fetchedAt: 'desc' },
    });
    return rate ? { rate: rate.rate.toNumber(), isDirect: true } : null;
  }

  // 6. If to is USD, invert from→USD
  if (to === 'USD') {
    const rate = await prisma.exchangeRate.findFirst({
      where: {
        fromCurrency: from,
        toCurrency: 'USD',
        source: 'auto',
      },
      orderBy: { fetchedAt: 'desc' },
    });
    return rate ? { rate: 1 / rate.rate.toNumber(), isDirect: false } : null;
  }

  return null;
}

/**
 * Gets the historical exchange rate closest to a given date
 * Never uses manual overrides (only auto rates)
 */
export async function getHistoricalRate(from: string, to: string, date: Date): Promise<{ rate: number | null; rateDate: Date | null }> {
  if (from === to) {
    return { rate: 1, rateDate: date };
  }

  // Look for direct rate closest to date
  const directRate = await prisma.exchangeRate.findFirst({
    where: {
      fromCurrency: from,
      toCurrency: to,
      source: 'auto',
      fetchedAt: { lte: date },
    },
    orderBy: { fetchedAt: 'desc' },
  });

  if (directRate) {
    return { rate: directRate.rate.toNumber(), rateDate: directRate.fetchedAt };
  }

  // Try reverse and invert
  const reverseRate = await prisma.exchangeRate.findFirst({
    where: {
      fromCurrency: to,
      toCurrency: from,
      source: 'auto',
      fetchedAt: { lte: date },
    },
    orderBy: { fetchedAt: 'desc' },
  });

  if (reverseRate) {
    return { rate: 1 / reverseRate.rate.toNumber(), rateDate: reverseRate.fetchedAt };
  }

  // Cross-rate via USD
  if (from !== 'USD' && to !== 'USD') {
    const [fromToUsd, usdToTo] = await Promise.all([
      prisma.exchangeRate.findFirst({
        where: {
          fromCurrency: from,
          toCurrency: 'USD',
          source: 'auto',
          fetchedAt: { lte: date },
        },
        orderBy: { fetchedAt: 'desc' },
      }),
      prisma.exchangeRate.findFirst({
        where: {
          fromCurrency: 'USD',
          toCurrency: to,
          source: 'auto',
          fetchedAt: { lte: date },
        },
        orderBy: { fetchedAt: 'desc' },
      }),
    ]);

    if (fromToUsd && usdToTo) {
      return {
        rate: fromToUsd.rate.toNumber() * usdToTo.rate.toNumber(),
        rateDate: fromToUsd.fetchedAt > usdToTo.fetchedAt ? fromToUsd.fetchedAt : usdToTo.fetchedAt,
      };
    }
  }

  return { rate: null, rateDate: null };
}

/**
 * Converts an amount from one currency to another
 * Uses latest rate by default, or historical rate if date is provided
 */
export async function convertAmount(
  amount: number,
  from: string,
  to: string,
  date?: Date
): Promise<{ convertedAmount: number; rate: number; isApproximate: boolean; rateDate?: Date }> {
  if (amount < 0) {
    throw new Error('Amount must be non-negative');
  }

  if (from === to) {
    return { convertedAmount: amount, rate: 1, isApproximate: false };
  }

  let rate: number | null = null;
  let rateDate: Date | undefined;
  let isApproximate = false;

  if (date) {
    // Use historical rate
    const result = await getHistoricalRate(from, to, date);
    rate = result.rate;
    rateDate = result.rateDate || undefined;
    isApproximate = !result.rateDate || result.rateDate.getTime() !== date.getTime();
  } else {
    // Use latest rate
    const result = await getLatestRate(from, to);
    if (result) {
      rate = result.rate;
      isApproximate = !result.isDirect;
    }
  }

  if (!rate) {
    throw new Error(`Exchange rate not available for ${from}/${to}`);
  }

  return {
    convertedAmount: amount * rate,
    rate,
    isApproximate,
    rateDate,
  };
}
