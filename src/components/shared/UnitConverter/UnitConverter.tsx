import { useId, useMemo, useState } from 'react'
import type { ConverterConfig } from '../../../types/converter.ts'
import { findUnit, formatNumber, parseInput } from '../../../utils/conversionUtils.ts'
import { categoryIcons } from '../categoryIcons/categoryIcons.ts'
import AppIcon from '../AppIcon/AppIcon.tsx'
import CopyButton from '../CopyButton/CopyButton.tsx'
import '../converter.css'

interface Props {
  config: ConverterConfig
  /** Render the title/description (default). TimeConverter supplies its own. */
  showHeader?: boolean
}

/** Generic converter UI: driven entirely by `config`, no category-specific code. */
export default function UnitConverter({ config, showHeader = true }: Props) {
  const [input, setInput] = useState('1')
  const [fromId, setFromId] = useState(config.defaultFromUnit)
  const [toId, setToId] = useState(config.defaultToUnit)
  const uid = useId()

  const parsed = useMemo(() => parseInput(input, config.allowNegative ?? true), [input, config.allowNegative])
  const from = findUnit(config.units, fromId)
  const to = findUnit(config.units, toId)

  const outcome = useMemo(() => {
    if (parsed.kind !== 'ok') return null
    const invalid = config.validate?.(parsed.value, fromId)
    if (invalid) return { error: invalid }
    const result = config.convert(parsed.value, fromId, toId)
    if (!Number.isFinite(result)) return { error: 'The result is too large or too small to represent.' }
    return { text: formatNumber(result, config.displayDigits) }
  }, [parsed, config, fromId, toId])

  const error = parsed.kind === 'error' ? parsed.message : outcome && 'error' in outcome ? outcome.error : null
  const result = outcome && 'text' in outcome ? outcome.text : null

  const swap = () => {
    setFromId(toId)
    setToId(fromId)
  }
  const reset = () => {
    setInput('')
    setFromId(config.defaultFromUnit)
    setToId(config.defaultToUnit)
  }

  const unitSelect = (id: string, value: string, onChange: (v: string) => void, label: string) => (
    <div className="uc-field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {config.units.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} ({u.symbol})
          </option>
        ))}
      </select>
    </div>
  )

  return (
    <section className="uc" aria-labelledby={showHeader ? `${uid}-title` : undefined} aria-label={showHeader ? undefined : `${config.title} (duration)`}>
      {showHeader && (
        <>
          <h2 id={`${uid}-title`}>
            <AppIcon icon={categoryIcons[config.id]} />
            {config.title}
          </h2>
          <p className="uc-desc">{config.description}</p>
        </>
      )}

      <div className="uc-field">
        <label htmlFor={`${uid}-value`}>Value</label>
        <input
          id={`${uid}-value`}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter a number"
          aria-invalid={error !== null}
          aria-describedby={error ? `${uid}-err` : undefined}
        />
        {error && (
          <p id={`${uid}-err`} className="uc-error" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="uc-units">
        {unitSelect(`${uid}-from`, fromId, setFromId, 'From')}
        <button type="button" className="uc-swap" onClick={swap} aria-label="Swap units" title="Swap units">
          ⇄
        </button>
        {unitSelect(`${uid}-to`, toId, setToId, 'To')}
      </div>

      <div className="uc-result" aria-live="polite">
        {result !== null && parsed.kind === 'ok' ? (
          <>
            <span className="uc-result-eq">
              {formatNumber(parsed.value)} {from.symbol} =
            </span>
            <span className="uc-result-value">
              {result} <span className="uc-result-unit">{to.symbol}</span>
            </span>
            <span className="uc-result-name">{to.name}</span>
          </>
        ) : (
          <span className="uc-result-empty">{error ? 'Fix the input to see a result.' : 'Enter a value to convert.'}</span>
        )}
      </div>

      <div className="uc-actions">
        {result && parsed.kind === 'ok' && <CopyButton text={config.copyUnit ? `${result} ${config.copyUnit(to)}` : result.replace(/,/g, '')} />}
        <button type="button" className="uc-clear" onClick={reset}>
          Clear
        </button>
      </div>
    </section>
  )
}
