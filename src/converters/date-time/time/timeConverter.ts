import type { ConverterConfig } from '../../../types/converter.ts'
import { convertByFactor } from '../../../utils/conversionUtils.ts'
import { timeUnits } from './timeUnits.ts'

export function convertTime(value: number, fromUnitId: string, toUnitId: string): number {
  return convertByFactor(timeUnits, value, fromUnitId, toUnitId)
}

export const timeConverter: ConverterConfig = {
  id: 'time',
  title: 'Time Converter',
  description: 'Convert between units of time, from nanoseconds to years.',
  units: timeUnits,
  defaultFromUnit: 'h',
  defaultToUnit: 'min',
  convert: convertTime,
  allowNegative: true,
  notes: [
    'Seconds are the base unit: base = input × source factor; result = base ÷ target factor.',
    'Months and years are averages: 1 year = 365.25 days (Julian year), 1 month = 1/12 year = 30.4375 days.',
    'Actual calendar months (28-31 days) and years (365/366 days) vary; leap seconds and time zones are ignored.',
    'Results use binary floating point, so tiny rounding errors (~1e-16 relative) are possible; display shows up to 12 significant digits.',
  ],
}
