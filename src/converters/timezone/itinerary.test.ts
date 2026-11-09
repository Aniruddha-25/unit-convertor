import assert from 'node:assert/strict'
import { test } from 'node:test'
import { convertZoned, formatItineraryTime, zoneAbbreviation, type LocalDateTime } from './timeZoneUtils.ts'

const L = (year: number, month: number, day: number, hour = 0, minute = 0): LocalDateTime => ({
  year, month, day, hour, minute, second: 0,
})

function itinerary(l: LocalDateTime, from: string, to: string): string {
  const r = convertZoned(l, from, to)
  assert.equal(r.status, 'ok')
  if (r.status !== 'ok') throw new Error('unreachable')
  return `Departure: ${formatItineraryTime(r.source)}
Arrival:   ${formatItineraryTime(r.target)}`
}

test('displayed lines: layout, abbreviations', () => {
  const text = itinerary(L(2026, 11, 3, 11, 52), 'America/New_York', 'Asia/Kolkata')
  assert.equal(text, 'Departure: 03 Nov 2026, 11:52 AM EST\nArrival:   03 Nov 2026, 10:22 PM IST')
  const [a, b] = text.split('\n')
  assert.equal(a.indexOf('03'), b.indexOf('03')) // labels aligned
})

test('abbreviations follow daylight saving', () => {
  assert.equal(
    itinerary(L(2026, 7, 15, 9, 0), 'America/New_York', 'Europe/London'),
    'Departure: 15 Jul 2026, 09:00 AM EDT\nArrival:   15 Jul 2026, 02:00 PM BST',
  )
  assert.equal(
    itinerary(L(2026, 1, 15, 9, 0), 'America/New_York', 'Europe/London'),
    'Departure: 15 Jan 2026, 09:00 AM EST\nArrival:   15 Jan 2026, 02:00 PM GMT',
  )
  assert.equal(zoneAbbreviation('America/Los_Angeles', Date.UTC(2026, 6, 1)), 'PDT')
  assert.equal(zoneAbbreviation('America/Los_Angeles', Date.UTC(2026, 0, 1)), 'PST')
})

test('crossing midnight shows the right date; 12 AM/PM and zero padding', () => {
  assert.equal(
    itinerary(L(2026, 11, 3, 4, 0), 'Asia/Kolkata', 'America/New_York'),
    'Departure: 03 Nov 2026, 04:00 AM IST\nArrival:   02 Nov 2026, 05:30 PM EST',
  )
  assert.equal(itinerary(L(2026, 12, 31, 23, 30), 'UTC', 'Asia/Kolkata').split('\n')[1], 'Arrival:   01 Jan 2027, 05:00 AM IST')
  assert.equal(itinerary(L(2026, 3, 1, 0, 5), 'UTC', 'UTC').split('\n')[0], 'Departure: 01 Mar 2026, 12:05 AM UTC')
  assert.equal(itinerary(L(2026, 3, 1, 12, 5), 'UTC', 'UTC').split('\n')[0], 'Departure: 01 Mar 2026, 12:05 PM UTC')
})

test('zones without an English abbreviation fall back to the numeric offset', () => {
  assert.match(itinerary(L(2026, 11, 3, 9, 0), 'UTC', 'Asia/Kathmandu'), /Arrival: {3}03 Nov 2026, 02:45 PM UTC\+05:45$/)
})
