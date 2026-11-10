import { useId, useMemo, useState } from 'react'
import { categoryIcons } from '../../../components/shared/categoryIcons/categoryIcons.ts'
import { buildCurrencyList } from '../currency/currencyData.ts'
import { convertAmount, formatAmount } from '../currency/currencyMath.ts'
import { combineStatus, formatProviderTime, isProviderOutdated, type LiveStatus } from '../shared/status.ts'
import StatusBadge from '../shared/StatusBadge.tsx'
import { GOLD_OUTDATED_AFTER_MS, usdPerGram } from './goldMath.ts'
import { findPurity, purities, purityBreakdown, purityOptionLabel } from './purity.ts'
import { weightUnits } from './weight.ts'
import { formatCompact, formatNumber, parseInput } from '../../../utils/conversionUtils.ts'
import AppIcon from '../../../components/shared/AppIcon/AppIcon.tsx'
import CurrencyCombobox from '../currency/CurrencyCombobox.tsx'
import { useExchangeRates } from '../currency/useExchangeRates.ts'
import { useGoldPrice } from './useGoldPrice.ts'
import '../../../components/shared/converter.css'
import './Gold.css'

/** Units offered: milligram, gram, kilogram and tola. */
const UNITS = weightUnits.filter((u) => u.id !== 'ozt')
const DEFAULTS = { weight: '10', unit: 'g', purity: '22k', currency: 'INR' }

/**
 * One converter, one set of inputs, two results: the gold value (live price) and the pure gold
 * content (pure arithmetic). The content never depends on the network, so it works when the price feed is down.
 */
