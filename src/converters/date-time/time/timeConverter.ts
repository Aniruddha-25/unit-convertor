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
}
