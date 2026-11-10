const TIMEOUT_MS = 10_000

export interface FeedOptions<T> {
  url: string
  /** localStorage key for the last good copy */
  cacheKey: string
  /** Used in error messages, e.g. "rate service" or "gold price service". */
  serviceName: string
  /** Turn the provider's JSON into T (throw on an unusable payload). */
  parseResponse: (json: unknown, fetchedAt: number) => T
  /** Validate untrusted stored JSON into T, or null. */
  parseStored: (raw: unknown) => T | null
  isFresh: (data: T, now: number) => boolean
}

export interface Feed<T> {
  /** Always hits the network; rejects with a readable error on timeout, HTTP error, offline or a bad payload. */
  fetch: (signal?: AbortSignal) => Promise<T>
  readCache: () => T | null
  /** A stored copy young enough to reuse on load without a request. */
  freshCache: (now?: number) => T | null
}

/** One fetch-with-timeout + localStorage cache implementation for every live feed. */
export function createFeed<T>(o: FeedOptions<T>): Feed<T> {
  const readCache = (): T | null => {
    try {
      const text = localStorage.getItem(o.cacheKey)
      return text ? o.parseStored(JSON.parse(text)) : null
    } catch {
      return null
    }
  }

  const writeCache = (data: T): void => {
    try {
      localStorage.setItem(o.cacheKey, JSON.stringify(data))
    } catch {
      /* storage unavailable or full: caching is best-effort */
    }
  }

  async function fetchFeed(signal?: AbortSignal): Promise<T> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const onAbort = () => controller.abort()
    signal?.addEventListener('abort', onAbort)
    try {
      const res = await fetch(o.url, { signal: controller.signal, cache: 'no-store' })
      if (!res.ok) throw new Error(`The ${o.serviceName} responded with HTTP ${res.status}.`)
      const data = o.parseResponse(await res.json(), Date.now())
      writeCache(data)
      return data
    } catch (e) {
      if (signal?.aborted) throw e
      if (controller.signal.aborted) throw new Error(`The ${o.serviceName} timed out.`, { cause: e })
      if (e instanceof TypeError) throw new Error(`Could not reach the ${o.serviceName} (offline?).`, { cause: e })
      if (e instanceof SyntaxError) throw new Error(`The ${o.serviceName} returned an unreadable response.`, { cause: e })
      throw e
    } finally {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
    }
  }

  return {
    fetch: fetchFeed,
    readCache,
    freshCache: (now = Date.now()) => {
      const cached = readCache()
      return cached && o.isFresh(cached, now) ? cached : null
    },
  }
}
