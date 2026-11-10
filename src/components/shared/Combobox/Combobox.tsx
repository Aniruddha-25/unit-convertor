import { useId, useMemo, useRef, useState, type ReactNode } from 'react'
import './Combobox.css'

interface Props<T> {
  label: string
  value: T
  /** Matching items for a query (empty query = the default list). Called only while the list is open. */
  search: (query: string) => readonly T[]
  itemKey: (item: T) => string
  /** Text shown in the closed input. */
  inputText: (item: T) => string
  /** Content of one option row (use .zc-main / .zc-sub / .zc-off). */
  renderOption: (item: T) => ReactNode
  onChange: (item: T) => void
  placeholder: string
  emptyText: string
  /** Optional element shown to the left of the input (e.g. a flag). */
  leading?: ReactNode
  /** Extra class on the field wrapper. */
  className?: string
}

/** Accessible searchable select (ARIA combobox + listbox), shared by the time zone and currency pickers. */
export default function Combobox<T>({ label, value, search, itemKey, inputText, renderOption, onChange, placeholder, emptyText, leading, className }: Props<T>) {
  const uid = useId()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)

  const matches = useMemo(() => (open ? search(query) : []), [open, search, query])
  const shown = open ? query : inputText(value)
  const selectedKey = itemKey(value)

  const choose = (item: T) => {
    onChange(item)
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

  const input = (
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
      placeholder={placeholder}
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
  )

  return (
    <div className={`uc-field zc${className ? ` ${className}` : ''}`}>
      <label htmlFor={`${uid}-in`}>{label}</label>
      {leading ? (
        <div className="zc-inputwrap">
          {leading}
          {input}
        </div>
      ) : (
        input
      )}
      {open && (
        <ul id={`${uid}-list`} ref={listRef} className="zc-list" role="listbox" aria-label={`${label} options`}>
          {matches.length === 0 && <li className="zc-empty">{emptyText}</li>}
          {matches.map((item, i) => (
            <li
              key={itemKey(item)}
              id={`${uid}-opt-${i}`}
              role="option"
              aria-selected={itemKey(item) === selectedKey}
              className={`zc-opt${i === active ? ' active' : ''}${itemKey(item) === selectedKey ? ' sel' : ''}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(item)}
              onMouseMove={() => i !== active && setActive(i)}
            >
              {renderOption(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
