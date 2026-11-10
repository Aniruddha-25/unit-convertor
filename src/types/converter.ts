/** A single unit. `factor` = how many base units one of this unit equals. */
export interface UnitDefinition {
  id: string
  name: string
  symbol: string
  factor: number
}

/** Everything the shared <UnitConverter /> needs. Add a new category by providing one of these. */
export interface ConverterConfig {
  id: string
  title: string
  description: string
  units: readonly UnitDefinition[]
  defaultFromUnit: string
  defaultToUnit: string
  /** Pure conversion function; kept outside the UI. */
  convert: (value: number, fromUnitId: string, toUnitId: string) => number
  /** Whether negative inputs are meaningful (default true). */
  allowNegative?: boolean
  /** Reject an input before converting (e.g. zero); return the message to show, or null if it is fine. */
  validate?: (value: number, fromUnitId: string) => string | null
  /** Significant digits shown in results (default 12). */
  displayDigits?: number
}

export type CategoryStatus = 'available' | 'coming-soon'

export interface CategoryConfig {
  id: string
  name: string
  groupId: string
  description: string
  status: CategoryStatus
  /** Generic unit-converter config. Available categories provide this OR a standalone view (see ConverterView). */
  converter?: ConverterConfig
}

export interface CategoryGroup {
  id: string
  name: string
}
