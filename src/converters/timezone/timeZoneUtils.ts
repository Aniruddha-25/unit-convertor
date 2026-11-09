import { Temporal } from '@js-temporal/polyfill'
import { modernZoneIds, zoneAliases } from './zoneAliases.ts'

/**
 * Time zone conversion built on Temporal + the IANA database. There are no hand-maintained
 * UTC offset tables: every offset (including DST) is computed for the specific instant.
 * No function here reads the browser's local time zone; callers always pass zones explicitly.
 */

/** A wall-clock date and time with no zone attached. */
export interface LocalDateTime {
  year: number
  month: number // 1-12
  day: number
  hour: number // 0-23
  minute: number
  second: number
}

/** 'earlier' / 'later' pick which occurrence of an ambiguous or nonexistent local time to use. */
export type Disambiguation = 'earlier' | 'later'

/** A moment as seen on the wall clock of one zone. */
export interface ZoneView {
  zone: string
  epochMs: number
  local: LocalDateTime
  offsetMinutes: number
  /** e.g. "UTC+05:30" */
  offsetLabel: string
  /** e.g. "Sunday, 3 November 2024" */
  fullDate: string
  /** ISO date, e.g. "2024-11-03" */
  isoDate: string
}

export interface Candidate {
  choice: Disambiguation
  view: ZoneView
}

export type Resolution =
  | { status: 'ok'; view: ZoneView; /** true when a nonexistent time was moved to the chosen side of a DST gap */ adjusted: boolean }
  | { status: 'ambiguous'; candidates: [Candidate, Candidate] }
  | { status: 'nonexistent'; candidates: [Candidate, Candidate] }
  | { status: 'error'; message: string }

export const MIN_YEAR = 1000
export const MAX_YEAR = 9999

// ---------- zone identifiers ----------

export function isValidZone(id: string): boolean {
  if (typeof id !== 'string' || id.trim() === '') return false
  try {
    Temporal.Instant.fromEpochMilliseconds(0).toZonedDateTimeISO(id)
    return true
  } catch {
    return false
  }
}

/** Every IANA zone the runtime knows, plus UTC. Sorted, validated. */
export function listZones(): string[] {
  const supported = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.('timeZone') ?? []
  const set = new Set<string>(supported.map((z) => modernZoneIds[z] ?? z))
  set.add('UTC')
  return [...set].filter(isValidZone).sort((a, b) => a.localeCompare(b))
}

export interface ZoneLabel {
  id: string
  city: string
  region: string
  country: string
}

export function describeZone(id: string): ZoneLabel {
  const parts = id.split('/')
  const city = (parts[parts.length - 1] ?? id).replace(/_/g, ' ')
  const region = parts.length > 1 ? parts.slice(0, -1).join('/').replace(/_/g, ' ') : ''
  const alias = zoneAliases[id] ?? ''
  return { id, city, region, country: alias }
}

/** "Kolkata, Asia" style readable name. */
export function zoneDisplayName(id: string): string {
  const { city, region } = describeZone(id)
  return region ? `${city} (${region})` : city
}

/** Case-insensitive search across identifier, city, region and aliases (country names). All words must match. */
export function searchZones(zones: readonly string[], query: string, limit = 50): string[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return zones.slice(0, limit)
  const scored: { id: string; score: number }[] = []
  for (const id of zones) {
    const { city, region, country } = describeZone(id)
    const hay = `${id} ${city} ${region} ${country}`.toLowerCase().replace(/_/g, ' ')
    if (!words.every((w) => hay.includes(w))) continue
    const cityL = city.toLowerCase()
    const aliasWords = country.toLowerCase().split(/\s+/)
    let score = 3
    if (cityL === words.join(' ')) score = 0
    else if (aliasWords.length > 0 && words.every((w) => aliasWords.includes(w))) score = 0.5
    else if (cityL.startsWith(words[0])) score = 1
    else if (hay.startsWith(words[0])) score = 2
    scored.push({ id, score })
  }
  return scored.sort((a, b) => a.score - b.score || a.id.localeCompare(b.id)).slice(0, limit).map((s) => s.id)
}

// ---------- views & formatting ----------

const pad2 = (n: number) => String(n).padStart(2, '0')

export function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? '−' : '+'
  const abs = Math.abs(minutes)
  return `UTC${sign}${pad2(Math.floor(abs / 60))}:${pad2(abs % 60)}`
}

