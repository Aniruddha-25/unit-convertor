import type { ClockField, ClockFormat } from './clockTime.ts'

interface Props {
  field: ClockField
  format: ClockFormat
  /** Current value of the active field, or null if invalid/empty. */
  value: number | null
  onPick: (value: number) => void
  /** Called when a pick gesture ends (used to advance hour → minute → second). */
  onCommit: () => void
}

const C = 100
const R_OUT = 74
const R_IN = 46

const polar = (deg: number, r: number) => {
  const rad = (deg * Math.PI) / 180
  return { x: C + r * Math.sin(rad), y: C - r * Math.cos(rad) }
}

function range(field: ClockField, format: ClockFormat) {
  if (field === 'hour') return format === '12h' ? { min: 1, max: 12 } : { min: 0, max: 23 }
  return { min: 0, max: 59 }
}

/** Position (angle + ring radius) of a value on the dial. */
function place(field: ClockField, format: ClockFormat, v: number) {
  if (field !== 'hour') return { deg: v * 6, r: R_OUT }
  const deg = (v % 12) * 30
  const inner = format === '24h' && (v === 0 || v > 12)
  return { deg, r: inner ? R_IN : R_OUT }
}

/** Convert a pointer position on the dial to a value. */
function valueAt(field: ClockField, format: ClockFormat, dx: number, dy: number, scale: number): number {
  const deg = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360
  if (field !== 'hour') return Math.round(deg / 6) % 60
  const pos = Math.round(deg / 30) % 12
  if (format === '12h') return pos === 0 ? 12 : pos
  const inner = Math.hypot(dx, dy) / scale < (R_OUT + R_IN) / 2 + 6
  return inner ? (pos === 0 ? 0 : pos + 12) : pos === 0 ? 12 : pos
}

const FIELD_LABEL: Record<ClockField, string> = { hour: 'Hours', minute: 'Minutes', second: 'Seconds' }

export default function ClockDial({ field, format, value, onPick, onCommit }: Props) {
  const { min, max } = range(field, format)

  const labels: { v: number; text: string; deg: number; r: number }[] = []
  if (field === 'hour') {
    ;[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].forEach((v, i) => labels.push({ v, text: String(v), deg: i * 30, r: R_OUT }))
    if (format === '24h') {
      ;[0, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].forEach((v, i) =>
        labels.push({ v, text: v === 0 ? '00' : String(v), deg: i * 30, r: R_IN }),
      )
    }
  } else {
    for (let v = 0; v < 60; v += 5) labels.push({ v, text: String(v).padStart(2, '0'), deg: v * 6, r: R_OUT })
  }

  const pick = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const scale = rect.width / 200
    const dx = e.clientX - (rect.left + rect.width / 2)
    const dy = e.clientY - (rect.top + rect.height / 2)
    onPick(valueAt(field, format, dx, dy, scale))
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const cur = value ?? min
    let next: number | null = null
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') next = cur >= max ? min : cur + 1
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') next = cur <= min ? max : cur - 1
    else if (e.key === 'Home') next = min
    else if (e.key === 'End') next = max
    if (next !== null) {
      e.preventDefault()
      onPick(next)
    }
  }

  const hand = value !== null && value >= min && value <= max ? place(field, format, value) : null
  const tip = hand ? polar(hand.deg, hand.r) : null

  return (
    <svg
      className="dial"
      viewBox="0 0 200 200"
      role="slider"
      tabIndex={0}
      aria-label={`${FIELD_LABEL[field]} dial`}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value ?? undefined}
      aria-valuetext={value === null ? 'No value selected' : String(value)}
      onKeyDown={onKeyDown}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        pick(e)
      }}
      onPointerMove={(e) => e.buttons > 0 && pick(e)}
      onPointerUp={onCommit}
    >
      <circle cx={C} cy={C} r="96" className="dial-face" />
      {field !== 'hour' &&
        Array.from({ length: 60 }, (_, i) => {
          const a = polar(i * 6, 90)
          const b = polar(i * 6, i % 5 === 0 ? 85 : 87.5)
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="dial-tick" />
        })}
      {tip && (
        <>
          <line x1={C} y1={C} x2={tip.x} y2={tip.y} className="dial-hand" />
          <circle cx={tip.x} cy={tip.y} r="14" className="dial-knob" />
        </>
      )}
      <circle cx={C} cy={C} r="3" className="dial-hub" />
      {labels.map((l) => {
        const p = polar(l.deg, l.r)
        const active = value === l.v
        return (
          <text
            key={`${l.r}-${l.v}`}
            x={p.x}
            y={p.y}
            className={`dial-label${active ? ' on' : ''}${l.r === R_IN ? ' inner' : ''}`}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {l.text}
          </text>
        )
      })}
    </svg>
  )
}
