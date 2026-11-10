import type { ConverterConfig, UnitDefinition } from '../../../types/converter.ts'
import { convertByFactor } from '../../../utils/conversionUtils.ts'

/**
 * Base unit: BIT PER SECOND. `factor` = bit/s per unit. Base 1024 for every prefix, 1 byte = 8 bits,
 * 1 min = 60 s, 1 hr = 3,600 s. Units are generated from three small tables so the maths lives in one place.
 */
const PREFIXES = [
  { p: '', name: '', power: 0 },
  { p: 'K', name: 'Kilo', power: 1 },
  { p: 'M', name: 'Mega', power: 2 },
  { p: 'G', name: 'Giga', power: 3 },
  { p: 'T', name: 'Tera', power: 4 },
]
const INTERVALS = [
  { symbol: 's', name: 'second', seconds: 1 },
  { symbol: 'min', name: 'minute', seconds: 60 },
  { symbol: 'hr', name: 'hour', seconds: 3600 },
]
const KINDS = [
  { symbol: 'bit', name: 'bit', bits: 1 },
  { symbol: 'B', name: 'byte', bits: 8 },
]

export const rateUnits: readonly UnitDefinition[] = KINDS.flatMap((kind) =>
  INTERVALS.flatMap((interval) =>
    PREFIXES.map(({ p, name, power }): UnitDefinition => {
      const symbol = `${p}${kind.symbol}/${interval.symbol}`
      return {
        // The id doubles as a search keyword, so per-second bit units are also found as bps, Kbps, ...
        id: kind.symbol === 'bit' && interval.symbol === 's' ? `${p}bps` : symbol,
        name: `${name}${kind.name}s per ${interval.name}`.replace(/^./, (c) => c.toUpperCase()),
        symbol,
        factor: (kind.bits * 1024 ** power) / interval.seconds,
      }
    }),
  ),
)

export const dataRateConverter: ConverterConfig = {
  id: 'data-rate',
  title: 'Data Transfer Rate Converter',
  description: 'Convert bit and byte transfer rates per second, minute or hour (base 1024).',
  units: rateUnits,
  defaultFromUnit: 'Mbps',
  defaultToUnit: 'MB/s',
  convert: (value, fromId, toId) => convertByFactor(rateUnits, value, fromId, toId),
  allowNegative: false,
  searchableUnits: true,
  copyUnit: (u) => u.symbol,
}
