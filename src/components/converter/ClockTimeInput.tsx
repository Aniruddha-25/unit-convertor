import { useId, useState } from 'react'
import {
  switchFormat,
  validateClock,
  type ClockField,
  type ClockFormat,
  type ClockInput,
  type Meridiem,
} from '../../converters/time/clockTime.ts'
import ClockDial from './ClockDial.tsx'
import Segmented from './Segmented.tsx'

type Method = 'clock' | 'type'

const FIELDS: { id: ClockField; label: string }[] = [
  { id: 'hour', label: 'Hour' },
  { id: 'minute', label: 'Minute' },
  { id: 'second', label: 'Second' },
]
const NEXT: Record<ClockField, ClockField | null> = { hour: 'minute', minute: 'second', second: null }
const pad = (n: number) => String(n).padStart(2, '0')

const MERIDIEM_OPTIONS = [
  { value: 'AM', label: 'AM' },
  { value: 'PM', label: 'PM' },
] as const

interface Props {
  value: ClockInput
  onChange: (next: ClockInput) => void
  /** Dial only: hides the Clock/Type switch and the typed fields. */
  clockOnly?: boolean
}

/** Reusable time-of-day input: 12h/24h, clock dial or typed fields, with validation messages. Fully controlled. */
export default function ClockTimeInput({ value, onChange, clockOnly = false }: Props) {
  const uid = useId()
  const [pickedMethod, setMethod] = useState<Method>('clock')
  const method: Method = clockOnly ? 'clock' : pickedMethod
  const [active, setActive] = useState<ClockField>('hour')

  const result = validateClock(value)
  const errors = result.ok ? {} : result.errors
  const set = (field: ClockField, text: string) => onChange({ ...value, [field]: text })
  const setMeridiem = (meridiem: Meridiem) => onChange({ ...value, meridiem })

  const dialValue = (() => {
    const raw = value[active].trim()
    if (!/^\d{1,2}$/.test(raw)) return null
    const n = Number(raw)
    const [min, max] = active === 'hour' ? (value.format === '12h' ? [1, 12] : [0, 23]) : [0, 59]
    return n >= min && n <= max ? n : null
  })()

  const meridiemToggle = (
    <Segmented<Meridiem> label="AM or PM" value={value.meridiem} onChange={setMeridiem} options={MERIDIEM_OPTIONS} />
  )

  return (
    <div className="cti">
      <div className="tc-row">
        <Segmented<ClockFormat>
          label="Time format"
          value={value.format}
          onChange={(f) => onChange(switchFormat(value, f))}
          options={[
            { value: '12h', label: '12-hour' },
            { value: '24h', label: '24-hour' },
          ]}
        />
        {!clockOnly && (
        <Segmented<Method>
          label="Input method"
          value={method}
          onChange={setMethod}
          options={[
            { value: 'clock', label: 'Clock' },
            { value: 'type', label: 'Type' },
          ]}
        />
        )}
      </div>

      {method === 'clock' ? (
        <div className="ct-clock">
          <div className="ct-display" role="group" aria-label="Selected time">
            {FIELDS.map((f, i) => (
              <span key={f.id} className="ct-seg">
                {i > 0 && <span className="ct-colon" aria-hidden="true">:</span>}
                <button
                  type="button"
                  className={`ct-part${active === f.id ? ' on' : ''}${errors[f.id] ? ' bad' : ''}`}
                  aria-pressed={active === f.id}
                  aria-label={`Edit ${f.label.toLowerCase()}: ${value[f.id] || 'empty'}`}
                  onClick={() => setActive(f.id)}
                >
                  {value[f.id] === '' ? '--' : value[f.id].padStart(2, '0')}
                </button>
              </span>
            ))}
            {value.format === '12h' && meridiemToggle}
          </div>
          <p className="ct-step">Select the {active} on the dial</p>
          <ClockDial
            field={active}
            format={value.format}
            value={dialValue}
            onPick={(v) => set(active, active === 'hour' ? String(v) : pad(v))}
            onCommit={() => NEXT[active] && setActive(NEXT[active])}
          />
        </div>
      ) : (
        <div className="ct-type">
          {FIELDS.map((f) => (
            <div key={f.id} className="uc-field">
              <label htmlFor={`${uid}-${f.id}`}>{f.label}</label>
              <input
                id={`${uid}-${f.id}`}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={2}
                value={value[f.id]}
                onChange={(e) => set(f.id, e.target.value)}
                aria-invalid={!!errors[f.id]}
                aria-describedby={errors[f.id] ? `${uid}-${f.id}-err` : undefined}
              />
            </div>
          ))}
          {value.format === '12h' && (
            <div className="uc-field">
              <span className="ct-ampm-label">AM / PM</span>
              {meridiemToggle}
            </div>
          )}
        </div>
      )}

      {!result.ok && (
        <ul className="ct-errors" role="alert">
          {FIELDS.filter((f) => errors[f.id]).map((f) => (
            <li key={f.id} id={`${uid}-${f.id}-err`} className="uc-error">
              {errors[f.id]}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
