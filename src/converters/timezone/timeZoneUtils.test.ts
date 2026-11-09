import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  convertZoned,
  describeDayDifference,
  formatIso8601,
  formatLocalTime,
  formatOffset,
  isValidZone,
  listZones,
  parseIsoDate,
  resolveLocalTime,
  searchZones,
  swapPreservingInstant,
  viewAt,
  type ConversionResult,
  type LocalDateTime,
} from './timeZoneUtils.ts'
import { to24Hour, validateClock } from '../time/clockTime.ts'

const L = (year: number, month: number, day: number, hour = 0, minute = 0, second = 0): LocalDateTime => ({
  year, month, day, hour, minute, second,
})
const iso = (l: LocalDateTime) =>
  `${l.year}-${String(l.month).padStart(2, '0')}-${String(l.day).padStart(2, '0')} ${String(l.hour).padStart(2, '0')}:${String(l.minute).padStart(2, '0')}`

function ok(r: ConversionResult) {
  assert.equal(r.status, 'ok', JSON.stringify(r))
  if (r.status !== 'ok') throw new Error('unreachable')
  return r
}

test('India → US (summer, EDT): previous day', () => {
  const r = ok(convertZoned(L(2024, 7, 15, 8, 0), 'Asia/Kolkata', 'America/New_York'))
  assert.equal(iso(r.target.local), '2024-07-14 22:30')
  assert.equal(r.target.offsetLabel, 'UTC−04:00')
  assert.equal(r.dayDiff, -1)
  assert.equal(r.source.offsetLabel, 'UTC+05:30')
})

test('India → US (winter, EST) uses a different offset than summer', () => {
  const r = ok(convertZoned(L(2024, 1, 15, 8, 0), 'Asia/Kolkata', 'America/New_York'))
  assert.equal(iso(r.target.local), '2024-01-14 21:30')
  assert.equal(r.target.offsetLabel, 'UTC−05:00')
})

test('India → Los Angeles / Chicago', () => {
  assert.equal(iso(ok(convertZoned(L(2024, 7, 15, 10, 30), 'Asia/Kolkata', 'America/Los_Angeles')).target.local), '2024-07-14 22:00')
  assert.equal(iso(ok(convertZoned(L(2024, 7, 15, 10, 30), 'Asia/Kolkata', 'America/Chicago')).target.local), '2024-07-15 00:00')
})

test('India → UK in BST and GMT', () => {
  assert.equal(iso(ok(convertZoned(L(2024, 7, 15, 10, 30), 'Asia/Kolkata', 'Europe/London')).target.local), '2024-07-15 06:00')
  assert.equal(iso(ok(convertZoned(L(2024, 1, 15, 10, 30), 'Asia/Kolkata', 'Europe/London')).target.local), '2024-01-15 05:00')
})

test('US DST: same New York noon maps to different UTC offsets either side of the change', () => {
  assert.equal(iso(ok(convertZoned(L(2024, 3, 9, 12), 'America/New_York', 'Asia/Kolkata')).target.local), '2024-03-09 22:30')
  assert.equal(iso(ok(convertZoned(L(2024, 3, 11, 12), 'America/New_York', 'Asia/Kolkata')).target.local), '2024-03-11 21:30')
})

test('US spring-forward: 02:30 on 2024-03-10 does not exist', () => {
  const r = resolveLocalTime('America/New_York', L(2024, 3, 10, 2, 30))
  assert.equal(r.status, 'nonexistent')
  if (r.status !== 'nonexistent') return
  assert.equal(iso(r.candidates[0].view.local), '2024-03-10 01:30')
  assert.equal(iso(r.candidates[1].view.local), '2024-03-10 03:30')
  const later = resolveLocalTime('America/New_York', L(2024, 3, 10, 2, 30), 'later')
  assert.equal(later.status, 'ok')
  if (later.status === 'ok') assert.equal(later.adjusted, true)
})

test('US fall-back: 01:30 on 2024-11-03 happens twice', () => {
  const r = resolveLocalTime('America/New_York', L(2024, 11, 3, 1, 30))
  assert.equal(r.status, 'ambiguous')
  if (r.status !== 'ambiguous') return
  assert.equal(r.candidates[0].view.offsetLabel, 'UTC−04:00')
  assert.equal(r.candidates[1].view.offsetLabel, 'UTC−05:00')
  assert.equal(r.candidates[1].view.epochMs - r.candidates[0].view.epochMs, 3_600_000)
  // Choosing each occurrence yields different UTC-based results (1 h apart in India).
  const a = ok(convertZoned(L(2024, 11, 3, 1, 30), 'America/New_York', 'Asia/Kolkata', 'earlier'))
  const b = ok(convertZoned(L(2024, 11, 3, 1, 30), 'America/New_York', 'Asia/Kolkata', 'later'))
  assert.equal(iso(a.target.local), '2024-11-03 11:00')
  assert.equal(iso(b.target.local), '2024-11-03 12:00')
  assert.equal(a.adjusted, false)
})

