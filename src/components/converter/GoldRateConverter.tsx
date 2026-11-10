import { useId, useMemo, useState } from 'react'
import { categoryIcons } from '../../config/categoryIcons.ts'
import { buildCurrencyList } from '../../converters/currency/currencyData.ts'
import { convertAmount, formatAmount, formatTimestamp } from '../../converters/currency/currencyMath.ts'
import type { RateStatus } from '../../converters/currency/types.ts'
import { goldValueUsd, usdPerGram, worstStatus } from '../../converters/gold/goldMath.ts'
import { findPurity, purities } from '../../converters/gold/purity.ts'
import { findWeightUnit, toGrams, weightUnits } from '../../converters/gold/weight.ts'
import { formatNumber, parseInput } from '../../utils/conversionUtils.ts'
import AppIcon from '../layout/AppIcon.tsx'
import CopyButton from './CopyButton.tsx'
import CurrencyCombobox from './CurrencyCombobox.tsx'
import { useExchangeRates, useGoldPrice } from './useLiveData.ts'
import 'flag-icons/css/flag-icons.min.css'
import './UnitConverter.css'
import './CurrencyConverter.css'
import './Gold.css'

const STATUS_LABEL: Record<RateStatus, string> = { live: 'Live', cached: 'Cached', outdated: 'Outdated' }
const USER_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone
const DEFAULTS = { weight: '10', unit: 'g', purity: '22k', currency: 'INR' }

export default function GoldRateConverter() {
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

  const money = (usd: number) => (currency ? convertAmount(usd, 'USD', currency.code, rates) : NaN)
  const fmt = (v: number) => (currency ? formatAmount(v, currency.decimals) : String(v))

  function compute() {
    if (spot === null || parsed.kind !== 'ok' || !currency) return null
    const grams = toGrams(parsed.value, unitId)
    const value = convertAmount(goldValueUsd(grams, spot, purity), 'USD', currency.code, rates)
    if (!Number.isFinite(value) || !Number.isFinite(grams)) return { ok: false as const }
    return { ok: true as const, grams, value }
  }
  const calc = compute()

  const status: RateStatus | null =
    gold.status === null ? null : currency && currency.code !== 'USD' && fx.status ? worstStatus(gold.status, fx.status) : gold.status
  const loading = gold.loading || fx.loading
  const refresh = () => {
    gold.refresh()
    fx.refresh()
  }
  const inputError = parsed.kind === 'error' ? parsed.message : calc && !calc.ok ? 'The result is too large to represent.' : null
  const reset = () => {
    setWeight(DEFAULTS.weight)
    setUnitId(DEFAULTS.unit)
    setPurityId(DEFAULTS.purity)
    setCurrencyCode(DEFAULTS.currency)
  }

  return (
    <section className="uc gc" aria-labelledby={`${uid}-title`}>
      <h2 id={`${uid}-title`}>
        <AppIcon icon={categoryIcons['gold-rate']} />
        Gold Rate Converter
      </h2>
      <p className="uc-desc">Live gold prices by purity, with the value of any weight at the spot price.</p>

      <div className="cc-info">
        <div className="cc-info-head">
          {status ? (
            <span className={`cc-badge cc-${status}`}>{STATUS_LABEL[status]}</span>
          ) : (
            <span className="cc-badge cc-none">{loading ? 'Loading' : 'Unavailable'}</span>
          )}
          <button type="button" className="uc-clear cc-refresh" onClick={refresh} disabled={loading}>
            {loading ? 'Refreshing…' : '↻ Refresh'}
          </button>
        </div>
        {gold.snapshot && (
          <p className="cc-updated">
            Provider last updated:{' '}
            {gold.snapshot.providerUpdatedAt !== null
              ? formatTimestamp(gold.snapshot.providerUpdatedAt, USER_ZONE)
              : 'unavailable (not provided by the price service)'}
          </p>
        )}
        {gold.error && gold.snapshot && (
          <p className="cc-warn" role="alert">
            {gold.error} Showing the last saved price.
          </p>
        )}
        {gold.status === 'outdated' && !gold.error && <p className="cc-warn">This gold price is more than 72 hours old.</p>}
        {fx.error && currency?.code !== 'USD' && !fellBack && <p className="cc-warn">{fx.error} Currency conversion uses the last saved rates.</p>}
        {fellBack && (
          <p className="cc-warn" role="alert">
            Exchange rates for {currencyCode} are unavailable, so values are shown in USD.
          </p>
        )}
      </div>

      {!gold.snapshot || !currency ? (
        <div className="cc-state" role={gold.error ? 'alert' : 'status'}>
          {gold.loading ? 'Loading gold price…' : gold.error ?? 'No gold price available.'}
          {!gold.loading && (
            <button type="button" className="uc-clear" onClick={gold.refresh}>
              Try again
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="uc-field">
            <label htmlFor={`${uid}-w`}>Weight</label>
            <div className="gc-row">
              <input
                id={`${uid}-w`}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Enter a weight"
                aria-invalid={inputError !== null}
                aria-describedby={inputError ? `${uid}-err` : undefined}
              />
              <select aria-label="Weight unit" value={unitId} onChange={(e) => setUnitId(e.target.value)}>
                {weightUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.symbol})
                  </option>
                ))}
              </select>
            </div>
            {inputError && (
              <p id={`${uid}-err`} className="uc-error" role="alert">
                {inputError}
              </p>
            )}
          </div>

          <div className="gc-row gc-selects">
            <div className="uc-field">
              <label htmlFor={`${uid}-p`}>Purity</label>
              <select id={`${uid}-p`} value={purityId} onChange={(e) => setPurityId(e.target.value)}>
                {purities.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} ({p.fineness})
                  </option>
                ))}
              </select>
            </div>
            <CurrencyCombobox label="Currency" value={currency} currencies={currencies} onChange={setCurrencyCode} />
          </div>

          <div className="uc-result" aria-live="polite">
            {calc?.ok && parsed.kind === 'ok' ? (
              <>
                <span className="uc-result-eq">
                  {formatNumber(parsed.value)} {findWeightUnit(unitId).symbol} of {purity.label} gold ≈
                </span>
                <span className="uc-result-value">
                  {fmt(calc.value)} <span className="uc-result-unit">{currency.code}</span>
                </span>
                <span className="uc-result-name">
                  {fmt(money(usdPerGram(spot!, purity)))} {currency.code} per gram · estimate at spot price
                </span>
              </>
            ) : (
              <span className="uc-result-empty">{inputError ? 'Fix the input to see a result.' : 'Enter a weight to see its value.'}</span>
            )}
          </div>

          <div className="uc-actions">
            {calc?.ok && <CopyButton text={calc.value.toFixed(currency.decimals)} label="Copy value" />}
            <button type="button" className="uc-clear" onClick={() => setWeight('')}>
              Clear
            </button>
            <button type="button" className="uc-clear" onClick={reset}>
              Reset
            </button>
          </div>
        </>
      )}
    </section>
  )
}
