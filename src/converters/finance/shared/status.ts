/** The two visible states: the latest request succeeded, or the device has no connection. */
export type LiveStatus = 'live' | 'offline'

export const STATUS_LABEL: Readonly<Record<LiveStatus, string>> = { live: 'Live', offline: 'Offline' }

/** One status for a value built from two feeds: offline if either is, live only when both are confirmed. */
export function combineStatus(a: LiveStatus | null, b: LiveStatus | null): LiveStatus | null {
  if (a === 'offline' || b === 'offline') return 'offline'
  return a === 'live' && b === 'live' ? 'live' : null
}

/** True when the provider's own data is older than `afterMs` (a warning, not a status). Unknown age is not outdated. */
export const isProviderOutdated = (providerUpdatedAt: number | null, now: number, afterMs: number): boolean =>
  providerUpdatedAt !== null && now - providerUpdatedAt > afterMs

/** Provider timestamp in the user's time zone, with its abbreviation; "unavailable" when not supplied. */
export function formatProviderTime(ms: number | null, timeZone: string = userTimeZone()): string {
  return ms === null ? 'unavailable' : formatTimestamp(ms, timeZone)
}

export function formatTimestamp(ms: number, timeZone?: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone }).format(ms)
}

export const userTimeZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone
