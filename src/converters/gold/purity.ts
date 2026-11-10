import { toGrams } from './weight.ts'

export interface Purity {
  id: string
  karat: number
  label: string
  /** parts of pure gold per 1000 - the single source of truth for every purity calculation */
  fineness: number
}

/** Standard purities. Karat and percentage are derived from / displayed alongside the fineness. */
export const purities: readonly Purity[] = [
  { id: '24k', karat: 24, label: '24K', fineness: 999 },
  { id: '22k', karat: 22, label: '22K', fineness: 916 },
  { id: '20k', karat: 20, label: '20K', fineness: 833 },
  { id: '18k', karat: 18, label: '18K', fineness: 750 },
  { id: '14k', karat: 14, label: '14K', fineness: 585 },
  { id: '9k', karat: 9, label: '9K', fineness: 375 },
]

export function findPurity(id: string): Purity {
  const p = purities.find((x) => x.id === id)
  if (!p) throw new Error(`Unknown purity: ${id}`)
  return p
}

/** Gold content as a percentage (916 -> 91.6). */
export const goldPercent = (fineness: number): number => fineness / 10

/** Mass of pure gold in `grams` of an alloy of the given fineness. */
export const pureGoldGrams = (grams: number, fineness: number): number => (grams * fineness) / 1000

/** Dropdown label: the purity as a percentage (916 -> "91.6%"). */
export const purityPercentLabel = (p: Purity): string => `${goldPercent(p.fineness)}%`

export const FINENESS_MAX = 1000

export type FinenessResult = { ok: true; value: number } | { ok: false; message: string }

/** Validate a user-entered fineness (parts per thousand, 0 < f <= 1000). */
export function parseFineness(raw: string): FinenessResult {
  const text = raw.trim()
  if (text === '') return { ok: false, message: 'Enter a fineness (e.g. 916).' }
  if (!/^(\d+\.?\d*|\.\d+)$/.test(text)) return { ok: false, message: 'Enter a valid fineness number (e.g. 916 or 999.9).' }
  const value = Number(text)
  if (!(value > 0)) return { ok: false, message: 'Fineness must be greater than 0.' }
  if (value > FINENESS_MAX) return { ok: false, message: `Fineness cannot exceed ${FINENESS_MAX}.` }
  return { ok: true, value }
}

/** Karat for a fineness: the standard label when it matches the table (916 -> 22), else fineness × 24 ÷ 1000. */
export function finenessToKarat(fineness: number): { karat: number; standard: boolean } {
  const std = purities.find((p) => p.fineness === fineness)
  return std ? { karat: std.karat, standard: true } : { karat: (fineness * 24) / 1000, standard: false }
}

export interface PurityBreakdown {
  totalGrams: number
  pureGrams: number
  alloyGrams: number
  /** pure gold as a percentage of the total, from the fineness */
  percent: number
  fineness: number
  karat: number
  standard: boolean
}

/**
 * Theoretical gold content for `weight` (in `unitId`) at the given fineness:
 *   pure = total × fineness / 1000     other metals = total − pure
 * Everything is computed in grams; the fineness is the only purity input.
 */
export function purityBreakdown(weight: number, unitId: string, fineness: number): PurityBreakdown {
  const totalGrams = toGrams(weight, unitId)
  const pureGrams = pureGoldGrams(totalGrams, fineness)
  const { karat, standard } = finenessToKarat(fineness)
  return { totalGrams, pureGrams, alloyGrams: totalGrams - pureGrams, percent: goldPercent(fineness), fineness, karat, standard }
}
