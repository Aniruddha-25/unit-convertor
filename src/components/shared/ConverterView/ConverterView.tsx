import { lazy, Suspense, type ComponentType } from 'react'
import type { CategoryConfig, ConverterConfig } from '../../../types/converter.ts'
import TimeConverter from '../../../converters/date-time/time/TimeConverter.tsx'
import TimeZoneConverter from '../../../converters/date-time/time-zone/TimeZoneConverter.tsx'
import UnitConverter from '../UnitConverter/UnitConverter.tsx'

const GoldConverter = lazy(() => import('../../../converters/finance/gold/GoldConverter.tsx'))
const CurrencyConverter = lazy(() => import('../../../converters/finance/currency/CurrencyConverter.tsx'))

/** Categories that need a richer UI than the generic unit converter register here by id. */
const customConfigViews: Record<string, ComponentType<{ config: ConverterConfig }>> = {
  time: TimeConverter,
}

/** Categories with their own self-contained UI (no unit table). */
const standaloneViews: Record<string, ComponentType> = {
  'time-zone': TimeZoneConverter,
  gold: GoldConverter,
  currency: CurrencyConverter,
}

export default function ConverterView({ category }: { category: CategoryConfig }) {
  const Standalone = standaloneViews[category.id]
  if (Standalone) return <Suspense fallback={<p role="status">Loading…</p>}><Standalone /></Suspense>
  if (!category.converter) return null
  const View = customConfigViews[category.id] ?? UnitConverter
  return <View config={category.converter} />
}