export default function GoldConverter() {
  const uid = useId()
  const gold = useGoldPrice()
  const fx = useExchangeRates()
  const [weight, setWeight] = useState(DEFAULTS.weight)
  const [unitId, setUnitId] = useState(DEFAULTS.unit)
  const [purityId, setPurityId] = useState(DEFAULTS.purity)
  const [currencyCode, setCurrencyCode] = useState(DEFAULTS.currency)

  const fxRates = fx.snapshot?.rates
  const rates = useMemo(() => fxRates ?? { USD: 1 }, [fxRates])
  const currencies = useMemo(() => buildCurrencyList(Object.keys(rates)), [rates])
  // If the exchange-rate feed is down, fall back to USD (the gold quote's own currency) rather than guess.
  const currency = currencies.find((c) => c.code === currencyCode) ?? currencies.find((c) => c.code === 'USD')
  const fellBack = currency !== undefined && currency.code !== currencyCode

  const parsed = parseInput(weight, false)
  const purity = findPurity(purityId)
  const spot = gold.snapshot?.usdPerTroyOunce ?? null

  // Purity content: weight, unit and purity only.
  const content = parsed.kind === 'ok' ? purityBreakdown(parsed.value, unitId, purity.fineness) : null
  const contentOk = content !== null && Number.isFinite(content.totalGrams) && Number.isFinite(content.pureGrams)

  // Value: the same weight and purity, priced at the live spot rate.
  const money = (usd: number) => (currency ? convertAmount(usd, 'USD', currency.code, rates) : NaN)
  const perGram = spot !== null && currency ? money(usdPerGram(spot, purity)) : null
  const value = contentOk && perGram !== null ? perGram * content.totalGrams : null
  const valueOk = value !== null && Number.isFinite(value)

  // The price is in USD, so converting to another currency also depends on the exchange rates.
  const status: LiveStatus | null = currency && currency.code !== 'USD' ? combineStatus(gold.status, fx.status) : gold.status
  const loading = gold.loading || fx.loading
  const weightError = parsed.kind === 'error' ? parsed.message : content && !contentOk ? 'The result is too large to represent.' : null
  const fmt = (v: number) => (currency ? formatAmount(v, currency.decimals) : String(v))
  const reset = () => {
    setWeight(DEFAULTS.weight)
    setUnitId(DEFAULTS.unit)
    setPurityId(DEFAULTS.purity)
    setCurrencyCode(DEFAULTS.currency)
  }

  return (
    <section className="uc gc" aria-labelledby={`${uid}-title`}>
      <h2 id={`${uid}-title`}>
        <AppIcon icon={categoryIcons.gold} />
        Gold Converter
      </h2>

      <div className="gc-inputs">
        <div className="uc-field">
          <label htmlFor={`${uid}-w`}>Gold weight</label>
          <input
            id={`${uid}-w`}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Enter a weight"
            aria-invalid={weightError !== null}
            aria-describedby={weightError ? `${uid}-err` : undefined}
          />
        </div>
        <div className="uc-field">
          <label htmlFor={`${uid}-u`}>Unit</label>
          <select id={`${uid}-u`} value={unitId} onChange={(e) => setUnitId(e.target.value)}>
            {UNITS.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.symbol})
              </option>
            ))}
          </select>
        </div>
        <div className="uc-field">
          <label htmlFor={`${uid}-p`}>Purity</label>
          <select id={`${uid}-p`} value={purityId} onChange={(e) => setPurityId(e.target.value)}>
            {purities.map((p) => (
              <option key={p.id} value={p.id}>
                {purityOptionLabel(p)}
              </option>
            ))}
          </select>
        </div>
        {currency && <CurrencyCombobox label="Currency" value={currency} currencies={currencies} onChange={setCurrencyCode} />}
      </div>
      {weightError && (
        <p id={`${uid}-err`} className="uc-error" role="alert">
          {weightError}
        </p>
      )}

      <div className="gc-results" aria-live="polite">
        <div className="gc-col">
          <span className="gc-k">Gold value (spot estimate)</span>
          {valueOk && currency ? (
            <>
              <span className="gc-v">
                {fmt(value)} <span className="gc-unit">{currency.code}</span>
              </span>
              <span className="gc-sub">
                {fmt(perGram!)} {currency.code} per gram · {purity.label}
              </span>
            </>
          ) : gold.snapshot ? (
            <span className="gc-empty">{weightError ? 'Fix the weight to see a value.' : 'Enter a weight to see a value.'}</span>
          ) : (
            <span className="gc-empty" role={gold.error ? 'alert' : 'status'}>
              {gold.loading
                ? 'Loading gold price…'
                : gold.status === 'offline'
                  ? "You're offline. The price will load when the connection returns."
                  : gold.error
                    ? `${gold.error} Retrying automatically.`
                    : 'No gold price available.'}
            </span>
          )}

          <span className="gc-meta">
            <StatusBadge status={status} loading={loading} />
            {gold.snapshot && (
              <span>
                Updated {formatProviderTime(gold.snapshot.providerUpdatedAt)}
              </span>
            )}
            {loading && gold.snapshot && <span>Updating…</span>}
          </span>
          {gold.error && gold.snapshot && gold.status !== 'offline' && <span className="gc-warn">{gold.error} Showing the last saved price.</span>}
          {gold.snapshot && !gold.error && isProviderOutdated(gold.snapshot.providerUpdatedAt, gold.now, GOLD_OUTDATED_AFTER_MS) && (
            <span className="gc-warn">This gold price is more than 72 hours old.</span>
          )}
          {fellBack && <span className="gc-warn">Exchange rates for {currencyCode} are unavailable, so values are shown in USD.</span>}
        </div>

        <div className="gc-col">
          <span className="gc-k">Pure gold content</span>
          {content && contentOk ? (
            <>
              <span className="gc-v">{formatCompact(content.pureGrams)} g</span>
              <span className="gc-sub">Other metals {formatCompact(content.alloyGrams)} g</span>
              <span className="gc-meta">
                <span>{formatNumber(content.percent)}% pure</span>
                <span>Fineness {content.fineness}</span>
                <span>{content.karat}K</span>
              </span>
            </>
          ) : (
            <span className="gc-empty">{weightError ? 'Fix the weight to see the content.' : 'Enter a weight to see the content.'}</span>
          )}
        </div>
      </div>

      <button type="button" className="gc-reset" onClick={reset}>
        Reset
      </button>
    </section>
  )
}
