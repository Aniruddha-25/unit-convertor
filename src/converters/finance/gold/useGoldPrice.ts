import { useLiveData, type Feed } from '../shared/useLiveData.ts'
import { goldNextRefreshAt, type GoldSnapshot } from './goldMath.ts'
import { fetchGold, readGoldCache } from './goldService.ts'

const goldFeed: Feed<GoldSnapshot> = {
  fetch: fetchGold,
  readCache: readGoldCache,
  nextRefreshAt: goldNextRefreshAt,
  fetchedAt: (data) => data.fetchedAt,
  failureMessage: 'Could not load the gold price.',
}

export const useGoldPrice = () => useLiveData(goldFeed)
