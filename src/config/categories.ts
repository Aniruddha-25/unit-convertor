import type { CategoryConfig, CategoryGroup } from '../types/converter.ts'
import { timeConverter } from '../converters/time/timeConverter.ts'

export const categoryGroups: readonly CategoryGroup[] = [
  { id: 'basic', name: 'Basic Measurements' },
  { id: 'geometry', name: 'Geometry & Mathematics' },
  { id: 'motion', name: 'Motion & Mechanics' },
  { id: 'energy', name: 'Energy & Electrical' },
  { id: 'datetime', name: 'Date & Time' },
  { id: 'digital', name: 'Digital & Computing' },
  { id: 'finance', name: 'Finance' },
  { id: 'lifestyle', name: 'Everyday & Lifestyle' },
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
  // Basic Measurements
  soon({ id: 'length', name: 'Length', groupId: 'basic' }),
  soon({ id: 'area', name: 'Area', groupId: 'basic' }),
  soon({ id: 'volume', name: 'Volume', groupId: 'basic' }),
  soon({ id: 'mass', name: 'Mass / Weight', groupId: 'basic' }),
  soon({ id: 'temperature', name: 'Temperature', groupId: 'basic' }),
  // Geometry & Mathematics
  soon({ id: 'angle', name: 'Angle', groupId: 'geometry' }),
  soon({ id: 'density', name: 'Density', groupId: 'geometry' }),
  // Motion & Mechanics
  soon({ id: 'speed', name: 'Speed', groupId: 'motion' }),
  soon({ id: 'force', name: 'Force', groupId: 'motion' }),
  soon({ id: 'pressure', name: 'Pressure', groupId: 'motion' }),
  // Energy & Electrical
  soon({ id: 'energy', name: 'Energy', groupId: 'energy' }),
  soon({ id: 'power', name: 'Power', groupId: 'energy' }),
  soon({ id: 'frequency', name: 'Frequency', groupId: 'energy' }),
  // Date & Time
  {
    id: 'time',
    name: 'Time',
    groupId: 'datetime',
    description: timeConverter.description,
    status: 'available',
    converter: timeConverter,
  },
  soon({ id: 'time-duration', name: 'Time Duration', groupId: 'datetime' }),
  {
    id: 'time-zone',
    name: 'Time Zone',
    groupId: 'datetime',
    description: 'Convert a date and time between IANA time zones, with daylight saving handled.',
    status: 'available',
  },
  soon({ id: 'date-difference', name: 'Date Difference', groupId: 'datetime', description: 'Date difference calculation is a future feature.' }),
  // Digital & Computing
  soon({ id: 'data-storage', name: 'Data Storage', groupId: 'digital' }),
  soon({ id: 'data-rate', name: 'Data Transfer Rate', groupId: 'digital' }),
  // Finance
  {
    id: 'currency',
    name: 'Currency',
    groupId: 'finance',
    description: 'Convert between world currencies using the latest exchange rates.',
    status: 'available',
  },
  {
    id: 'gold',
    name: 'Gold Converter',
    groupId: 'finance',
    description: 'Live gold rates, plus pure gold and alloy content by weight and purity.',
    status: 'available',
  },
  // Everyday & Lifestyle
  soon({ id: 'fuel-economy', name: 'Fuel Economy', groupId: 'lifestyle' }),
  soon({ id: 'cooking', name: 'Cooking Measurements', groupId: 'lifestyle' }),
  soon({ id: 'shoe-size', name: 'Shoe Size', groupId: 'lifestyle', description: 'Shoe size conversion is a future feature.' }),
]
