import { isCacheFresh, parseSnapshot, snapshotFromProvider } from './currencyMath.ts'
import type { RateSnapshot } from './types.ts'

/**
 * open.er-api.com: free, keyless, CORS-enabled, ~160 currencies, and reports the provider's own
 * update timestamps. No secret is needed, so nothing sensitive ships in the bundle. If you swap in a
 * keyed provider, proxy it server-side: any VITE_* variable is public in the built JS.
 * Terms require attribution (shown in the UI): https://www.exchangerate-api.com/docs/free
 */
export const RATES_URL = 'https://open.er-api.com/v6/latest/USD'
const CACHE_KEY = 'unit-converter:currency-rates:v1'
const TIMEOUT_MS = 10_000

export function readCache(): RateSnapshot | null {
  try {
    const text = localStorage.getItem(CACHE_KEY)
    return text ? parseSnapshot(JSON.parse(text)) : null
  } catch {
    return null
  }
}

function writeCache(snapshot: RateSnapshot): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot))
  } catch {
    /* storage unavailable or full: caching is best-effort */
  }
}

/** Always hits the network. Rejects on timeout, HTTP error, offline, or an unusable payload. */
export async function fetchRates(signal?: AbortSignal): Promise<RateSnapshot> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  const onAbort = () => controller.abort()
  signal?.addEventListener('abort', onAbort)
  try {
    const res = await fetch(RATES_URL, { signal: controller.signal, cache: 'no-store' })
    if (!res.ok) throw new Error(`The rate service responded with HTTP ${res.status}.`)
    const snapshot = snapshotFromProvider(await res.json(), Date.now())
    writeCache(snapshot)
    return snapshot
  } catch (e) {
    if (signal?.aborted) throw e
    if (controller.signal.aborted) throw new Error('The rate service timed out.', { cause: e })
    if (e instanceof TypeError) throw new Error('Could not reach the rate service (offline?).', { cause: e })
    throw e
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

/** A stored snapshot young enough to reuse on load without spending a request. */
export function freshCache(now = Date.now()): RateSnapshot | null {
  const cached = readCache()
  return cached && isCacheFresh(cached, now) ? cached : null
}
