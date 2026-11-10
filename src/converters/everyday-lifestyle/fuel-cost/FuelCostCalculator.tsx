import { useId, useState } from 'react'
import AppIcon from '../../../components/shared/AppIcon/AppIcon.tsx'
import { categoryIcons } from '../../../components/shared/categoryIcons/categoryIcons.ts'
import '../../../components/shared/converter.css'
import CurrencyCopyButton from '../../../components/shared/CurrencyCopyButton/CurrencyCopyButton.tsx'
import { formatNumber } from '../../../utils/conversionUtils.ts'
import CurrencyCombobox from '../../finance/currency/CurrencyCombobox.tsx'
import { buildCurrencyList } from '../../finance/currency/currencyData.ts'
import { formatAmount } from '../../finance/currency/currencyMath.ts'
import { evaluateFuelCost, type FuelCostFields } from './fuelCost.ts'
import './FuelCost.css'

/** Prices are only displayed (never converted), so a fixed list of common currencies is enough. */
const CURRENCIES = buildCurrencyList(['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'AED', 'SGD', 'CHF', 'CNY'])
const DEFAULTS = { fields: { distance: '100', mileage: '15', price: '100' } as FuelCostFields, roundTrip: false, currency: 'INR' }

export default function FuelCostCalculator() {
  const uid = useId()
  const [fields, setFields] = useState<FuelCostFields>(DEFAULTS.fields)
  const [roundTrip, setRoundTrip] = useState(DEFAULTS.roundTrip)
  const [currencyCode, setCurrencyCode] = useState(DEFAULTS.currency)

  const currency = CURRENCIES.find((c) => c.code === currencyCode) ?? CURRENCIES[0]
  const { errors, result } = evaluateFuelCost(fields, roundTrip)
  const set = (key: keyof FuelCostFields) => (e: React.ChangeEvent<HTMLInputElement>) => setFields((f) => ({ ...f, [key]: e.target.value }))
  const money = (value: number, extraDecimals = 0) => formatAmount(value, currency.decimals + extraDecimals)
  const reset = () => {
    setFields(DEFAULTS.fields)
    setRoundTrip(DEFAULTS.roundTrip)
    setCurrencyCode(DEFAULTS.currency)
  }

  const field = (key: keyof FuelCostFields, label: string, placeholder: string) => (
    <div className="uc-field">
      <label htmlFor={`${uid}-${key}`}>{label}</label>
      <input
        id={`${uid}-${key}`}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={fields[key]}
        onChange={set(key)}
        placeholder={placeholder}
        aria-invalid={errors[key] !== undefined}
        aria-describedby={errors[key] ? `${uid}-${key}-err` : undefined}
      />
      {errors[key] && (
        <p id={`${uid}-${key}-err`} className="uc-error" role="alert">
          {errors[key]}
        </p>
      )}
    </div>
  )

  return (
    <section className="uc fc" aria-labelledby={`${uid}-title`}>
      <h2 id={`${uid}-title`}>
        <AppIcon icon={categoryIcons['fuel-cost']} />
        Fuel Cost Calculator
      </h2>
      <p className="uc-desc">Estimate the fuel needed and what a journey will cost.</p>

      <div className="fc-inputs">
        {field('distance', 'Distance (km)', 'e.g. 120')}
        {field('mileage', 'Vehicle mileage (km/L)', 'e.g. 15')}
        {field('price', `Fuel price (${currency.code} per litre)`, 'e.g. 100')}
        <CurrencyCombobox label="Currency" value={currency} currencies={CURRENCIES} onChange={setCurrencyCode} />
      </div>

      <label className="fc-check">
        <input type="checkbox" checked={roundTrip} onChange={(e) => setRoundTrip(e.target.checked)} />
        Round trip (twice the distance)
      </label>

      <div className="uc-result" aria-live="polite">
        {result ? (
          <>
            <span className="uc-result-eq">
              {formatNumber(result.distanceKm)} km{roundTrip ? ' (round trip)' : ''} at {formatNumber(Number(fields.mileage))} km/L
            </span>
            <span className="uc-result-value">
              {money(result.totalCost)} <span className="uc-result-unit">{currency.code}</span>
            </span>
            <span className="uc-result-name">Total estimated fuel cost</span>
          </>
        ) : (
          <span className="uc-result-empty">
            {Object.keys(errors).length > 0 ? 'Fix the input to see a result.' : 'Enter distance, mileage and fuel price.'}
          </span>
        )}
      </div>

      {result && (
        <div className="uc-actions">
          <CurrencyCopyButton amount={result.totalCost} currencyCode={currency.code} decimals={currency.decimals} />
        </div>
      )}

      {result && (
        <dl className="fc-facts">
          <dt>Fuel required</dt>
          <dd>{formatNumber(result.litres, 6)} L</dd>
          <dt>Cost per km</dt>
          <dd>
            {money(result.costPerKm, 2)} {currency.code}
          </dd>
        </dl>
      )}

      <div className="uc-actions">
        <button type="button" className="uc-clear" onClick={reset}>
          Reset
        </button>
      </div>
    </section>
  )
}
