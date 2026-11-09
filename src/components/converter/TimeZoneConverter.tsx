import { useId, useMemo, useState } from 'react'
import { toClockInput, validateClock, type ClockInput } from '../../converters/time/clockTime.ts'
import {
  convertZoned,
  dayDifference,
  describeDayDifference,
  formatIso8601,
  formatItineraryTime,
  formatLocalTime,
  listZones,
  localNow,
  parseIsoDate,
  zoneDisplayName,
  type Disambiguation,
  type LocalDateTime,
  type ZoneView,
} from '../../converters/timezone/timeZoneUtils.ts'
import Popover from '../layout/Popover.tsx'
import ClockTimeInput from './ClockTimeInput.tsx'
import CopyButton from './CopyButton.tsx'
import ZoneCombobox from './ZoneCombobox.tsx'
import './UnitConverter.css'
import './TimeConverter.css'
import './TimeZoneConverter.css'

const DEFAULT_SOURCE = 'Asia/Kolkata'
const DEFAULT_TARGET = 'America/New_York'

type Side = 'source' | 'target'
interface When {
  date: string
  clock: ClockInput
}

const pad2 = (n: number) => String(n).padStart(2, '0')
const isoDate = (l: LocalDateTime) => `${String(l.year).padStart(4, '0')}-${pad2(l.month)}-${pad2(l.day)}`

function currentWhen(zone: string, format: ClockInput['format'] = '12h'): When {
  const now = localNow(zone)
  return { date: isoDate(now), clock: toClockInput({ hour24: now.hour, minute: now.minute, second: 0 }, format) }
}

function whenOf(v: ZoneView, format: ClockInput['format']): When {
  return { date: v.isoDate, clock: toClockInput({ hour24: v.local.hour, minute: v.local.minute, second: v.local.second }, format) }
}

