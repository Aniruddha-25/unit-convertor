import type { UnitDefinition } from '../types/converter.ts'

export type ParseResult =
  | { kind: 'empty' }
  | { kind: 'error'; message: string }
  | { kind: 'ok'; value: number }

// Plain decimal or scientific notation only (rejects "0x10", "Infinity", "1,5", etc.)
const NUMBER_PATTERN = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/

export function parseInput(raw: string, allowNegative = true): ParseResult {
  const text = raw.trim()
  if (text === '') return { kind: 'empty' }
  if (!NUMBER_PATTERN.test(text)) {
    return { kind: 'error', message: 'Enter a valid number (e.g. 12, 0.5, 1e6).' }
  }
  const value = Number(text)
  if (!Number.isFinite(value)) {
    return { kind: 'error', message: 'That number is too large to represent.' }
  }
  if (!allowNegative && value < 0) {
    return { kind: 'error', message: 'Negative values are not allowed here.' }
  }
  return { kind: 'ok', value }
}

export function findUnit(units: readonly UnitDefinition[], id: string): UnitDefinition {
  const unit = units.find((u) => u.id === id)
  if (!unit) throw new Error(`Unknown unit: ${id}`)
  return unit
}

/**
 * Generic linear conversion via a common base unit:
 *   base = value × from.factor;  result = base ÷ to.factor
 * No intermediate rounding.
 */
export function convertByFactor(
  units: readonly UnitDefinition[],
  value: number,
  fromId: string,
  toId: string,
): number {
  const base = value * findUnit(units, fromId).factor
  return base / findUnit(units, toId).factor
}

/**
 * Display formatting only (never feed the output back into math).
 * Uses up to 12 significant digits (doubles carry ~15-17), trims trailing
 * zeros, and switches to exponent notation for very large/small magnitudes.
 */
export function formatNumber(value: number, digits = 12): string {
  if (value === 0) return '0'
  const abs = Math.abs(value)
  if (abs >= 1e15 || abs < 1e-6) {
    return value.toExponential(digits - 3).replace(/\.?0+e/, 'e')
  }
  const rounded = Number(value.toPrecision(digits))
  return rounded.toLocaleString('en-US', { maximumFractionDigits: 12, useGrouping: true })
}

/** Compact display for derived values: 7 significant digits, grouped. Display only. */
export function formatCompact(value: number): string {
  return formatNumber(Number(value.toPrecision(7)))
}
