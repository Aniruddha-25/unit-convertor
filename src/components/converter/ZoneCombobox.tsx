import { useId, useMemo, useRef, useState } from 'react'
import { searchZones, viewAt, zoneDisplayName } from '../../converters/timezone/timeZoneUtils.ts'

const offsetCache = new Map<string, string>()
/** Current UTC offset (DST-aware, computed — not tabulated). Cached for the session's list rendering. */
function currentOffset(zone: string): string {
  let v = offsetCache.get(zone)
  if (!v) {
    v = viewAt(Date.now(), zone).offsetLabel
    offsetCache.set(zone, v)
  }
  return v
}

interface Props {
  label: string
  value: string
  zones: readonly string[]
  onChange: (zone: string) => void
}

/** Accessible searchable select (ARIA combobox + listbox). Search by city, country or IANA id. */
export default function ZoneCombobox({ label, value, zones, onChange }: Props) {
  const uid = useId()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)

  const matches = useMemo(() => (open ? searchZones(zones, query, 50) : []), [open, zones, query])
  const shown = open ? query : `${zoneDisplayName(value)} — ${value}`

  const choose = (zone: string) => {
    onChange(zone)
    setOpen(false)
    setQuery('')
  }

  const moveTo = (i: number) => {
    setActive(i)
    listRef.current?.children[i]?.scrollIntoView?.({ block: 'nearest' })
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) setOpen(true)
      else moveTo(Math.min(active + 1, matches.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (open) moveTo(Math.max(active - 1, 0))
    } else if (e.key === 'Enter' && open) {
      e.preventDefault()
      if (matches[active]) choose(matches[active])
    } else if (e.key === 'Escape' && open) {
      e.stopPropagation() // close the list, not the surrounding dialog
      setOpen(false)
      setQuery('')
    }
  }

  return (
    <div className="uc-field zc">
      <label htmlFor={`${uid}-in`}>{label}</label>
      <input
        id={`${uid}-in`}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${uid}-list`}
        aria-autocomplete="list"
        aria-activedescendant={open && matches[active] ? `${uid}-opt-${active}` : undefined}
        autoComplete="off"
        spellCheck={false}
        placeholder="Search city, country or zone"
        value={shown}
        // Focus alone does not open the list (the dialog auto-focuses the first field); click, typing or ↓ do.
        onFocus={(e) => e.currentTarget.select()}
        onClick={() => {
          if (!open) {
            setOpen(true)
            setQuery('')
            setActive(0)
          }
        }}
        onChange={(e) => {
          setOpen(true)
          setQuery(e.target.value)
          setActive(0)
        }}
        onBlur={() => {
          setOpen(false)
          setQuery('')
        }}
        onKeyDown={onKeyDown}
      />
      {open && (
        <ul id={`${uid}-list`} ref={listRef} className="zc-list" role="listbox" aria-label={`${label} options`}>
          {matches.length === 0 && <li className="zc-empty">No matching time zone</li>}
          {matches.map((z, i) => {
            return (
              <li
                key={z}
                id={`${uid}-opt-${i}`}
                role="option"
                aria-selected={z === value}
                className={`zc-opt${i === active ? ' active' : ''}${z === value ? ' sel' : ''}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(z)}
                onMouseMove={() => i !== active && setActive(i)}
              >
                <span className="zc-main">
                  {zoneDisplayName(z)}
                  <span className="zc-sub">{z}</span>
                </span>
                <span className="zc-off">{currentOffset(z)}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