export default function TimeZoneConverter() {
  const uid = useId()
  const zones = useMemo(() => listZones(), [])

  const [sourceZone, setSourceZone] = useState(DEFAULT_SOURCE)
  const [targetZone, setTargetZone] = useState(DEFAULT_TARGET)
  /** The side whose date/time the user entered; the other side is derived from it. */
  const [anchor, setAnchor] = useState<Side>('source')
  const [value, setValue] = useState<When>(() => currentWhen(DEFAULT_SOURCE))
  const [choice, setChoice] = useState<{ key: string; value: Disambiguation } | null>(null)

  const [editing, setEditing] = useState<Side | null>(null)
  const [draft, setDraft] = useState<When>(value)
  const [popKey, setPopKey] = useState(0)

  const zoneOf = (s: Side) => (s === 'source' ? sourceZone : targetZone)
  const inputZone = zoneOf(anchor)
  const format = value.clock.format

  const dateParse = parseIsoDate(value.date)
  const clockResult = validateClock(value.clock)
  const local: LocalDateTime | null =
    dateParse.ok && clockResult.ok
      ? { year: dateParse.year, month: dateParse.month, day: dateParse.day, hour: clockResult.time.hour24, minute: clockResult.time.minute, second: clockResult.time.second }
      : null
  const key = `${inputZone}|${value.date}|${format}|${value.clock.hour}:${value.clock.minute}:${value.clock.second}:${value.clock.meridiem}`
  // A DST choice only applies to the exact input it was made for; any edit asks again.
  const chosen = choice && choice.key === key ? choice.value : undefined
  const conv = local ? convertZoned(local, inputZone, anchor === 'source' ? targetZone : sourceZone, chosen) : null

  /** Wall-clock view for a side once resolved (the input side's own view, or the derived one). */
  const viewFor = (s: Side): ZoneView | null => (conv && conv.status === 'ok' ? (s === anchor ? conv.source : conv.target) : null)
  const sourceView = viewFor('source')
  const targetView = viewFor('target')
  const dayDiff = sourceView && targetView ? dayDifference(sourceView, targetView) : null

  const timeOf = (v: ZoneView) => formatLocalTime(v.local, format)

  const toggleEdit = (side: Side) => {
    if (editing === side) return setEditing(null)
    const v = viewFor(side)
    setDraft(side === anchor || !v ? value : whenOf(v, format))
    setPopKey((k) => k + 1)
    setEditing(side)
  }

  const draftDate = parseIsoDate(draft.date)
  const draftClock = validateClock(draft.clock)
  const draftValid = draftDate.ok && draftClock.ok

  const confirm = () => {
    if (!editing || !draftValid) return
    setAnchor(editing)
    setValue(draft)
    setChoice(null)
    setEditing(null)
  }

  const swap = () => {
    // The entered date/time stays with its zone, so the exact moment is preserved.
    setSourceZone(targetZone)
    setTargetZone(sourceZone)
    setAnchor((a) => (a === 'source' ? 'target' : 'source'))
  }

  const reset = () => {
    setSourceZone(DEFAULT_SOURCE)
    setTargetZone(DEFAULT_TARGET)
    setAnchor('source')
    setValue(currentWhen(DEFAULT_SOURCE))
    setChoice(null)
    setEditing(null)
  }

  const renderSide = (side: Side) => {
    const zone = zoneOf(side)
    const v = viewFor(side)
    const isInput = side === anchor
    const role = side === 'source' ? 'Departure' : 'Arrival'
    const text = v ? formatItineraryTime(v) : isInput && local ? `${value.date}, ${formatLocalTime(local, format)}` : '—'
    const label = side === 'source' ? 'From (source)' : 'To (target)'
    return (
      <div className="tz-side">
        <ZoneCombobox label={label} value={zone} zones={zones} onChange={side === 'source' ? setSourceZone : setTargetZone} />
        <Popover
          open={editing === side}
          onOpenChange={(o) => (o ? toggleEdit(side) : setEditing((e) => (e === side ? null : e)))}
          label={`Set date and time in ${zoneDisplayName(zone)}`}
          renderTrigger={(p) => (
            <button type="button" className="tz-time" {...p} aria-label={`${role}: ${text}. Change time in ${zoneDisplayName(zone)}`}>
              <span className="tz-time-sub">{role}</span>
              <span className="tz-time-main">{text}</span>
            </button>
          )}
        >
          <div key={popKey} className="pop-body">
            <div className="uc-field">
              <label htmlFor={`${uid}-${side}-date`}>Date</label>
              <input
                id={`${uid}-${side}-date`}
                type="date"
                min="1000-01-01"
                max="9999-12-31"
                value={draft.date}
                onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
                aria-invalid={!draftDate.ok}
              />
              {!draftDate.ok && (
                <p className="uc-error" role="alert">
                  {draftDate.message}
                </p>
              )}
            </div>
            <ClockTimeInput clockOnly value={draft.clock} onChange={(clock) => setDraft((d) => ({ ...d, clock }))} />
            <div className="pop-actions">
              <button
                type="button"
                className="pop-link"
                onClick={() => {
                  setDraft(currentWhen(zone, draft.clock.format))
                  setPopKey((k) => k + 1)
                }}
              >
                Use current time
              </button>
              <button type="button" className="pop-ok" onClick={confirm} disabled={!draftValid}>
                Set time
              </button>
            </div>
          </div>
        </Popover>
        {side === 'target' && dayDiff !== null && (
          <span className={`badge tz-day${dayDiff !== 0 ? ' shift' : ''}`}>{describeDayDifference(dayDiff)} compared with the source date</span>
        )}
      </div>
    )
  }

  return (
    <section className="uc tc tz" aria-label="Time Zone Converter">
      <h2>Time Zone Converter</h2>
      <p className="uc-desc">Convert a date and time between two time zones.</p>

      <div className="uc-units tz-zones">
        {renderSide('source')}
        <button type="button" className="uc-swap" onClick={swap} aria-label="Swap time zones" title="Swap time zones (keeps the same moment)">
          ⇄
        </button>
        {renderSide('target')}
      </div>

      {conv && (conv.status === 'ambiguous' || conv.status === 'nonexistent') && local && (
        <fieldset className="tz-dst" aria-describedby={`${uid}-dst`}>
          <legend>{conv.status === 'ambiguous' ? 'This time happens twice' : 'This time does not exist'}</legend>
          <p id={`${uid}-dst`}>
            {conv.status === 'ambiguous'
              ? `On ${conv.candidates[0].view.fullDate}, clocks in ${zoneDisplayName(inputZone)} go back, so ${formatLocalTime(local, format)} occurs twice. Choose which one you mean, or change the time.`
              : `On ${conv.candidates[0].view.fullDate}, clocks in ${zoneDisplayName(inputZone)} jump forward, so ${formatLocalTime(local, format)} is skipped. Choose how to adjust it, or change the time.`}
          </p>
          {conv.candidates.map((c) => {
            const id = `${uid}-opt-${c.choice}`
            const text =
              conv.status === 'ambiguous'
                ? `${c.choice === 'earlier' ? 'First' : 'Second'} occurrence — ${timeOf(c.view)} at ${c.view.offsetLabel}${c.choice === 'earlier' ? ' (before clocks change)' : ' (after clocks change)'}`
                : `${c.choice === 'earlier' ? 'Before the change' : 'After the change'} — use ${timeOf(c.view)} at ${c.view.offsetLabel}`
            return (
              <div key={c.choice} className="tz-radio">
                <input type="radio" id={id} name={`${uid}-dst`} checked={false} onChange={() => setChoice({ key, value: c.choice })} />
                <label htmlFor={id}>{text}</label>
              </div>
            )
          })}
        </fieldset>
      )}

      <div aria-live="polite">
        {conv && conv.status === 'ok' && conv.adjusted && local && (
          <p className="tz-hint">
            Adjusted: {formatLocalTime(local, format)} does not exist in {zoneDisplayName(conv.source.zone)} on that date; used {timeOf(conv.source)} instead.
          </p>
        )}
        {conv && conv.status === 'error' && (
          <p className="uc-error" role="alert">
            {conv.message}
          </p>
        )}
        {!local && (
          <p className="uc-error" role="alert">
            Set a valid date and time to see a result.
          </p>
        )}
      </div>

      <div className="uc-actions">
        {targetView && <CopyButton text={formatIso8601(targetView)} label="Copy converted time" />}
        <button type="button" className="uc-clear" onClick={reset}>
          Reset
        </button>
      </div>
    </section>
  )
}
