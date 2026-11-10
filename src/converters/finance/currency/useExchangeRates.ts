import { useLiveData, type Feed } from '../shared/useLiveData.ts'
import { nextRefreshAt } from './currencyMath.ts'
import { fetchRates, readCache } from './exchangeRateService.ts'
import type { RateSnapshot } from './types.ts'

const ratesFeed: Feed<RateSnapshot> = {
  fetch: fetchRates,
  readCache,
  nextRefreshAt,
  fetchedAt: (data) => data.fetchedAt,
  failureMessage: 'Could not load exchange rates.',
}

export const useExchangeRates = () => useLiveData(ratesFeed)
