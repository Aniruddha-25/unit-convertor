import type { ConverterConfig, UnitDefinition } from '../../types/converter.ts'
import { convertByFactor } from '../../utils/conversionUtils.ts'

/**
 * Base unit: US DOLLAR. `factor` = USD per 1 unit of the currency.
 * Static, approximate reference rates (not live) - update RATES_AS_OF when refreshing.
 */
export const RATES_AS_OF = 'November 2026'

export const currencyUnits: readonly UnitDefinition[] = [
  { id: 'usd', name: 'US Dollar', symbol: 'USD', factor: 1 },
  { id: 'eur', name: 'Euro', symbol: 'EUR', factor: 1.08 },
  { id: 'gbp', name: 'British Pound', symbol: 'GBP', factor: 1.27 },
  { id: 'inr', name: 'Indian Rupee', symbol: 'INR', factor: 0.012 },
  { id: 'jpy', name: 'Japanese Yen', symbol: 'JPY', factor: 0.0064 },
  { id: 'cad', name: 'Canadian Dollar', symbol: 'CAD', factor: 0.73 },
  { id: 'aud', name: 'Australian Dollar', symbol: 'AUD', factor: 0.65 },
  { id: 'chf', name: 'Swiss Franc', symbol: 'CHF', factor: 1.12 },
  { id: 'cny', name: 'Chinese Yuan', symbol: 'CNY', factor: 0.138 },
  { id: 'aed', name: 'UAE Dirham', symbol: 'AED', factor: 0.2723 },
  { id: 'sgd', name: 'Singapore Dollar', symbol: 'SGD', factor: 0.74 },
]

export function convertCurrency(value: number, fromUnitId: string, toUnitId: string): number {
  return convertByFactor(currencyUnits, value, fromUnitId, toUnitId)
}

export const currencyConverter: ConverterConfig = {
  id: 'currency',
  title: 'Currency Converter',
  description: 'Convert between major world currencies using approximate reference rates.',
  units: currencyUnits,
  defaultFromUnit: 'usd',
  defaultToUnit: 'inr',
  convert: convertCurrency,
  allowNegative: false,
  notes: [
    `Rates are fixed, approximate values (as of ${RATES_AS_OF}), not live market rates.`,
    'US dollars are the base: base = input × source rate; result = base ÷ target rate.',
    'Real exchange rates change constantly and banks add fees; do not use for transactions.',
  ],
}
