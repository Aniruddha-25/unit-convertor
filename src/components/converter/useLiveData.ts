import { useCallback, useEffect, useRef, useState } from 'react'
import { nextRefreshAt, rateStatus } from '../../converters/currency/currencyMath.ts'
import { fetchRates, freshCache, readCache } from '../../converters/currency/exchangeRateService.ts'
import type { RateSnapshot, RateSource, RateStatus } from '../../converters/currency/types.ts'
import { goldNextRefreshAt, goldStatus, type GoldSnapshot } from '../../converters/gold/goldMath.ts'
import { fetchGold, freshGoldCache, readGoldCache } from '../../converters/gold/goldService.ts'

const TICK_MS = 30_000
const RETRY_AFTER_FAILURE_MS = 2 * 60_000

/** Everything that differs between the live feeds; the loading/caching/refresh behaviour is shared. */
interface Feed<T> {
  fetch: (signal: AbortSignal) => Promise<T>
  readCache: () => T | null
  /** A stored copy young enough to reuse on load without a request. */
  freshCache: () => T | null
  status: (data: T, source: RateSource, now: number) => RateStatus
  nextRefreshAt: (data: T) => number
  failureMessage: string
}

export interface LiveData<T> {
  snapshot: T | null
  status: RateStatus | null
  loading: boolean
  error: string | null
  refresh: () => void
}

interface State<T> {
  snapshot: T | null
  source: RateSource
  loading: boolean
  error: string | null
  lastAttempt: number
}

const ratesFeed: Feed<RateSnapshot> = {
  fetch: fetchRates,
  readCache,
  freshCache: () => freshCache(),
  status: rateStatus,
  nextRefreshAt,
  failureMessage: 'Could not load exchange rates.',
}

const goldFeed: Feed<GoldSnapshot> = {
  fetch: fetchGold,
  readCache: readGoldCache,
  freshCache: () => freshGoldCache(),
  status: goldStatus,
  nextRefreshAt: goldNextRefreshAt,
  failureMessage: 'Could not load the gold price.',
}

/**
 * Loads on mount (reusing a recent stored copy), refreshes on the feed's schedule while open, and
 * supports manual refresh. After a failure the last good data stays visible but is never "live".
 */
function useLiveData<T>(feed: Feed<T>): LiveData<T> {
  const [state, setState] = useState<State<T>>(() => {
    const fresh = feed.freshCache()
    return { snapshot: fresh, source: 'cache', loading: fresh === null, error: null, lastAttempt: fresh ? Date.now() : 0 }
  })
  const [now, setNow] = useState(() => Date.now())
  const inFlight = useRef<AbortController | null>(null)

  const load = useCallback(() => {
    if (inFlight.current) return
    const controller = new AbortController()
    inFlight.current = controller
    setState((s) => ({ ...s, loading: true, lastAttempt: Date.now() }))
    feed
      .fetch(controller.signal)
      .then((snapshot) => setState({ snapshot, source: 'network', loading: false, error: null, lastAttempt: Date.now() }))
      .catch((e: unknown) => {
        if (controller.signal.aborted) return
        const message = e instanceof Error ? e.message : feed.failureMessage
        setState((s) => ({ ...s, snapshot: s.snapshot ?? feed.readCache(), source: 'cache', loading: false, error: message, lastAttempt: Date.now() }))
      })
      .finally(() => {
        if (inFlight.current === controller) inFlight.current = null
      })
  }, [feed])

  useEffect(() => {
    if (state.snapshot === null) load()
    return () => {
      inFlight.current?.abort()
      inFlight.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, [])

  // Clock tick: keeps the status label honest and triggers scheduled refreshes.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(id)
  }, [])

  const due = state.snapshot ? feed.nextRefreshAt(state.snapshot) : null
  useEffect(() => {
    if (state.loading || !state.snapshot || due === null) return
    const retryOk = state.error === null || now - state.lastAttempt >= RETRY_AFTER_FAILURE_MS
    if (now >= due && retryOk) load()
  }, [now, due, state.loading, state.snapshot, state.error, state.lastAttempt, load])

  const status = state.snapshot ? feed.status(state.snapshot, state.source, now) : null
  return { snapshot: state.snapshot, status, loading: state.loading, error: state.error, refresh: load }
}

export const useExchangeRates = () => useLiveData(ratesFeed)
export const useGoldPrice = () => useLiveData(goldFeed)
