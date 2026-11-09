import type { CategoryConfig, CategoryGroup } from '../types/converter.ts'
import { timeConverter } from '../converters/time/timeConverter.ts'

export const categoryGroups: readonly CategoryGroup[] = [
  { id: 'physical', name: 'Physical Conversions' },
  { id: 'computer', name: 'Computer Conversions' },
  { id: 'datetime', name: 'Date & Time' },
  { id: 'other', name: 'Other Useful Conversions' },
]

type Soon = Omit<CategoryConfig, 'status' | 'converter' | 'description'> & { description?: string }

const soon = (c: Soon): CategoryConfig => ({
  ...c,
  description: c.description ?? `${c.name} conversion is on the way.`,
  status: 'coming-soon',
})

/**
 * To make a category functional: set status 'available' and attach a `converter`.
 */
export const categories: readonly CategoryConfig[] = [
  // Physical
  soon({ id: 'length', name: 'Length', groupId: 'physical' }),
  soon({ id: 'area', name: 'Area', groupId: 'physical' }),
  soon({ id: 'volume', name: 'Volume', groupId: 'physical' }),
  soon({ id: 'mass', name: 'Mass / Weight', groupId: 'physical' }),
  soon({ id: 'temperature', name: 'Temperature', groupId: 'physical' }),
  soon({ id: 'speed', name: 'Speed', groupId: 'physical' }),
  {
    id: 'time',
    name: 'Time',
    groupId: 'physical',
    description: timeConverter.description,
    status: 'available',
    converter: timeConverter,
  },
  soon({ id: 'pressure', name: 'Pressure', groupId: 'physical' }),
  soon({ id: 'energy', name: 'Energy', groupId: 'physical' }),
  soon({ id: 'power', name: 'Power', groupId: 'physical' }),
  soon({ id: 'force', name: 'Force', groupId: 'physical' }),
  soon({ id: 'density', name: 'Density', groupId: 'physical' }),
  soon({ id: 'frequency', name: 'Frequency', groupId: 'physical' }),
  soon({ id: 'angle', name: 'Angle', groupId: 'physical' }),
  // Computer
  soon({ id: 'data-storage', name: 'Data Storage', groupId: 'computer' }),
  soon({ id: 'data-rate', name: 'Data Transfer Rate', groupId: 'computer' }),
  // Date & Time
  soon({ id: 'time-duration', name: 'Time Duration', groupId: 'datetime' }),
  {
    id: 'time-zone',
    name: 'Time Zone',
    groupId: 'datetime',
    description: 'Convert a date and time between IANA time zones, with daylight saving handled.',
    status: 'available',
  },
  soon({ id: 'date-difference', name: 'Date Difference', groupId: 'datetime', description: 'Date difference calculation is a future feature.' }),
  // Other
  soon({ id: 'fuel-economy', name: 'Fuel Economy', groupId: 'other' }),
  soon({ id: 'cooking', name: 'Cooking Measurements', groupId: 'other' }),
  soon({ id: 'shoe-size', name: 'Shoe Size', groupId: 'other', description: 'Shoe size conversion is a future feature.' }),
]
