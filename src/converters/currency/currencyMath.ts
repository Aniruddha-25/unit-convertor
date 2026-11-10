import type { RateSnapshot, RateSource, RateStatus } from './types.ts'

const MINUTE = 60_000
const HOUR = 60 * MINUTE

/** Automatic refresh cadence, and the age under which a stored snapshot is reused without a request. */
export const REFRESH_INTERVAL_MS = 30 * MINUTE
/** A network snapshot counts as live only while it is younger than this (refresh interval + grace). */
export const LIVE_WINDOW_MS = REFRESH_INTERVAL_MS + 5 * MINUTE
/** The provider publishes daily; rates older than this are flagged as outdated. */
export const OUTDATED_AFTER_MS = 48 * HOUR

/** Cross rate: amount × (rate[to] ÷ rate[from]), both quoted against the same base. */
export function convertAmount(amount: number, from: string, to: string, rates: Readonly<Record<string, number>>): number {
  const rf = rates[from]
  const rt = rates[to]
  if (!(rf > 0) || !(rt > 0)) throw new Error(`Missing rate for ${from} or ${to}`)
  return (amount * rt) / rf
}

export function rateStatus(snapshot: RateSnapshot, source: RateSource, now: number): RateStatus {
  if (snapshot.providerUpdatedAt !== null && now - snapshot.providerUpdatedAt > OUTDATED_AFTER_MS) return 'outdated'
  if (source === 'network' && now - snapshot.fetchedAt <= LIVE_WINDOW_MS) return 'live'
  return 'cached'
}

export function nextRefreshAt(snapshot: RateSnapshot): number {
  return snapshot.fetchedAt + REFRESH_INTERVAL_MS
}

export function isCacheFresh(snapshot: RateSnapshot, now: number): boolean {
  const age = now - snapshot.fetchedAt
  return age >= 0 && age < REFRESH_INTERVAL_MS
}

/** Validate untrusted JSON (provider response or localStorage) into a snapshot, or null. */
export function parseSnapshot(raw: unknown): RateSnapshot | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  if (typeof r.base !== 'string' || typeof r.rates !== 'object' || r.rates === null) return null
  if (typeof r.fetchedAt !== 'number') return null
  const updated = typeof r.providerUpdatedAt === 'number' ? r.providerUpdatedAt : null
  const rates: Record<string, number> = {}
  for (const [code, v] of Object.entries(r.rates as Record<string, unknown>)) {
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) rates[code] = v
  }
  if (!(rates[r.base] > 0) || Object.keys(rates).length < 2) return null
  const next = typeof r.providerNextUpdateAt === 'number' ? r.providerNextUpdateAt : null
  return { base: r.base, rates, providerUpdatedAt: updated, providerNextUpdateAt: next, fetchedAt: r.fetchedAt }
}

/** Convert open.er-api.com's response into a snapshot (throws on an unusable payload). */
export function snapshotFromProvider(json: unknown, fetchedAt: number): RateSnapshot {
  const j = json as Record<string, unknown> | null
  if (!j || j.result !== 'success') throw new Error('The rate provider returned an error.')
  const updated = j.time_last_update_unix
  const next = j.time_next_update_unix
  const snap = parseSnapshot({
    base: j.base_code,
    rates: j.rates,
    providerUpdatedAt: typeof updated === 'number' && updated > 0 ? updated * 1000 : null,
    providerNextUpdateAt: typeof next === 'number' && next > 0 ? next * 1000 : null,
    fetchedAt,
  })
  if (!snap) throw new Error('The rate provider response was not understood.')
  return snap
}

/** Display formatting only. Honors the currency's minor units; tiny results keep significant digits. */
export function formatAmount(value: number, decimals: number, locale?: string): string {
  const abs = Math.abs(value)
  if (abs !== 0 && abs < 10 ** -decimals) {
    return new Intl.NumberFormat(locale, { maximumSignificantDigits: 4 }).format(value)
  }
  return new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value)
}

export function formatTimestamp(ms: number, timeZone?: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone }).format(ms)
}

export function timeZoneLabel(timeZone: string, at: number, locale?: string): string {
  const part = new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: 'short' })
    .formatToParts(at)
    .find((p) => p.type === 'timeZoneName')
  return part ? `${timeZone} (${part.value})` : timeZone
}
