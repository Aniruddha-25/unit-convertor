import { GRAMS_PER_TROY_OUNCE } from './weight.ts'
import type { Purity } from './purity.ts'

/** Spot gold quote as returned by the provider, in US dollars per troy ounce of 24K (≈99.99%) gold. */
export interface GoldSnapshot {
  usdPerTroyOunce: number
  /** Provider's own timestamp (epoch ms), or null if it did not supply one. */
  providerUpdatedAt: number | null
  /** When this app last fetched it (epoch ms). */
  fetchedAt: number
}

export const GOLD_REFRESH_INTERVAL_MS = 5 * 60_000
/** Spot gold trades around the clock on weekdays; a quote older than this (a long weekend) is outdated. */
export const GOLD_OUTDATED_AFTER_MS = 72 * 3_600_000

// ---- Value -----------------------------------------------------------------------------------

/**
 * USD value of one gram at the given purity: spot (24K) per gram × fineness/1000.
 * The spot quote is ~99.99% gold, so 24K here (fineness 999) is priced at 99.9% of spot.
 */
export function usdPerGram(spotUsdPerTroyOunce: number, p: Purity): number {
  return (spotUsdPerTroyOunce / GRAMS_PER_TROY_OUNCE) * (p.fineness / 1000)
}

/** Value of `grams` of gold at purity `p`, in USD. */
export const goldValueUsd = (grams: number, spotUsdPerTroyOunce: number, p: Purity): number =>
  grams * usdPerGram(spotUsdPerTroyOunce, p)

// ---- Provider payload & status ---------------------------------------------------------------

/** Parse gold-api.com's `/price/XAU` response; throws on an unusable payload. */
export function parseGoldResponse(json: unknown, fetchedAt: number): GoldSnapshot {
  const j = json as Record<string, unknown> | null
  const price = j?.price
  if (!j || j.symbol !== 'XAU' || typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
    throw new Error('The gold price service returned an unexpected response.')
  }
  if (j.currency !== undefined && j.currency !== 'USD') throw new Error('The gold price was not quoted in USD.')
  const t = typeof j.updatedAt === 'string' ? Date.parse(j.updatedAt) : NaN
  return { usdPerTroyOunce: price, providerUpdatedAt: Number.isFinite(t) ? t : null, fetchedAt }
}

/** Validate untrusted JSON (e.g. from localStorage). */
export function parseGoldSnapshot(raw: unknown): GoldSnapshot | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  if (typeof r.usdPerTroyOunce !== 'number' || !(r.usdPerTroyOunce > 0) || typeof r.fetchedAt !== 'number') return null
  return {
    usdPerTroyOunce: r.usdPerTroyOunce,
    providerUpdatedAt: typeof r.providerUpdatedAt === 'number' ? r.providerUpdatedAt : null,
    fetchedAt: r.fetchedAt,
  }
}

export const goldNextRefreshAt = (s: GoldSnapshot): number => s.fetchedAt + GOLD_REFRESH_INTERVAL_MS

