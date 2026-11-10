import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  LIVE_WINDOW_MS,
  OUTDATED_AFTER_MS,
  convertAmount,
  formatAmount,
  formatTimestamp,
  isCacheFresh,
  parseSnapshot,
  rateStatus,
  snapshotFromProvider,
} from './currencyMath.ts'
import type { RateSnapshot } from './types.ts'

const NOW = 1_800_000_000_000
const snap = (over: Partial<RateSnapshot> = {}): RateSnapshot => ({
  base: 'USD',
  rates: { USD: 1, INR: 80, EUR: 0.8 },
  providerUpdatedAt: NOW - 3_600_000,
  providerNextUpdateAt: NOW + 3_600_000,
  fetchedAt: NOW - 60_000,
  ...over,
})

test('converts via cross rates in both directions', () => {
  const { rates } = snap()
  assert.equal(convertAmount(1, 'USD', 'INR', rates), 80)
  assert.equal(convertAmount(80, 'INR', 'USD', rates), 1)
  assert.equal(convertAmount(80, 'INR', 'EUR', rates), 0.8)
  assert.ok(Math.abs(convertAmount(convertAmount(123.45, 'EUR', 'INR', rates), 'INR', 'EUR', rates) - 123.45) < 1e-9)
  assert.equal(convertAmount(1e15, 'USD', 'USD', rates), 1e15)
})

test('conversion rejects unknown currencies', () => {
  assert.throws(() => convertAmount(1, 'USD', 'ZZZ', snap().rates))
})

test('only a recent network snapshot is live', () => {
  assert.equal(rateStatus(snap(), 'network', NOW), 'live')
  assert.equal(rateStatus(snap(), 'cache', NOW), 'cached') // cache is never live
  assert.equal(rateStatus(snap({ fetchedAt: NOW - LIVE_WINDOW_MS - 1 }), 'network', NOW), 'cached')
})

test('provider data older than 48h is outdated regardless of source', () => {
  const old = snap({ providerUpdatedAt: NOW - OUTDATED_AFTER_MS - 1 })
  assert.equal(rateStatus(old, 'network', NOW), 'outdated')
  assert.equal(rateStatus(old, 'cache', NOW), 'outdated')
})

test('cache freshness window', () => {
  assert.ok(isCacheFresh(snap(), NOW))
  assert.ok(!isCacheFresh(snap({ fetchedAt: NOW - 31 * 60_000 }), NOW))
  assert.ok(!isCacheFresh(snap({ fetchedAt: NOW + 1000 }), NOW)) // clock moved backwards
})

test('parses the provider payload and keeps its own timestamps', () => {
  const s = snapshotFromProvider(
    { result: 'success', base_code: 'USD', rates: { USD: 1, INR: 83.5 }, time_last_update_unix: 1000, time_next_update_unix: 2000 },
    5_000_000,
  )
  assert.equal(s.providerUpdatedAt, 1_000_000)
  assert.equal(s.providerNextUpdateAt, 2_000_000)
  assert.equal(s.fetchedAt, 5_000_000)
})

test('rejects error and malformed payloads', () => {
  assert.throws(() => snapshotFromProvider({ result: 'error' }, 0))
  assert.throws(() => snapshotFromProvider({ result: 'success', base_code: 'USD', rates: {}, time_last_update_unix: 1 }, 0))
  assert.equal(parseSnapshot(null), null)
  assert.equal(parseSnapshot('x'), null)
  assert.equal(parseSnapshot({ base: 'USD', rates: { USD: 1, INR: -3 }, providerUpdatedAt: 1, fetchedAt: 1 }), null)
})

test('formats amounts by minor units', () => {
  assert.equal(formatAmount(1234567.891, 2, 'en-US'), '1,234,567.89')
  assert.equal(formatAmount(1234.5, 0, 'en-US'), '1,235')
  assert.equal(formatAmount(0.00001234, 2, 'en-US'), '0.00001234')
})

test('formats provider timestamps in a given time zone with its abbreviation', () => {
  const t = Date.UTC(2026, 10, 10, 6, 34, 31)
  const text = formatTimestamp(t, 'Asia/Kolkata', 'en-US')
  assert.match(text, /Nov 10, 2026/)
  assert.match(text, /12:04/)
  assert.match(text, /GMT\+5:30|IST/)
})
