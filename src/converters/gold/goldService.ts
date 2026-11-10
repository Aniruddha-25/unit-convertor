import { isGoldCacheFresh, parseGoldResponse, parseGoldSnapshot, type GoldSnapshot } from './goldMath.ts'

/**
 * gold-api.com: free, keyless, CORS-enabled spot gold (XAU) in USD per troy ounce, with the provider's
 * own `updatedAt` timestamp. No secret is needed, so nothing sensitive ships in the bundle.
 */
export const GOLD_URL = 'https://api.gold-api.com/price/XAU'
const CACHE_KEY = 'unit-converter:gold-spot:v1'
const TIMEOUT_MS = 10_000

export function readGoldCache(): GoldSnapshot | null {
  try {
    const text = localStorage.getItem(CACHE_KEY)
    return text ? parseGoldSnapshot(JSON.parse(text)) : null
  } catch {
    return null
  }
}

function writeGoldCache(s: GoldSnapshot): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(s))
  } catch {
    /* best-effort */
  }
}

/** Always hits the network. Rejects on timeout, HTTP error, offline, or an unusable payload. */
export async function fetchGold(signal?: AbortSignal): Promise<GoldSnapshot> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  const onAbort = () => controller.abort()
  signal?.addEventListener('abort', onAbort)
  try {
    const res = await fetch(GOLD_URL, { signal: controller.signal, cache: 'no-store' })
    if (!res.ok) throw new Error(`The gold price service responded with HTTP ${res.status}.`)
    const snapshot = parseGoldResponse(await res.json(), Date.now())
    writeGoldCache(snapshot)
    return snapshot
  } catch (e) {
    if (signal?.aborted) throw e
    if (controller.signal.aborted) throw new Error('The gold price service timed out.', { cause: e })
    if (e instanceof TypeError) throw new Error('Could not reach the gold price service (offline?).', { cause: e })
    throw e
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

export function freshGoldCache(now = Date.now()): GoldSnapshot | null {
  const cached = readGoldCache()
  return cached && isGoldCacheFresh(cached, now) ? cached : null
}
