import { lazy, Suspense, type ComponentType } from 'react'
import type { CategoryConfig, ConverterConfig } from '../../types/converter.ts'
import TimeConverter from './TimeConverter.tsx'
import TimeZoneConverter from './TimeZoneConverter.tsx'
const GoldRateConverter = lazy(() => import('./GoldRateConverter.tsx'))
const GoldPurityConverter = lazy(() => import('./GoldPurityConverter.tsx'))
const CurrencyConverter = lazy(() => import('./CurrencyConverter.tsx'))
import UnitConverter from './UnitConverter.tsx'

/** Categories that need a richer UI than the generic unit converter register here by id. */
const customConfigViews: Record<string, ComponentType<{ config: ConverterConfig }>> = {
  time: TimeConverter,
}

/** Categories with their own self-contained UI (no unit table). */
const standaloneViews: Record<string, ComponentType> = {
  'time-zone': TimeZoneConverter,
  'gold-rate': GoldRateConverter,
  'gold-purity': GoldPurityConverter,
  currency: CurrencyConverter,
}

export default function ConverterView({ category }: { category: CategoryConfig }) {
  const Standalone = standaloneViews[category.id]
  if (Standalone) return <Suspense fallback={<p role="status">Loading…</p>}><Standalone /></Suspense>
  if (!category.converter) return null
  const View = customConfigViews[category.id] ?? UnitConverter
  return <View config={category.converter} />
}
