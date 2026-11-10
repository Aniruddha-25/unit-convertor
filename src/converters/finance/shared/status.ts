/** Where the data in memory came from. Only a network response can ever be "live". */
export type RateSource = 'network' | 'cache'

export type RateStatus = 'live' | 'cached' | 'outdated'

export const STATUS_LABEL: Readonly<Record<RateStatus, string>> = { live: 'Live', cached: 'Cached', outdated: 'Outdated' }

export interface StatusWindows {
  /** A network copy younger than this is live. */
  liveWindowMs: number
  /** Provider data older than this is outdated, whatever its source. */
  outdatedAfterMs: number
}

/**
 * Freshness label shared by every live feed. Provider age wins (outdated), then only a recent
 * network fetch is live; stored or older copies are always "cached", never "live".
 */
export function liveStatus(
  providerUpdatedAt: number | null,
  fetchedAt: number,
  source: RateSource,
  now: number,
  { liveWindowMs, outdatedAfterMs }: StatusWindows,
): RateStatus {
  if (providerUpdatedAt !== null && now - providerUpdatedAt > outdatedAfterMs) return 'outdated'
  if (source === 'network' && now - fetchedAt <= liveWindowMs) return 'live'
  return 'cached'
}

/** A stored copy younger than `maxAgeMs` (and not from the future) can be reused without a request. */
export function isFresh(fetchedAt: number, now: number, maxAgeMs: number): boolean {
  const age = now - fetchedAt
  return age >= 0 && age < maxAgeMs
}

const SEVERITY: Record<RateStatus, number> = { live: 0, cached: 1, outdated: 2 }
/** The less trustworthy of two statuses - a value built from two feeds is only as fresh as the older one. */
export const worstStatus = (a: RateStatus, b: RateStatus): RateStatus => (SEVERITY[a] >= SEVERITY[b] ? a : b)

/** Provider timestamp in the user's time zone, with its abbreviation; "unavailable" when not supplied. */
export function formatProviderTime(ms: number | null, timeZone: string = userTimeZone()): string {
  return ms === null ? 'unavailable' : formatTimestamp(ms, timeZone)
}

export function formatTimestamp(ms: number, timeZone?: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone }).format(ms)
}

export const userTimeZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone
