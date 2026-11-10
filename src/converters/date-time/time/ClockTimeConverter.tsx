import { useId, useState } from 'react'
import {
  format12,
  format24,
  secondsSinceMidnight,
  validateClock,
  type ClockInput,
} from '../../../components/shared/ClockTimeInput/clockTime.ts'
import { convertTime } from './timeConverter.ts'
import { timeUnits } from './timeUnits.ts'
import { formatNumber } from '../../../utils/conversionUtils.ts'
import ClockTimeInput from '../../../components/shared/ClockTimeInput/ClockTimeInput.tsx'
import '../../../components/shared/converter.css'
import '../../../components/shared/ClockTimeInput/ClockTime.css'
import CopyButton from '../../../components/shared/CopyButton/CopyButton.tsx'

/** Time-of-day input and conversion (12h ⇄ 24h, elapsed since midnight). Not a duration. */
export default function ClockTimeConverter() {
  const uid = useId()
  const [input, setInput] = useState<ClockInput>({ hour: '2', minute: '30', second: '00', format: '12h', meridiem: 'PM' })
  const [outUnit, setOutUnit] = useState('h')

  const result = validateClock(input)
  const elapsed = result.ok ? convertTime(secondsSinceMidnight(result.time), 's', outUnit) : null
  const unit = timeUnits.find((u) => u.id === outUnit)!

  return (
    <div className="ct">
      <p className="tc-note" role="note">
        Enter a <strong>time of day</strong> (like 2:30 PM). For an amount of time (like 2 hours 30 minutes), use the Duration tab.
      </p>

      <ClockTimeInput value={input} onChange={setInput} />

      <div className="uc-result ct-result" aria-live="polite">
        {result.ok ? (
          <>
            <div className="ct-line">
              <span className="uc-result-eq">24-hour</span>
              <span className="uc-result-value">{format24(result.time)}</span>
              <CopyButton text={format24(result.time)} />
            </div>
            <div className="ct-line">
              <span className="uc-result-eq">12-hour</span>
              <span className="uc-result-value">{format12(result.time)}</span>
            </div>
          </>
        ) : (
          <span className="uc-result-empty">Fix the highlighted fields to see the result.</span>
        )}
      </div>

      {result.ok && elapsed !== null && (
        <div className="ct-elapsed">
          <div className="uc-field">
            <label htmlFor={`${uid}-unit`}>Elapsed since midnight (00:00:00) in</label>
            <select id={`${uid}-unit`} value={outUnit} onChange={(e) => setOutUnit(e.target.value)}>
              {timeUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.symbol})
                </option>
              ))}
            </select>
          </div>
          <div className="ct-line">
            <span className="uc-result-value">
              {Number.isFinite(elapsed) ? formatNumber(elapsed) : '—'} <span className="uc-result-unit">{unit.symbol}</span>
            </span>
            {Number.isFinite(elapsed) && <CopyButton text={formatNumber(elapsed).replace(/,/g, '')} />}
          </div>
        </div>
      )}
    </div>
  )
}
