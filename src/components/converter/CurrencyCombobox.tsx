import { useId, useMemo, useRef, useState } from 'react'
import { searchCurrencies } from '../../converters/currency/currencyData.ts'
import type { CurrencyInfo } from '../../converters/currency/types.ts'

function Flag({ currency }: { currency: CurrencyInfo }) {
  return currency.flag ? (
    <span className={`fi fi-${currency.flag} cc-flag`} aria-hidden="true" />
  ) : (
    <span className="cc-flag cc-flag-none" aria-hidden="true">¤</span>
  )
}

interface Props {
  label: string
  value: CurrencyInfo
  currencies: readonly CurrencyInfo[]
  onChange: (code: string) => void
}

/** Accessible searchable select (ARIA combobox + listbox). Search by code, name or symbol. */
export default function CurrencyCombobox({ label, value, currencies, onChange }: Props) {
  const uid = useId()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)

  const matches = useMemo(() => (open ? searchCurrencies(currencies, query) : []), [open, currencies, query])
  const shown = open ? query : `${value.code} — ${value.name}`

  const choose = (code: string) => {
    onChange(code)
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
      if (matches[active]) choose(matches[active].code)
    } else if (e.key === 'Escape' && open) {
      e.stopPropagation() // close the list, not the surrounding dialog
      setOpen(false)
      setQuery('')
    }
  }

  return (
    <div className="uc-field zc cc">
      <label htmlFor={`${uid}-in`}>{label}</label>
      <div className="cc-inputwrap">
        <Flag currency={value} />
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
          placeholder="Search code, name or symbol"
          value={shown}
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
      </div>
      {open && (
        <ul id={`${uid}-list`} ref={listRef} className="zc-list" role="listbox" aria-label={`${label} options`}>
          {matches.length === 0 && <li className="zc-empty">No matching currency</li>}
          {matches.map((c, i) => (
            <li
              key={c.code}
              id={`${uid}-opt-${i}`}
              role="option"
              aria-selected={c.code === value.code}
              className={`zc-opt${i === active ? ' active' : ''}${c.code === value.code ? ' sel' : ''}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(c.code)}
              onMouseMove={() => i !== active && setActive(i)}
            >
              <Flag currency={c} />
              <span className="zc-main">
                {c.code}
                <span className="zc-sub">{c.name}</span>
              </span>
              <span className="zc-off">{c.symbol}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
