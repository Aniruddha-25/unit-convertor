import { createFeed } from '../shared/feed.ts'
import { parseGoldResponse, parseGoldSnapshot } from './goldMath.ts'

/**
 * gold-api.com: free, keyless, CORS-enabled spot gold (XAU) in USD per troy ounce, with the provider's
 * own `updatedAt` timestamp. No secret is needed, so nothing sensitive ships in the bundle.
 */
export const GOLD_URL = 'https://api.gold-api.com/price/XAU'

const gold = createFeed({
  url: GOLD_URL,
  cacheKey: 'unit-converter:gold-spot:v1',
  serviceName: 'gold price service',
  parseResponse: parseGoldResponse,
  parseStored: parseGoldSnapshot,
})

export const fetchGold = gold.fetch
export const readGoldCache = gold.readCache
