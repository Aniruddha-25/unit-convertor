import assert from 'node:assert/strict'
import { test } from 'node:test'
import { convertAmount } from '../currency/currencyMath.ts'
import {
  GOLD_LIVE_WINDOW_MS,
  GOLD_OUTDATED_AFTER_MS,
  goldStatus,
  goldValueUsd,
  parseGoldResponse,
  parseGoldSnapshot,
  usdPerGram,
  worstStatus,
  type GoldSnapshot,
} from './goldMath.ts'
import { findPurity, purities } from './purity.ts'
import { GRAMS_PER_TROY_OUNCE, toGrams } from './weight.ts'

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps * Math.max(1, Math.abs(b)), `${a} !~ ${b}`)
const NOW = 1_800_000_000_000
const snap = (over: Partial<GoldSnapshot> = {}): GoldSnapshot => ({ usdPerTroyOunce: 3110.34768, providerUpdatedAt: NOW - 60_000, fetchedAt: NOW - 30_000, ...over })

test('value uses the selected purity, not 24K for everything', () => {
  const spot = 3110.34768 // => exactly 100 USD per gram of pure (1000-fine) gold
  close(usdPerGram(spot, findPurity('24k')), 99.9)
  close(usdPerGram(spot, findPurity('22k')), 91.6)
  close(usdPerGram(spot, findPurity('20k')), 83.3)
  close(usdPerGram(spot, findPurity('18k')), 75)
  close(usdPerGram(spot, findPurity('9k')), 37.5)
  close(goldValueUsd(10, spot, findPurity('22k')), 916)
  close(goldValueUsd(1, spot, findPurity('14k')), 58.5)
  // strictly decreasing by purity
  const v = purities.map((p) => usdPerGram(spot, p))
  for (let i = 1; i < v.length; i++) assert.ok(v[i] < v[i - 1])
  // one troy ounce of fine gold is worth the spot price
  close(goldValueUsd(GRAMS_PER_TROY_OUNCE, spot, { ...findPurity('24k'), fineness: 1000 }), spot)
})

test('currency conversion of the value', () => {
  const rates = { USD: 1, INR: 80, EUR: 0.9 }
  const usd = goldValueUsd(toGrams(1, 'tola'), 3110.34768, findPurity('22k'))
  close(convertAmount(usd, 'USD', 'INR', rates), usd * 80)
  close(convertAmount(usd, 'USD', 'EUR', rates), usd * 0.9)
})

test('parses the provider payload and its timestamp', () => {
  const s = parseGoldResponse({ currency: 'USD', price: 4126.3, symbol: 'XAU', updatedAt: '2026-11-10T06:34:31Z' }, 5)
  assert.equal(s.usdPerTroyOunce, 4126.3)
  assert.equal(s.providerUpdatedAt, Date.parse('2026-11-10T06:34:31Z'))
  assert.equal(s.fetchedAt, 5)
})

test('missing provider timestamp stays null instead of being invented', () => {
  assert.equal(parseGoldResponse({ price: 1, symbol: 'XAU' }, 5).providerUpdatedAt, null)
  assert.equal(parseGoldResponse({ price: 1, symbol: 'XAU', updatedAt: 'garbage' }, 5).providerUpdatedAt, null)
})

test('rejects bad payloads', () => {
  assert.throws(() => parseGoldResponse(null, 0))
  assert.throws(() => parseGoldResponse({ price: 'x', symbol: 'XAU' }, 0))
  assert.throws(() => parseGoldResponse({ price: -1, symbol: 'XAU' }, 0))
  assert.throws(() => parseGoldResponse({ price: 1, symbol: 'XAG' }, 0))
  assert.throws(() => parseGoldResponse({ price: 1, symbol: 'XAU', currency: 'EUR' }, 0))
  assert.equal(parseGoldSnapshot({ usdPerTroyOunce: 0, fetchedAt: 1 }), null)
  assert.equal(parseGoldSnapshot('x'), null)
})

test('only a recent network quote is live; cache never is', () => {
  assert.equal(goldStatus(snap(), 'network', NOW), 'live')
  assert.equal(goldStatus(snap(), 'cache', NOW), 'cached')
  assert.equal(goldStatus(snap({ fetchedAt: NOW - GOLD_LIVE_WINDOW_MS - 1 }), 'network', NOW), 'cached')
  assert.equal(goldStatus(snap({ providerUpdatedAt: NOW - GOLD_OUTDATED_AFTER_MS - 1 }), 'network', NOW), 'outdated')
  assert.equal(goldStatus(snap({ providerUpdatedAt: null }), 'network', NOW), 'live')
})

test('combined status takes the worse feed', () => {
  assert.equal(worstStatus('live', 'cached'), 'cached')
  assert.equal(worstStatus('outdated', 'live'), 'outdated')
  assert.equal(worstStatus('live', 'live'), 'live')
})
