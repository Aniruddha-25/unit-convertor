import { createFeed } from '../shared/feed.ts'
import { isCacheFresh, parseSnapshot, snapshotFromProvider } from './currencyMath.ts'

/**
 * open.er-api.com: free, keyless, CORS-enabled, ~160 currencies, and reports the provider's own
 * update timestamps. No secret is needed, so nothing sensitive ships in the bundle. If you swap in a
 * keyed provider, proxy it server-side: any VITE_* variable is public in the built JS.
 * Terms require attribution (shown in the UI): https://www.exchangerate-api.com/docs/free
 */
export const RATES_URL = 'https://open.er-api.com/v6/latest/USD'

const rates = createFeed({
  url: RATES_URL,
  cacheKey: 'unit-converter:currency-rates:v1',
  serviceName: 'rate service',
  parseResponse: snapshotFromProvider,
  parseStored: parseSnapshot,
  isFresh: isCacheFresh,
})

export const fetchRates = rates.fetch
export const readCache = rates.readCache
export const freshCache = rates.freshCache
