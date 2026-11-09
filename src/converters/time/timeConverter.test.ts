import assert from 'node:assert/strict'
import { test } from 'node:test'
import { convertTime } from './timeConverter.ts'
import { formatNumber, parseInput } from '../../utils/conversionUtils.ts'
import {
  format12, format24, secondsSinceMidnight, switchFormat, to12Hour, validateClock,
  type ClockFormat, type ClockInput, type Meridiem,
} from './clockTime.ts'

const close = (a: number, b: number) =>
  assert.ok(Math.abs(a - b) <= 1e-12 * Math.max(1, Math.abs(b)), `${a} !~ ${b}`)

test('exact fixed units', () => {
  close(convertTime(1, 'h', 'min'), 60)
  close(convertTime(1, 'd', 'h'), 24)
  close(convertTime(1, 'wk', 'd'), 7)
  close(convertTime(1, 's', 'ms'), 1000)
  close(convertTime(1, 's', 'ns'), 1e9)
  close(convertTime(1, 'us', 'ns'), 1000)
})

test('average month and year', () => {
  close(convertTime(1, 'yr', 'd'), 365.25)
  close(convertTime(1, 'yr', 'month'), 12)
  close(convertTime(1, 'month', 'd'), 30.4375)
})

test('identity, negative, zero', () => {
  close(convertTime(42.5, 'h', 'h'), 42.5)
  close(convertTime(-2, 'h', 'min'), -120)
  assert.equal(convertTime(0, 'yr', 'ns'), 0)
})

test('round trip', () => close(convertTime(convertTime(3.7, 'wk', 'us'), 'us', 'wk'), 3.7))

test('parseInput', () => {
  assert.equal(parseInput('').kind, 'empty')
  assert.equal(parseInput('abc').kind, 'error')
  assert.equal(parseInput('0x10').kind, 'error')
  assert.equal(parseInput('1e999').kind, 'error')
  assert.equal(parseInput('-1', false).kind, 'error')
  assert.deepEqual(parseInput(' 1e3 '), { kind: 'ok', value: 1000 })
})

test('formatNumber', () => {
  assert.equal(formatNumber(0.1 + 0.2), '0.3')
  assert.equal(formatNumber(1234.5), '1,234.5')
  assert.equal(formatNumber(3e20), '3e+20')
})

// ---- extra conversion edge cases ----
test('every unit relates to seconds as documented', () => {
  const expected: Record<string, number> = {
    ns: 1e-9, us: 1e-6, ms: 1e-3, s: 1, min: 60, h: 3600, d: 86400, wk: 604800, month: 2629800, yr: 31557600,
  }
  for (const [id, secs] of Object.entries(expected)) close(convertTime(1, id, 's'), secs)
})

test('90 minutes is 1.5 hours', () => close(convertTime(90, 'min', 'h'), 1.5))

test('very large values: overflow gives Infinity (UI reports it)', () => {
  assert.equal(convertTime(1e308, 'yr', 'ns') === Infinity, true)
  assert.ok(Number.isFinite(convertTime(1e30, 'yr', 'ns')))
})

test('unknown unit throws', () => assert.throws(() => convertTime(1, 'fortnight', 's')))

// ---- clock time ----
const input = (hour: string, minute: string, second: string, format: ClockFormat, meridiem: Meridiem = 'AM'): ClockInput =>
  ({ hour, minute, second, format, meridiem })

test('12-hour AM/PM maps correctly to 24-hour', () => {
  const h24 = (h: string, m: Meridiem) => {
    const r = validateClock(input(h, '0', '0', '12h', m))
    assert.ok(r.ok)
    return r.ok ? r.time.hour24 : -1
  }
  assert.equal(h24('12', 'AM'), 0)
  assert.equal(h24('1', 'AM'), 1)
  assert.equal(h24('11', 'AM'), 11)
  assert.equal(h24('12', 'PM'), 12)
  assert.equal(h24('2', 'PM'), 14)
  assert.equal(h24('11', 'PM'), 23)
})

test('24-hour to 12-hour', () => {
  assert.deepEqual(to12Hour(0), { hour: 12, meridiem: 'AM' })
  assert.deepEqual(to12Hour(12), { hour: 12, meridiem: 'PM' })
  assert.deepEqual(to12Hour(14), { hour: 2, meridiem: 'PM' })
  assert.deepEqual(to12Hour(23), { hour: 11, meridiem: 'PM' })
})

test('formatting', () => {
  const r = validateClock(input('2', '30', '5', '12h', 'PM'))
  assert.ok(r.ok)
  if (r.ok) {
    assert.equal(format24(r.time), '14:30:05')
    assert.equal(format12(r.time), '2:30:05 PM')
    assert.equal(secondsSinceMidnight(r.time), 14 * 3600 + 30 * 60 + 5)
  }
})

test('rejects invalid values instead of correcting them', () => {
  const bad = (i: ClockInput, field: 'hour' | 'minute' | 'second') => {
    const r = validateClock(i)
    assert.equal(r.ok, false)
    if (!r.ok) assert.ok(r.errors[field], `expected ${field} error`)
  }
  bad(input('25', '0', '0', '24h'), 'hour')
  bad(input('24', '0', '0', '24h'), 'hour')
  bad(input('0', '0', '0', '12h'), 'hour')
  bad(input('13', '0', '0', '12h'), 'hour')
  bad(input('1', '75', '0', '24h'), 'minute')
  bad(input('1', '0', '90', '24h'), 'second')
  bad(input('', '0', '0', '24h'), 'hour')
  bad(input('1.5', '0', '0', '24h'), 'hour')
  bad(input('-1', '0', '0', '24h'), 'hour')
  bad(input('1', 'ab', '0', '24h'), 'minute')
})

test('24h accepts 0 and 23, 12h accepts 12', () => {
  assert.ok(validateClock(input('0', '0', '0', '24h')).ok)
  assert.ok(validateClock(input('23', '59', '59', '24h')).ok)
  assert.ok(validateClock(input('12', '0', '0', '12h')).ok)
})

test('switching format keeps the same moment', () => {
  const to24 = switchFormat(input('2', '30', '00', '12h', 'PM'), '24h')
  assert.deepEqual(to24, { hour: '14', minute: '30', second: '00', format: '24h', meridiem: 'PM' })
  const to12 = switchFormat(to24, '12h')
  assert.equal(to12.hour, '2')
  assert.equal(to12.meridiem, 'PM')
  const midnight = switchFormat(input('0', '0', '0', '24h'), '12h')
  assert.equal(midnight.hour, '12')
  assert.equal(midnight.meridiem, 'AM')
})

test('switching with invalid fields keeps them as typed', () => {
  const out = switchFormat(input('25', '0', '0', '24h'), '12h')
  assert.equal(out.hour, '25')
  assert.equal(out.format, '12h')
})
