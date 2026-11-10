export type ConnectivityEvent = 'online' | 'offline' | 'visible' | 'hidden' | 'storage'

type Listener = (event: ConnectivityEvent) => void

const listeners = new Set<Listener>()
const emit = (event: ConnectivityEvent) => listeners.forEach((l) => l(event))

const onOnline = () => emit('online')
const onOffline = () => emit('offline')
const onStorage = () => emit('storage')
const onVisibility = () => emit(document.hidden ? 'hidden' : 'visible')

export const isOnline = (): boolean => navigator.onLine
export const isPageVisible = (): boolean => !document.hidden

/**
 * The single place that listens for the browser's online/offline, tab-visibility and cross-tab storage
 * events. Every live feed subscribes here instead of adding its own listeners; the DOM listeners exist
 * only while at least one feed is subscribed.
 */
export function subscribeConnectivity(listener: Listener): () => void {
  if (listeners.size === 0) {
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    window.addEventListener('storage', onStorage)
    document.addEventListener('visibilitychange', onVisibility)
  }
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('storage', onStorage)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }
}