test('convertZoned surfaces ambiguity instead of guessing', () => {
  assert.equal(convertZoned(L(2024, 11, 3, 1, 30), 'America/New_York', 'Asia/Kolkata').status, 'ambiguous')
  assert.equal(convertZoned(L(2024, 3, 10, 2, 30), 'America/New_York', 'Asia/Kolkata').status, 'nonexistent')
})

test('UK DST: 01:30 on 2024-03-31 is skipped; 01:30 on 2024-10-27 repeats', () => {
  assert.equal(resolveLocalTime('Europe/London', L(2024, 3, 31, 1, 30)).status, 'nonexistent')
  assert.equal(resolveLocalTime('Europe/London', L(2024, 10, 27, 1, 30)).status, 'ambiguous')
  assert.equal(resolveLocalTime('Europe/London', L(2024, 3, 31, 2, 30)).status, 'ok')
  assert.equal(iso(ok(convertZoned(L(2024, 3, 31, 12), 'Europe/London', 'UTC')).target.local), '2024-03-31 11:00')
  assert.equal(iso(ok(convertZoned(L(2024, 3, 30, 12), 'Europe/London', 'UTC')).target.local), '2024-03-30 12:00')
})

test('midnight and date boundaries', () => {
  const next = ok(convertZoned(L(2024, 12, 31, 23, 30), 'UTC', 'Asia/Tokyo'))
  assert.equal(iso(next.target.local), '2025-01-01 08:30')
  assert.equal(next.dayDiff, 1)
  assert.equal(describeDayDifference(next.dayDiff), 'Next day (+1 day)')
  const same = ok(convertZoned(L(2024, 6, 1, 0, 0), 'UTC', 'UTC'))
  assert.equal(same.dayDiff, 0)
  assert.equal(describeDayDifference(0), 'Same day')
  assert.equal(describeDayDifference(-1), 'Previous day (−1 day)')
})

test('leap years', () => {
  const r = ok(convertZoned(L(2024, 3, 1, 0, 0), 'Asia/Kolkata', 'UTC'))
  assert.equal(iso(r.target.local), '2024-02-29 18:30')
  assert.equal(r.target.fullDate, 'Thursday, 29 February 2024')
  assert.equal(parseIsoDate('2024-02-29').ok, true)
  assert.equal(parseIsoDate('2023-02-29').ok, false)
  assert.equal(parseIsoDate('2100-02-29').ok, false) // century, not a leap year
  assert.equal(parseIsoDate('2000-02-29').ok, true) // divisible by 400
  assert.equal(iso(ok(convertZoned(L(2023, 3, 1, 0, 0), 'Asia/Kolkata', 'UTC')).target.local), '2023-02-28 18:30')
})

test('date validation', () => {
  assert.equal(parseIsoDate('').ok, false)
  assert.equal(parseIsoDate('03/04/2024').ok, false) // ambiguous formats rejected
  assert.equal(parseIsoDate('2024-13-01').ok, false)
  assert.equal(parseIsoDate('2024-04-31').ok, false)
  assert.equal(parseIsoDate('0999-01-01').ok, false)
  assert.equal(parseIsoDate('2024-04-30').ok, true)
})

test('invalid time zone identifiers', () => {
  assert.equal(isValidZone('Mars/Olympus'), false)
  assert.equal(isValidZone(''), false)
  assert.equal(isValidZone('Asia/Kolkata'), true)
  assert.equal(convertZoned(L(2024, 1, 1), 'Mars/Olympus', 'UTC').status, 'error')
  assert.equal(convertZoned(L(2024, 1, 1), 'UTC', 'Nope/Nope').status, 'error')
  assert.equal(resolveLocalTime('', L(2024, 1, 1)).status, 'error')
})

test('swap preserves the instant', () => {
  const c = ok(convertZoned(L(2024, 7, 15, 8, 0), 'Asia/Kolkata', 'America/New_York'))
  const s = swapPreservingInstant(c)
  assert.equal(s.sourceZone, 'America/New_York')
  assert.equal(s.targetZone, 'Asia/Kolkata')
  const back = ok(convertZoned(s.local, s.sourceZone, s.targetZone, s.choice))
  assert.equal(back.source.epochMs, c.source.epochMs)
  assert.equal(iso(back.target.local), '2024-07-15 08:00')
})

test('swap preserves the instant even when the new source time is ambiguous', () => {
  const c = ok(convertZoned(L(2024, 11, 3, 1, 30), 'America/New_York', 'Asia/Kolkata', 'later'))
  const s = swapPreservingInstant(c)
  const back = ok(convertZoned(s.local, s.sourceZone, s.targetZone, s.choice))
  assert.equal(back.source.epochMs, c.source.epochMs)
  assert.equal(iso(back.target.local), '2024-11-03 01:30')
  // Now the ambiguous one is the target side.
  const c2 = ok(convertZoned(L(2024, 11, 3, 11, 0), 'Asia/Kolkata', 'America/New_York'))
  const s2 = swapPreservingInstant(c2)
  assert.equal(s2.choice, 'earlier')
  assert.equal(ok(convertZoned(s2.local, s2.sourceZone, s2.targetZone, s2.choice)).source.epochMs, c2.source.epochMs)
})

