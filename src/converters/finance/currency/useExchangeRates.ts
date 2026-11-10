import { useLiveData, type Feed } from '../shared/useLiveData.ts'
import { nextRefreshAt, rateStatus } from './currencyMath.ts'
import { fetchRates, freshCache, readCache } from './exchangeRateService.ts'
import type { RateSnapshot } from './types.ts'

const ratesFeed: Feed<RateSnapshot> = {
  fetch: fetchRates,
  readCache,
  freshCache: () => freshCache(),
  status: rateStatus,
  nextRefreshAt,
  failureMessage: 'Could not load exchange rates.',
}

export const useExchangeRates = () => useLiveData(ratesFeed)
