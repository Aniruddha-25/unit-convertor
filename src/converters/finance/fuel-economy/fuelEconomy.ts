import type { ConverterConfig, UnitDefinition } from '../../../types/converter.ts'

/** Exact definitions: 1 mile = 1.609344 km; 1 US gallon = 3.785411784 L; 1 imperial (UK) gallon = 4.54609 L. */
export const KM_PER_MILE = 1.609344
export const LITRES_PER_US_GALLON = 3.785411784
export const LITRES_PER_UK_GALLON = 4.54609

/**
 * Base unit: km/L (distance per volume). `factor` = km/L per one unit for the direct units, so
 * US and UK gallons stay distinct (UK MPG is ~1.2 × US MPG). L/100 km is the reciprocal kind
 * (volume per distance), so its factor is the constant 100 in km/L = 100 ÷ (L/100 km), not a multiplier.
 */
export const fuelUnits: readonly UnitDefinition[] = [
  { id: 'kmpl', name: 'Kilometres per litre', symbol: 'km/L', factor: 1 },
  { id: 'l100km', name: 'Litres per 100 kilometres', symbol: 'L/100 km', factor: 100 },
  { id: 'mpg-us', name: 'Miles per US gallon', symbol: 'MPG (US)', factor: KM_PER_MILE / LITRES_PER_US_GALLON },
  { id: 'mpg-uk', name: 'Miles per UK gallon', symbol: 'MPG (UK)', factor: KM_PER_MILE / LITRES_PER_UK_GALLON },
]

const unit = (id: string): UnitDefinition => {
  const u = fuelUnits.find((x) => x.id === id)
  if (!u) throw new Error(`Unknown unit: ${id}`)
  return u
}

const toKmPerLitre = (value: number, id: string): number => (id === 'l100km' ? unit(id).factor / value : value * unit(id).factor)
const fromKmPerLitre = (kmPerLitre: number, id: string): number => (id === 'l100km' ? unit(id).factor / kmPerLitre : kmPerLitre / unit(id).factor)

/** Fuel economy has an inverse unit (L/100 km), so the conversion is not a single multiplication. */
export function convertFuelEconomy(value: number, fromUnitId: string, toUnitId: string): number {
  if (fromUnitId === toUnitId) return value
  return fromKmPerLitre(toKmPerLitre(value, fromUnitId), toUnitId)
}

/** Zero (and anything non-positive) is meaningless: 0 km/L is infinite L/100 km and vice versa. */
export function validateFuelEconomy(value: number): string | null {
  return value > 0 ? null : 'Fuel economy must be greater than zero.'
}

export const fuelEconomyConverter: ConverterConfig = {
  id: 'fuel-economy',
  title: 'Fuel Economy Converter',
  description: 'Convert between km/L, L/100 km, and US and UK miles per gallon.',
  units: fuelUnits,
  defaultFromUnit: 'kmpl',
  defaultToUnit: 'l100km',
  convert: convertFuelEconomy,
  validate: (value) => validateFuelEconomy(value),
  allowNegative: false,
  displayDigits: 6,
  notes: [
    'km/L and L/100 km are inverses of each other: L/100 km = 100 ÷ (km/L).',
    'A US gallon is 3.785411784 L and a UK (imperial) gallon is 4.54609 L, so MPG (UK) is about 1.2 × MPG (US) for the same car.',
    'Lower L/100 km means better economy, while higher km/L and MPG mean better economy.',
    'Zero is not accepted. Results show up to 6 significant digits.',
  ],
}
