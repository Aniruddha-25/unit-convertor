export interface WeightUnit {
  id: string
  name: string
  symbol: string
  /** grams per unit */
  grams: number
}

export const GRAMS_PER_TROY_OUNCE = 31.1034768

/** Troy ounce = 31.1034768 g exactly. Tola = 11.6638038 g (Indian/British-India standard, 180 troy grains). */
export const weightUnits: readonly WeightUnit[] = [
  { id: 'mg', name: 'Milligram', symbol: 'mg', grams: 0.001 },
  { id: 'g', name: 'Gram', symbol: 'g', grams: 1 },
  { id: 'tola', name: 'Tola', symbol: 'tola', grams: 11.6638038 },
  { id: 'ozt', name: 'Troy ounce', symbol: 'ozt', grams: GRAMS_PER_TROY_OUNCE },
  { id: 'kg', name: 'Kilogram', symbol: 'kg', grams: 1000 },
]

export function findWeightUnit(id: string): WeightUnit {
  const u = weightUnits.find((w) => w.id === id)
  if (!u) throw new Error(`Unknown weight unit: ${id}`)
  return u
}

export const toGrams = (value: number, unitId: string): number => value * findWeightUnit(unitId).grams
export const fromGrams = (grams: number, unitId: string): number => grams / findWeightUnit(unitId).grams
