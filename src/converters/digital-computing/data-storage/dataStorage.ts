import type { ConverterConfig, UnitDefinition } from '../../../types/converter.ts'
import { convertByFactor } from '../../../utils/conversionUtils.ts'

/** Base unit: BIT. `factor` = bits per unit. Base 1024 throughout; lowercase b = bit, uppercase B = byte. */
const BITS_PER_BYTE = 8
const KIBI = 1024

export const storageUnits: readonly UnitDefinition[] = [
  { id: 'b', name: 'Bit', symbol: 'b', factor: 1 },
  { id: 'Kb', name: 'Kilobit', symbol: 'Kb', factor: KIBI },
  { id: 'Mb', name: 'Megabit', symbol: 'Mb', factor: KIBI ** 2 },
  { id: 'Gb', name: 'Gigabit', symbol: 'Gb', factor: KIBI ** 3 },
  { id: 'Tb', name: 'Terabit', symbol: 'Tb', factor: KIBI ** 4 },
  { id: 'Pb', name: 'Petabit', symbol: 'Pb', factor: KIBI ** 5 },
  { id: 'Eb', name: 'Exabit', symbol: 'Eb', factor: KIBI ** 6 },
  { id: 'Zb', name: 'Zettabit', symbol: 'Zb', factor: KIBI ** 7 },
  { id: 'Yb', name: 'Yottabit', symbol: 'Yb', factor: KIBI ** 8 },
  { id: 'B', name: 'Byte', symbol: 'B', factor: BITS_PER_BYTE },
  { id: 'KB', name: 'Kilobyte', symbol: 'KB', factor: BITS_PER_BYTE * KIBI },
  { id: 'MB', name: 'Megabyte', symbol: 'MB', factor: BITS_PER_BYTE * KIBI ** 2 },
  { id: 'GB', name: 'Gigabyte', symbol: 'GB', factor: BITS_PER_BYTE * KIBI ** 3 },
  { id: 'TB', name: 'Terabyte', symbol: 'TB', factor: BITS_PER_BYTE * KIBI ** 4 },
  { id: 'PB', name: 'Petabyte', symbol: 'PB', factor: BITS_PER_BYTE * KIBI ** 5 },
  { id: 'EB', name: 'Exabyte', symbol: 'EB', factor: BITS_PER_BYTE * KIBI ** 6 },
  { id: 'ZB', name: 'Zettabyte', symbol: 'ZB', factor: BITS_PER_BYTE * KIBI ** 7 },
  { id: 'YB', name: 'Yottabyte', symbol: 'YB', factor: BITS_PER_BYTE * KIBI ** 8 },
]

export const dataStorageConverter: ConverterConfig = {
  id: 'data-storage',
  title: 'Data Storage Converter',
  description: 'Convert between bits and bytes, from b and B up to Yb and YB (base 1,024).',
  units: storageUnits,
  defaultFromUnit: 'GB',
  defaultToUnit: 'MB',
  convert: (value, fromId, toId) => convertByFactor(storageUnits, value, fromId, toId),
  allowNegative: false,
  searchableUnits: true,
  copyUnit: (u) => u.symbol,
}
