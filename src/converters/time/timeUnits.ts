import type { UnitDefinition } from '../../types/converter.ts'

/**
 * Base unit: SECOND. `factor` = seconds per unit.
 *
 * Conventions:
 * - ns, µs, ms, s, min, h, d, wk are exact by definition
 *   (1 min = 60 s, 1 h = 3600 s, 1 d = 86 400 s, 1 wk = 7 d).
 * - Calendar months and years vary in length, so they are AVERAGES, using the
 *   Julian year (the astronomical convention):
 *     1 year  = 365.25 days = 31 557 600 s
 *     1 month = 1 year / 12 = 30.4375 days = 2 629 800 s
 *   Real months are 28-31 days and real years 365 or 366 days; the Gregorian
 *   average (365.2425 d) would differ by ~0.0008%.
 * - Leap seconds and time zones are ignored.
 */
export const SECONDS_PER_DAY = 86_400
export const DAYS_PER_JULIAN_YEAR = 365.25
export const SECONDS_PER_JULIAN_YEAR = DAYS_PER_JULIAN_YEAR * SECONDS_PER_DAY
export const SECONDS_PER_AVERAGE_MONTH = SECONDS_PER_JULIAN_YEAR / 12

export const timeUnits: readonly UnitDefinition[] = [
  { id: 'ns', name: 'Nanoseconds', symbol: 'ns', factor: 1e-9 },
  { id: 'us', name: 'Microseconds', symbol: 'µs', factor: 1e-6 },
  { id: 'ms', name: 'Milliseconds', symbol: 'ms', factor: 1e-3 },
  { id: 's', name: 'Seconds', symbol: 's', factor: 1 },
  { id: 'min', name: 'Minutes', symbol: 'min', factor: 60 },
  { id: 'h', name: 'Hours', symbol: 'h', factor: 3600 },
  { id: 'd', name: 'Days', symbol: 'd', factor: SECONDS_PER_DAY },
  { id: 'wk', name: 'Weeks', symbol: 'wk', factor: 7 * SECONDS_PER_DAY },
  { id: 'month', name: 'Months (average)', symbol: 'month', factor: SECONDS_PER_AVERAGE_MONTH },
  { id: 'yr', name: 'Years (Julian)', symbol: 'yr', factor: SECONDS_PER_JULIAN_YEAR },
]
