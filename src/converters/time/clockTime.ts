/**
 * Clock time (a TIME OF DAY such as 2:30 PM) — deliberately separate from durations
 * (an AMOUNT of time such as 2 h 30 min). Nothing here converts units; the only bridge
 * is `secondsSinceMidnight`, which is explicitly "elapsed since 00:00:00".
 */

export type ClockFormat = '12h' | '24h'
export type Meridiem = 'AM' | 'PM'
export type ClockField = 'hour' | 'minute' | 'second'

/** Raw, user-entered field text. Validated before use; never silently corrected. */
export interface ClockInput {
  hour: string
  minute: string
  second: string
  format: ClockFormat
  /** Only meaningful when format === '12h'. */
  meridiem: Meridiem
}

/** A validated time of day. hour24 is always 0-23. */
export interface ClockTime {
  hour24: number
  minute: number
  second: number
}

export type ClockErrors = Partial<Record<ClockField, string>>

export type ClockResult = { ok: true; time: ClockTime } | { ok: false; errors: ClockErrors }

const DIGITS = /^\d{1,2}$/

function parseField(raw: string, label: string, min: number, max: number, hint = ''): { value?: number; error?: string } {
  const text = raw.trim()
  if (text === '') return { error: `Enter the ${label}.` }
  if (!DIGITS.test(text)) return { error: `The ${label} must be a whole number.` }
  const value = Number(text)
  if (value < min || value > max) {
    return { error: `${value} is not a valid ${label}; use ${min}–${max}.${hint}` }
  }
  return { value }
}

export function validateClock(input: ClockInput): ClockResult {
  const errors: ClockErrors = {}
  const is12 = input.format === '12h'

  const h = is12
    ? parseField(input.hour, 'hour', 1, 12)
    : parseField(input.hour, 'hour', 0, 23, ' Use the 12-hour format for AM/PM.')
  const m = parseField(input.minute, 'minute', 0, 59)
  const s = parseField(input.second, 'second', 0, 59)

  if (h.error) errors.hour = h.error
  if (m.error) errors.minute = m.error
  if (s.error) errors.second = s.error
  if (h.value === undefined || m.value === undefined || s.value === undefined) return { ok: false, errors }

  return { ok: true, time: { hour24: is12 ? to24Hour(h.value, input.meridiem) : h.value, minute: m.value, second: s.value } }
}

/** 12 AM = 00, 1-11 AM = 1-11, 12 PM = 12, 1-11 PM = 13-23. */
export function to24Hour(hour12: number, meridiem: Meridiem): number {
  const base = hour12 % 12
  return meridiem === 'PM' ? base + 12 : base
}

export function to12Hour(hour24: number): { hour: number; meridiem: Meridiem } {
  return { hour: hour24 % 12 === 0 ? 12 : hour24 % 12, meridiem: hour24 >= 12 ? 'PM' : 'AM' }
}

const pad = (n: number) => String(n).padStart(2, '0')

export function format24(t: ClockTime): string {
  return `${pad(t.hour24)}:${pad(t.minute)}:${pad(t.second)}`
}

export function format12(t: ClockTime): string {
  const { hour, meridiem } = to12Hour(t.hour24)
  return `${hour}:${pad(t.minute)}:${pad(t.second)} ${meridiem}`
}

export function secondsSinceMidnight(t: ClockTime): number {
  return t.hour24 * 3600 + t.minute * 60 + t.second
}

/** Build field text for a validated time in the requested format (the same moment, never reinterpreted). */
export function toClockInput(t: ClockTime, format: ClockFormat): ClockInput {
  const { hour, meridiem } = to12Hour(t.hour24)
  return {
    hour: String(format === '12h' ? hour : t.hour24),
    minute: pad(t.minute),
    second: pad(t.second),
    format,
    meridiem,
  }
}

/**
 * Switch 12h/24h without changing the moment. If the current fields are invalid they are
 * kept as typed (only the format changes) so the user still sees the validation message.
 */
export function switchFormat(input: ClockInput, format: ClockFormat): ClockInput {
  if (input.format === format) return input
  const result = validateClock(input)
  return result.ok ? toClockInput(result.time, format) : { ...input, format }
}