function viewOf(zdt: Temporal.ZonedDateTime): ZoneView {
  const zone = zdt.timeZoneId
  const epochMs = zdt.epochMilliseconds
  const offsetMinutes = Math.round(zdt.offsetNanoseconds / 6e10)
  const fullDate = new Intl.DateTimeFormat('en-GB', {
    timeZone: zone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(epochMs)
  return {
    zone,
    epochMs,
    local: { year: zdt.year, month: zdt.month, day: zdt.day, hour: zdt.hour, minute: zdt.minute, second: zdt.second },
    offsetMinutes,
    offsetLabel: formatOffset(offsetMinutes),
    fullDate,
    isoDate: `${String(zdt.year).padStart(4, '0')}-${pad2(zdt.month)}-${pad2(zdt.day)}`,
  }
}

/** The wall-clock view of an exact instant in a zone. Throws RangeError for an invalid zone. */
export function viewAt(epochMs: number, zone: string): ZoneView {
  return viewOf(Temporal.Instant.fromEpochMilliseconds(epochMs).toZonedDateTimeISO(zone))
}

/** "3:05:09 PM" / "15:05:09" */
export function formatLocalTime(l: LocalDateTime, format: '12h' | '24h'): string {
  if (format === '24h') return `${pad2(l.hour)}:${pad2(l.minute)}:${pad2(l.second)}`
  const h = l.hour % 12 === 0 ? 12 : l.hour % 12
  return `${h}:${pad2(l.minute)}:${pad2(l.second)} ${l.hour >= 12 ? 'PM' : 'AM'}`
}

/** ISO 8601 date-time with numeric offset, 24-hour clock: `2026-11-09T10:59:00-05:00`. Offset is the zone's real offset at that instant (DST-aware). */
export function formatIso8601(v: ZoneView): string {
  const { local: l, offsetMinutes } = v
  const sign = offsetMinutes < 0 ? '-' : '+'
  const abs = Math.abs(offsetMinutes)
  return `${v.isoDate}T${pad2(l.hour)}:${pad2(l.minute)}:${pad2(l.second)}${sign}${pad2(Math.floor(abs / 60))}:${pad2(abs % 60)}`
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * Short zone name (EST, EDT, BST, IST, ...) for a zone at a given instant, taken from the runtime's
 * Intl data, so DST is reflected (EST vs EDT). ICU only has abbreviations for some zones in some English
 * locales (e.g. IST appears under en-IN, BST under en-GB), so a few are tried in turn. If none has one
 * (e.g. Asia/Tokyo), the numeric offset (UTC+09:00) is returned rather than inventing a name.
 */
const ABBREVIATION_LOCALES = ['en-US', 'en-GB', 'en-IN', 'en-AU', 'en-NZ', 'en-ZA', 'en-CA', 'en-SG']
export function zoneAbbreviation(zone: string, epochMs: number): string {
  for (const locale of ABBREVIATION_LOCALES) {
    const name = new Intl.DateTimeFormat(locale, { timeZone: zone, timeZoneName: 'short' })
      .formatToParts(epochMs)
      .find((p) => p.type === 'timeZoneName')?.value
    if (name && /^[A-Z]{2,5}$/.test(name)) return name
  }
  return formatOffset(Math.round(viewAt(epochMs, zone).offsetMinutes))
}

/** "03 Nov 2026, 11:52 AM EST" */
export function formatItineraryTime(v: ZoneView): string {
  const l = v.local
  const h = l.hour % 12 === 0 ? 12 : l.hour % 12
  return `${pad2(l.day)} ${MONTHS[l.month - 1]} ${l.year}, ${pad2(h)}:${pad2(l.minute)} ${l.hour >= 12 ? 'PM' : 'AM'} ${zoneAbbreviation(v.zone, v.epochMs)}`
}

/** Whole calendar days from a's local date to b's local date (b − a). */
export function dayDifference(a: ZoneView, b: ZoneView): number {
  const toDays = (l: LocalDateTime) => Date.UTC(l.year, l.month - 1, l.day) / 86_400_000
  return Math.round(toDays(b.local) - toDays(a.local))
}

export function describeDayDifference(diff: number): string {
  if (diff === 0) return 'Same day'
  const n = Math.abs(diff)
  const unit = n === 1 ? 'day' : 'days'
  return diff > 0 ? `Next day (+${n} ${unit})` : `Previous day (−${n} ${unit})`
}

// ---------- validation & resolution ----------

export type DateParse = { ok: true; year: number; month: number; day: number } | { ok: false; message: string }

/** Parses an ISO "YYYY-MM-DD" string (the only accepted format — no ambiguous day/month order). */
export function parseIsoDate(text: string): DateParse {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text.trim())
  if (!m) return { ok: false, message: 'Choose a date (format YYYY-MM-DD).' }
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])]
  if (year < MIN_YEAR || year > MAX_YEAR) return { ok: false, message: `Year must be between ${MIN_YEAR} and ${MAX_YEAR}.` }
  try {
    Temporal.PlainDate.from({ year, month, day }, { overflow: 'reject' })
  } catch {
    const feb = month === 2 ? ' (February has 29 days only in leap years)' : ''
    return { ok: false, message: `${text} is not a real calendar date${feb}.` }
  }
  return { ok: true, year, month, day }
}

