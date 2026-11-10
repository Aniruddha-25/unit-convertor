import { useCallback, useEffect, useRef, useState } from 'react'
import { goldNextRefreshAt, goldStatus, type GoldSnapshot, type GoldSource } from '../../converters/gold/goldMath.ts'
import { fetchGold, freshGoldCache, readGoldCache } from '../../converters/gold/goldService.ts'
import type { RateStatus } from '../../converters/currency/types.ts'

const TICK_MS = 30_000
const RETRY_AFTER_FAILURE_MS = 2 * 60_000

export interface GoldPrice {
  snapshot: GoldSnapshot | null
  status: RateStatus | null
  loading: boolean
  error: string | null
  refresh: () => void
}

interface State {
  snapshot: GoldSnapshot | null
  source: GoldSource
  loading: boolean
  error: string | null
  lastAttempt: number
}

function initialState(): State {
  const fresh = freshGoldCache()
  return { snapshot: fresh, source: 'cache', loading: fresh === null, error: null, lastAttempt: fresh ? Date.now() : 0 }
}

/**
 * Same contract as useExchangeRates: load on mount (reusing a <5 min old stored copy), refresh every
 * 5 min while open, manual refresh. After a failure the last good price stays visible but is never "live".
 */
export function useGoldPrice(): GoldPrice {
  const [state, setState] = useState<State>(initialState)
  const [now, setNow] = useState(() => Date.now())
  const inFlight = useRef<AbortController | null>(null)

  const load = useCallback(() => {
    if (inFlight.current) return
    const controller = new AbortController()
    inFlight.current = controller
    setState((s) => ({ ...s, loading: true, lastAttempt: Date.now() }))
    fetchGold(controller.signal)
      .then((snapshot) => setState({ snapshot, source: 'network', loading: false, error: null, lastAttempt: Date.now() }))
      .catch((e: unknown) => {
        if (controller.signal.aborted) return
        const message = e instanceof Error ? e.message : 'Could not load the gold price.'
        setState((s) => ({ ...s, snapshot: s.snapshot ?? readGoldCache(), source: 'cache', loading: false, error: message, lastAttempt: Date.now() }))
      })
      .finally(() => {
        if (inFlight.current === controller) inFlight.current = null
      })
  }, [])

  useEffect(() => {
    if (state.snapshot === null) load()
    return () => {
      inFlight.current?.abort()
      inFlight.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, [])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(id)
  }, [])

  const due = state.snapshot ? goldNextRefreshAt(state.snapshot) : null
  useEffect(() => {
    if (state.loading || !state.snapshot || due === null) return
    const retryOk = state.error === null || now - state.lastAttempt >= RETRY_AFTER_FAILURE_MS
    if (now >= due && retryOk) load()
  }, [now, due, state.loading, state.snapshot, state.error, state.lastAttempt, load])

  const status = state.snapshot ? goldStatus(state.snapshot, state.source, now) : null
  return { snapshot: state.snapshot, status, loading: state.loading, error: state.error, refresh: load }
}
