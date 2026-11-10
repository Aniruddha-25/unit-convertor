import { useCallback, useEffect, useRef, useState } from 'react'
import { nextRefreshAt, rateStatus } from '../../converters/currency/currencyMath.ts'
import { fetchRates, freshCache, readCache } from '../../converters/currency/exchangeRateService.ts'
import type { RateSnapshot, RateSource, RateStatus } from '../../converters/currency/types.ts'

const TICK_MS = 30_000
const RETRY_AFTER_FAILURE_MS = 2 * 60_000

export interface ExchangeRates {
  snapshot: RateSnapshot | null
  status: RateStatus | null
  loading: boolean
  error: string | null
  /** Epoch ms of the next automatic refresh. */
  nextRefresh: number | null
  refresh: () => void
}

interface State {
  snapshot: RateSnapshot | null
  source: RateSource
  loading: boolean
  error: string | null
  lastAttempt: number
}

function initialState(): State {
  const fresh = freshCache()
  return { snapshot: fresh, source: 'cache', loading: fresh === null, error: null, lastAttempt: fresh ? Date.now() : 0 }
}

/**
 * Loads rates on mount (reusing a <30 min old stored copy), refreshes every 30 min while open,
 * and supports manual refresh. A failed refresh keeps showing the last good data, but it is then
 * labelled Cached (or Outdated) - never Live - and the error is surfaced.
 */
export function useExchangeRates(): ExchangeRates {
  const [state, setState] = useState<State>(initialState)
  const [now, setNow] = useState(() => Date.now())
  const inFlight = useRef<AbortController | null>(null)

  const load = useCallback(() => {
    if (inFlight.current) return
    const controller = new AbortController()
    inFlight.current = controller
    setState((s) => ({ ...s, loading: true, lastAttempt: Date.now() }))
    fetchRates(controller.signal)
      .then((snapshot) => setState({ snapshot, source: 'network', loading: false, error: null, lastAttempt: Date.now() }))
      .catch((e: unknown) => {
        if (controller.signal.aborted) return
        const message = e instanceof Error ? e.message : 'Could not load exchange rates.'
        setState((s) => ({ ...s, snapshot: s.snapshot ?? readCache(), source: 'cache', loading: false, error: message, lastAttempt: Date.now() }))
      })
      .finally(() => {
        if (inFlight.current === controller) inFlight.current = null
      })
  }, [])

  // Initial load when there is no fresh stored copy.
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

  const due = state.snapshot ? nextRefreshAt(state.snapshot) : null
  useEffect(() => {
    if (state.loading || !state.snapshot || due === null) return
    const retryOk = state.error === null || now - state.lastAttempt >= RETRY_AFTER_FAILURE_MS
    if (now >= due && retryOk) load()
  }, [now, due, state.loading, state.snapshot, state.error, state.lastAttempt, load])

  const status = state.snapshot ? rateStatus(state.snapshot, state.source, now) : null
  return { snapshot: state.snapshot, status, loading: state.loading, error: state.error, nextRefresh: due, refresh: load }
}