test('12-hour and 24-hour display and input', () => {
  const l = L(2024, 7, 14, 22, 30, 5)
  assert.equal(formatLocalTime(l, '24h'), '22:30:05')
  assert.equal(formatLocalTime(l, '12h'), '10:30:05 PM')
  assert.equal(formatLocalTime(L(2024, 1, 1, 0, 0), '12h'), '12:00:00 AM')
  assert.equal(formatLocalTime(L(2024, 1, 1, 12, 0), '12h'), '12:00:00 PM')
  // 12-hour input 10:30 PM and 24-hour input 22:30 are the same instant.
  const pm = validateClock({ hour: '10', minute: '30', second: '0', format: '12h', meridiem: 'PM' })
  const h24 = validateClock({ hour: '22', minute: '30', second: '0', format: '24h', meridiem: 'AM' })
  assert.ok(pm.ok && h24.ok)
  if (pm.ok && h24.ok) {
    assert.equal(pm.time.hour24, h24.time.hour24)
    const a = convertZoned(L(2024, 7, 15, pm.time.hour24, 30), 'Asia/Kolkata', 'UTC')
    const b = convertZoned(L(2024, 7, 15, h24.time.hour24, 30), 'Asia/Kolkata', 'UTC')
    assert.equal(ok(a).source.epochMs, ok(b).source.epochMs)
  }
  assert.equal(to24Hour(12, 'AM'), 0)
  assert.equal(to24Hour(12, 'PM'), 12)
})

test('offsets come from the zone database, not a table', () => {
  assert.equal(viewAt(Date.UTC(2024, 0, 15), 'America/New_York').offsetLabel, 'UTC−05:00')
  assert.equal(viewAt(Date.UTC(2024, 6, 15), 'America/New_York').offsetLabel, 'UTC−04:00')
  assert.equal(viewAt(Date.UTC(2024, 6, 15), 'Asia/Kolkata').offsetLabel, 'UTC+05:30')
  assert.equal(viewAt(Date.UTC(2024, 6, 15), 'Asia/Kathmandu').offsetLabel, 'UTC+05:45')
  assert.equal(formatOffset(0), 'UTC+00:00')
})

test('zone list and search', () => {
  const zones = listZones()
  assert.ok(zones.length > 300)
  for (const z of ['Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo', 'Europe/London', 'Europe/Paris', 'America/New_York',
    'America/Los_Angeles', 'America/Chicago', 'Australia/Sydney', 'Pacific/Auckland', 'UTC']) {
    assert.ok(zones.includes(z), z)
  }
  assert.equal(searchZones(zones, 'kolkata')[0], 'Asia/Kolkata')
  assert.equal(searchZones(zones, 'india')[0], 'Asia/Kolkata')
  assert.ok(searchZones(zones, 'new york').includes('America/New_York'))
  assert.ok(searchZones(zones, 'united kingdom').includes('Europe/London'))
  assert.ok(searchZones(zones, 'Asia/Tok').includes('Asia/Tokyo'))
  assert.deepEqual(searchZones(zones, 'zzzzqq'), [])
})

test('ISO 8601 output: 24-hour, numeric offset, DST-aware', () => {
  // New York is on standard time (-05:00) in November, daylight time (-04:00) in July.
  assert.equal(formatIso8601(ok(convertZoned(L(2026, 11, 9, 21, 29), 'Asia/Kolkata', 'America/New_York')).target), '2026-11-09T10:59:00-05:00')
  assert.equal(formatIso8601(ok(convertZoned(L(2024, 7, 15, 8, 0), 'Asia/Kolkata', 'America/New_York')).target), '2024-07-14T22:30:00-04:00')
  assert.equal(formatIso8601(viewAt(Date.UTC(2024, 0, 1), 'Asia/Kolkata')), '2024-01-01T05:30:00+05:30')
  assert.equal(formatIso8601(viewAt(Date.UTC(2024, 5, 1, 12), 'Europe/London')), '2024-06-01T13:00:00+01:00')
  assert.equal(formatIso8601(viewAt(Date.UTC(2024, 0, 1, 12), 'UTC')), '2024-01-01T12:00:00+00:00')
  assert.equal(formatIso8601(viewAt(Date.UTC(2024, 6, 1), 'Asia/Kathmandu')), '2024-07-01T05:45:00+05:45')
  // midnight is 00, not 24; no month names or abbreviations
  const midnight = formatIso8601(viewAt(Date.UTC(2024, 11, 31, 18, 30), 'Asia/Kolkata'))
  assert.equal(midnight, '2025-01-01T00:00:00+05:30')
  assert.match(midnight, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/)
})
