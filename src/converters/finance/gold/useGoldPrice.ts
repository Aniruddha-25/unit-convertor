import { useLiveData, type Feed } from '../shared/useLiveData.ts'
import { goldNextRefreshAt, goldStatus, type GoldSnapshot } from './goldMath.ts'
import { fetchGold, freshGoldCache, readGoldCache } from './goldService.ts'

const goldFeed: Feed<GoldSnapshot> = {
  fetch: fetchGold,
  readCache: readGoldCache,
  freshCache: () => freshGoldCache(),
  status: goldStatus,
  nextRefreshAt: goldNextRefreshAt,
  failureMessage: 'Could not load the gold price.',
}

export const useGoldPrice = () => useLiveData(goldFeed)
