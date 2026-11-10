import { useSyncExternalStore } from 'react'
import { isOnline, isPageVisible, subscribeConnectivity, type ConnectivityEvent } from './connectivity.ts'
import type { LiveStatus } from './status.ts'

const RETRY_AFTER_FAILURE_MS = 2 * 60_000
/** Never re-request a feed that was fetched successfully this recently (e.g. a converter reopened at once). */
const MIN_GAP_MS = 5_000

/** What differs between live feeds; the status, scheduling and connectivity handling are shared below. */
export interface Feed<T> {
  fetch: (signal?: AbortSignal) => Promise<T>
  /** Last stored copy: shown immediately and kept as the fallback when a request fails. */
  readCache: () => T | null
  /** When the next scheduled update is due (the feed's refresh interval). */
  nextRefreshAt: (data: T) => number
  fetchedAt: (data: T) => number
  failureMessage: string
}

export interface LiveData<T> {
  snapshot: T | null
  /** "live": the latest request succeeded. "offline": no connection. null: not confirmed yet, or the last request failed. */
  status: LiveStatus | null
  /** A request is in flight (first load or a background update). */
  loading: boolean
  /** API error from the latest request, if it failed while online. */
  error: string | null
  /** Time of the last state change, for age checks without calling Date.now() during render. */
  now: number
  /** Re-fetch now. The UI has no refresh button; updates are automatic. */
  refresh: () => void
}

interface State<T> {
  snapshot: T | null
  loading: boolean
  error: string | null
  lastOk: boolean
  online: boolean
  lastAttempt: number
  now: number
}

/**
 * One store per feed, shared by every component that uses it, so they all see the same data, status and
 * in-flight request. It starts working when the first component subscribes and stops with the last one:
 *  - fetches immediately, shows stored data meanwhile, and keeps it as the fallback if the request fails;
 *  - re-fetches on the feed's interval while the tab is visible (timers are paused in a hidden tab);
 *  - revalidates when the tab becomes visible again and the moment the connection returns;
 *  - does nothing while offline, and adopts newer data saved by another tab without a request;
 *  - retries a failed request automatically.
 */
function createStore<T>(feed: Feed<T>) {
  let state: State<T> = { snapshot: feed.readCache(), loading: false, error: null, lastOk: false, online: isOnline(), lastAttempt: 0, now: Date.now() }
  const subscribers = new Set<() => void>()
  let timer: ReturnType<typeof setTimeout> | undefined
  let request: Promise<void> | null = null
  let disconnect: (() => void) | undefined

  const set = (patch: Partial<State<T>>) => {
    state = { ...state, ...patch, now: Date.now() }
    subscribers.forEach((notify) => notify())
  }

  const schedule = () => {
    clearTimeout(timer)
    if (subscribers.size === 0 || request || !state.online || !isPageVisible()) return
    const at = state.error !== null ? state.lastAttempt + RETRY_AFTER_FAILURE_MS : state.snapshot ? feed.nextRefreshAt(state.snapshot) : null
    if (at !== null) timer = setTimeout(load, Math.max(0, at - Date.now()))
  }

  function load(): void {
    if (request || !state.online) return
    if (state.lastOk && state.snapshot && Date.now() - feed.fetchedAt(state.snapshot) < MIN_GAP_MS) return
    set({ loading: true, lastAttempt: Date.now() })
    request = feed
      .fetch()
      .then(
        (snapshot) => set({ snapshot, loading: false, error: null, lastOk: true }),
        (e: unknown) =>
          set({
            snapshot: state.snapshot ?? feed.readCache(),
            loading: false,
            error: e instanceof Error ? e.message : feed.failureMessage,
            lastOk: false,
            lastAttempt: Date.now(),
          }),
      )
      .finally(() => {
        request = null
        schedule()
      })
  }

  const onEvent = (event: ConnectivityEvent) => {
    if (event === 'offline') {
      clearTimeout(timer)
      set({ online: false })
    } else if (event === 'online') {
      set({ online: true })
      load() // connection is back: revalidate right away
    } else if (event === 'hidden') {
      clearTimeout(timer)
    } else if (event === 'visible') {
      set({ online: isOnline() })
      load()
      schedule()
    } else {
      // Another tab saved newer data: show it instead of fetching again.
      const stored = feed.readCache()
      if (stored && (!state.snapshot || feed.fetchedAt(stored) > feed.fetchedAt(state.snapshot))) {
        set({ snapshot: stored, error: null, lastOk: true })
        schedule()
      }
    }
  }

  return {
    subscribe(notify: () => void) {
      subscribers.add(notify)
      if (subscribers.size === 1) {
        disconnect = subscribeConnectivity(onEvent)
        state = { ...state, online: isOnline() }
        load() // fetch as soon as a converter using this feed opens
        schedule()
      }
      return () => {
        subscribers.delete(notify)
        if (subscribers.size === 0) {
          disconnect?.()
          clearTimeout(timer)
        }
      }
    },
    getState: () => state,
    refresh: load,
  }
}

const stores = new WeakMap<object, ReturnType<typeof createStore>>()
function storeFor<T>(feed: Feed<T>) {
  let store = stores.get(feed)
  if (!store) {
    store = createStore(feed)
    stores.set(feed, store)
  }
  return store as ReturnType<typeof createStore<T>>
}

export function useLiveData<T>(feed: Feed<T>): LiveData<T> {
  const store = storeFor(feed)
  const state = useSyncExternalStore(store.subscribe, store.getState)
  const status: LiveStatus | null = !state.online ? 'offline' : state.lastOk ? 'live' : null
  return { snapshot: state.snapshot, status, loading: state.loading, error: state.error, now: state.now, refresh: store.refresh }
}
