/** Normalised payload from the rate provider. All rates are "units of currency per 1 base". */
export interface RateSnapshot {
  base: string
  rates: Readonly<Record<string, number>>
  /** When the PROVIDER last updated its rates (epoch ms), or null if it did not say. */
  providerUpdatedAt: number | null
  /** When the provider says it will publish new rates (epoch ms), if known. */
  providerNextUpdateAt: number | null
  /** When THIS app last fetched them successfully (epoch ms). */
  fetchedAt: number
}

/** Where the snapshot in memory came from. Only a network response can ever be "live". */
export type RateSource = 'network' | 'cache'

export type RateStatus = 'live' | 'cached' | 'outdated'

export interface CurrencyInfo {
  code: string
  name: string
  symbol: string
  decimals: number
  /** ISO 3166-1 alpha-2 (lower-case) for the flag-icons CSS class; null when no single flag applies. */
  flag: string | null
}