function atZone(zone: string, l: LocalDateTime, disambiguation: Disambiguation | 'reject'): Temporal.ZonedDateTime {
  return Temporal.ZonedDateTime.from(
    { timeZone: zone, year: l.year, month: l.month, day: l.day, hour: l.hour, minute: l.minute, second: l.second },
    { disambiguation, overflow: 'reject' },
  )
}

const sameWallClock = (z: Temporal.ZonedDateTime, l: LocalDateTime) =>
  z.year === l.year && z.month === l.month && z.day === l.day && z.hour === l.hour && z.minute === l.minute && z.second === l.second

/**
 * Interpret a wall-clock time in `zone`.
 * - Normal times resolve directly.
 * - Ambiguous (clocks go back, the time happens twice) and nonexistent (clocks go forward, the
 *   time is skipped) times return both candidates unless `choice` says which to use.
 */
export function resolveLocalTime(zone: string, local: LocalDateTime, choice?: Disambiguation): Resolution {
  if (!isValidZone(zone)) return { status: 'error', message: `"${zone}" is not a valid IANA time zone.` }
  try {
    const earlier = atZone(zone, local, 'earlier')
    const later = atZone(zone, local, 'later')
    if (earlier.epochMilliseconds === later.epochMilliseconds) {
      return { status: 'ok', view: viewOf(earlier), adjusted: false }
    }
    const nonexistent = !sameWallClock(earlier, local)
    if (choice) {
      return { status: 'ok', view: viewOf(choice === 'earlier' ? earlier : later), adjusted: nonexistent }
    }
    const candidates: [Candidate, Candidate] = [
      { choice: 'earlier', view: viewOf(earlier) },
      { choice: 'later', view: viewOf(later) },
    ]
    return { status: nonexistent ? 'nonexistent' : 'ambiguous', candidates }
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Could not interpret that date and time.' }
  }
}

export interface Conversion {
  source: ZoneView
  target: ZoneView
  /** Calendar-day difference of target vs source (-1 previous day, 0 same, 1 next). */
  dayDiff: number
  adjusted: boolean
}

export type ConversionResult =
  | ({ status: 'ok' } & Conversion)
  | { status: 'ambiguous' | 'nonexistent'; candidates: [Candidate, Candidate] }
  | { status: 'error'; message: string }

/** Convert a wall-clock time in `sourceZone` to the wall clock of `targetZone`. */
export function convertZoned(
  local: LocalDateTime,
  sourceZone: string,
  targetZone: string,
  choice?: Disambiguation,
): ConversionResult {
  if (!isValidZone(targetZone)) return { status: 'error', message: `"${targetZone}" is not a valid IANA time zone.` }
  const r = resolveLocalTime(sourceZone, local, choice)
  if (r.status !== 'ok') return r
  const target = viewAt(r.view.epochMs, targetZone)
  return { status: 'ok', source: r.view, target, dayDiff: dayDifference(r.view, target), adjusted: r.adjusted }
}

/**
 * Swap zones while preserving the exact instant: the new source is the old target (with the
 * old target's wall-clock time), and the occurrence choice is picked so the instant is unchanged.
 */
export function swapPreservingInstant(c: Conversion): { sourceZone: string; targetZone: string; local: LocalDateTime; choice?: Disambiguation } {
  const local = c.target.local
  const sourceZone = c.target.zone
  let choice: Disambiguation | undefined
  const r = resolveLocalTime(sourceZone, local)
  if (r.status === 'ambiguous') {
    choice = r.candidates.find((k) => k.view.epochMs === c.target.epochMs)?.choice
  }
  return { sourceZone, targetZone: c.source.zone, local, choice }
}

/** Convert an exact instant (e.g. "now") into a LocalDateTime in a zone. */
export function localNow(zone: string, nowMs = Date.now()): LocalDateTime {
  return viewAt(nowMs, zone).local
}
