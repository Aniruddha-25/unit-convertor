import { useId, useMemo, useState } from 'react'
import { buildCurrencyList } from './currencyData.ts'
import { convertAmount, formatAmount } from './currencyMath.ts'
import { parseInput } from '../../../utils/conversionUtils.ts'
import { categoryIcons } from '../../../components/shared/categoryIcons/categoryIcons.ts'
import AppIcon from '../../../components/shared/AppIcon/AppIcon.tsx'
import CopyButton from '../../../components/shared/CopyButton/CopyButton.tsx'
import CurrencyCombobox from './CurrencyCombobox.tsx'
import { formatProviderTime } from '../shared/status.ts'
import StatusBadge from '../shared/StatusBadge.tsx'
import { useExchangeRates } from './useExchangeRates.ts'
import '../../../components/shared/converter.css'
import './CurrencyConverter.css'

/** Zero-decimal currencies (JPY) still show cents for small results so 1.68 does not become 2. */
const resultDecimals = (value: number, decimals: number) => (Math.abs(value) < 100 ? Math.max(decimals, 2) : decimals)

export default function CurrencyConverter() {
  const uid = useId()
  const { snapshot, status, loading, error, refresh } = useExchangeRates()
  const [input, setInput] = useState('1')
  const [fromCode, setFromCode] = useState('USD')
  const [toCode, setToCode] = useState('INR')

  const currencies = useMemo(() => (snapshot ? buildCurrencyList(Object.keys(snapshot.rates)) : []), [snapshot])
  const from = currencies.find((c) => c.code === fromCode)
  const to = currencies.find((c) => c.code === toCode)
  const parsed = parseInput(input, false)

  const computed = useMemo(() => {
    if (!snapshot || !from || !to || parsed.kind !== 'ok') return null
    const value = convertAmount(parsed.value, from.code, to.code, snapshot.rates)
    if (!Number.isFinite(value)) return { ok: false as const, error: 'The result is too large to represent.' }
    const unit = convertAmount(1, from.code, to.code, snapshot.rates)
    return { ok: true as const, value, unit }
  }, [snapshot, from, to, parsed])

  const inputError = parsed.kind === 'error' ? parsed.message : computed && !computed.ok ? computed.error : null
  const swap = () => {
    setFromCode(toCode)
    setToCode(fromCode)
  }

  let body
  if (!snapshot) {
    body = (
      <div className="cc-state" role={error ? 'alert' : 'status'}>
        {loading ? 'Loading exchange rates…' : error ?? 'No exchange rates available.'}
        {!loading && (
          <button type="button" className="uc-clear" onClick={refresh}>
            Try again
          </button>
        )}
      </div>
    )
  } else if (!from || !to) {
    body = <div className="cc-state">Selected currency is not available in the latest rates.</div>
  } else {
    body = (
      <>
        <div className="uc-field">
          <label htmlFor={`${uid}-amount`}>Amount</label>
          <div className="cc-inputwrap">
            <span className="cc-symbol" aria-hidden="true">{from.symbol}</span>
            <input
              id={`${uid}-amount`}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter an amount"
              aria-invalid={inputError !== null}
              aria-describedby={inputError ? `${uid}-err` : undefined}
            />
          </div>
          {inputError && (
            <p id={`${uid}-err`} className="uc-error" role="alert">
              {inputError}
            </p>
          )}
        </div>

        <div className="uc-units">
          <CurrencyCombobox label="From" value={from} currencies={currencies} onChange={setFromCode} />
          <button type="button" className="uc-swap" onClick={swap} aria-label="Swap currencies" title="Swap currencies">
            ⇄
          </button>
          <CurrencyCombobox label="To" value={to} currencies={currencies} onChange={setToCode} />
        </div>

        <div className="uc-result" aria-live="polite">
          {computed?.ok && parsed.kind === 'ok' ? (
            <>
              <span className="uc-result-eq">
                {formatAmount(parsed.value, from.decimals)} {from.code} =
              </span>
              <span className="uc-result-value">
                {formatAmount(computed.value, resultDecimals(computed.value, to.decimals))} <span className="uc-result-unit">{to.code}</span>
              </span>
              <span className="uc-result-name">
                {to.name} · 1 {from.code} = {formatAmount(computed.unit, Math.max(to.decimals, 4))} {to.code}
              </span>
            </>
          ) : (
            <span className="uc-result-empty">{inputError ? 'Fix the input to see a result.' : 'Enter an amount to convert.'}</span>
          )}
        </div>

        <div className="uc-actions">
          {computed?.ok && (
            <CopyButton text={computed.value.toFixed(to.decimals).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')} label="Copy result" />
          )}
          <button type="button" className="uc-clear" onClick={() => setInput('')}>
            Clear
          </button>
        </div>
      </>
    )
  }

  return (
    <section className="uc" aria-labelledby={`${uid}-title`}>
      <h2 id={`${uid}-title`}>
        <AppIcon icon={categoryIcons.currency} />
        Currency Converter
      </h2>
      <p className="uc-desc">Convert between world currencies using the latest exchange rates.</p>

      <div className="cc-info">
        <div className="cc-info-head">
          <StatusBadge status={status} loading={loading} />
          <button type="button" className="uc-clear cc-refresh" onClick={refresh} disabled={loading}>
            {loading ? 'Refreshing…' : '↻ Refresh'}
          </button>
        </div>
        {snapshot && (
          <p className="cc-updated">
            Rates updated:{' '}
            {formatProviderTime(snapshot.providerUpdatedAt)}
          </p>
        )}
        {error && snapshot && (
          <p className="cc-warn" role="alert">
            {error} Showing {status === 'outdated' ? 'outdated' : 'previously saved'} rates.
          </p>
        )}
        {status === 'outdated' && !error && <p className="cc-warn">These rates are more than 48 hours old.</p>}
      </div>

      {body}

      <details className="uc-notes">
        <summary>Conversion notes</summary>
        <ul>
          <li>Rates are mid-market reference rates and exclude bank or card fees; do not use them for transactions.</li>
          <li>Live = fetched from the provider within the last 35 minutes. Cached = a saved or older copy. Outdated = provider data older than 48 hours.</li>
          <li>Rates refresh automatically every 30 minutes while this is open; the provider itself updates about once a day.</li>
          <li>
            Rates by <a href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer">ExchangeRate-API</a>. Flags by flag-icons.
          </li>
        </ul>
      </details>
    </section>
  )
}
