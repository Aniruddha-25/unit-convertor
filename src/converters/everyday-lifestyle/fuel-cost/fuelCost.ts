import { parseInput } from '../../../utils/conversionUtils.ts'

export interface FuelCostResult {
  /** Distance actually used (doubled for a round trip), in km */
  distanceKm: number
  litres: number
  totalCost: number
  costPerKm: number
}

/** Fuel required = distance ÷ mileage; cost = fuel × price per litre; cost per km = cost ÷ distance. */
export function calculateFuelCost(distanceKm: number, mileageKmPerL: number, pricePerLitre: number, roundTrip: boolean): FuelCostResult {
  const distance = roundTrip ? distanceKm * 2 : distanceKm
  const litres = distance / mileageKmPerL
  const totalCost = litres * pricePerLitre
  return { distanceKm: distance, litres, totalCost, costPerKm: totalCost / distance }
}

export interface FuelCostFields {
  distance: string
  mileage: string
  price: string
}

export type FuelCostErrors = Partial<Record<keyof FuelCostFields, string>>

/**
 * Validates the three text inputs and computes the result when all are usable.
 * Empty fields give no error and no result yet. Distance and mileage must be above zero (they are divisors);
 * a fuel price of zero is allowed. Negative, non-numeric and overflowing values are rejected.
 */
export function evaluateFuelCost(fields: FuelCostFields, roundTrip: boolean): { errors: FuelCostErrors; result: FuelCostResult | null } {
  const errors: FuelCostErrors = {}
  const values: Partial<Record<keyof FuelCostFields, number>> = {}
  const rules: Array<[keyof FuelCostFields, string, boolean]> = [
    ['distance', 'Distance must be greater than zero.', true],
    ['mileage', 'Mileage must be greater than zero.', true],
    ['price', '', false],
  ]
  for (const [key, zeroMessage, mustBePositive] of rules) {
    const parsed = parseInput(fields[key], false)
    if (parsed.kind === 'error') errors[key] = parsed.message
    else if (parsed.kind === 'ok') {
      if (mustBePositive && parsed.value === 0) errors[key] = zeroMessage
      else values[key] = parsed.value
    }
  }
  if (values.distance === undefined || values.mileage === undefined || values.price === undefined) return { errors, result: null }
  const result = calculateFuelCost(values.distance, values.mileage, values.price, roundTrip)
  if (![result.litres, result.totalCost, result.costPerKm].every(Number.isFinite)) {
    return { errors: { ...errors, distance: 'The result is too large to represent.' }, result: null }
  }
  return { errors, result }
}
