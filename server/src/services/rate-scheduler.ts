import { fetchRatesFromProvider, storeRates, fetchGoldPrice } from './exchange-rate.service';

let schedulerInterval: NodeJS.Timeout | null = null;

/**
 * Environment variable documentation:
 *
 * EXCHANGE_RATE_API_KEY (required)
 *   - API key for exchange rate provider (open.er-api.com)
 *   - Example: "your_api_key_here"
 *
 * EXCHANGE_RATE_BASE_URL (optional)
 *   - Base URL for exchange rate API
 *   - Default: "https://open.er-api.com/v6"
 *   - Example: "https://api.exchangerate-api.com/v4"
 *
 * Gold price is fetched from goldprice.org (free, no API key required)
 *
 * RATE_FETCH_INTERVAL (optional)
 *   - Interval between rate fetches in milliseconds
 *   - Default: 21600000 (6 hours)
 *   - Example: "3600000" (1 hour), "86400000" (24 hours)
 */

/**
 * Starts the rate scheduler: fetches immediately, then at RATE_FETCH_INTERVAL
 * Handles failures gracefully - logs errors and retains existing rates
 */
export async function startRateScheduler(): Promise<void> {
  const intervalMs = getInterval();

  console.log(`📊 Rate scheduler starting (interval: ${(intervalMs / 1000 / 3600).toFixed(1)} hours)`);

  // Fetch rates immediately on startup
  await performRateFetch();

  // Set up recurring fetch
  schedulerInterval = setInterval(async () => {
    await performRateFetch();
  }, intervalMs);

  console.log('✓ Rate scheduler ready');
}

/**
 * Stops the rate scheduler
 */
export function stopRateScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('✓ Rate scheduler stopped');
  }
}

/**
 * Performs a single rate fetch cycle
 * Fetches forex rates + gold price, handles failures gracefully
 */
async function performRateFetch(): Promise<void> {
  try {
    console.log('🔄 Fetching exchange rates...');

    // Fetch and store forex rates
    const rates = await fetchRatesFromProvider();
    const storedCount = await storeRates(rates);
    console.log(`✓ Stored ${storedCount} exchange rates`);

    // Fetch and store gold price
    await fetchGoldPrice();
  } catch (error) {
    console.error('❌ Failed to fetch rates:', error instanceof Error ? error.message : String(error));
    console.log('💾 Retaining existing rates from database');
  }
}

/**
 * Gets the fetch interval in milliseconds
 * Reads RATE_FETCH_INTERVAL env var, defaults to 6 hours (21600000ms)
 */
function getInterval(): number {
  const envInterval = process.env.RATE_FETCH_INTERVAL;
  if (envInterval) {
    const parsed = parseInt(envInterval, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 6 * 60 * 60 * 1000; // 6 hours default
}
