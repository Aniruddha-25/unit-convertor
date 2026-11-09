import { useEffect, useRef, type ReactNode, type Ref } from 'react'

export interface PopoverTriggerProps {
  ref: Ref<HTMLButtonElement>
  onClick: () => void
  'aria-haspopup': 'dialog'
  'aria-expanded': boolean
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Accessible name of the panel. */
  label: string
  renderTrigger: (props: PopoverTriggerProps) => ReactNode
  children: ReactNode
}

/**
 * Small anchored panel. Closes on ×, Escape (without closing a surrounding dialog) or an outside click.
 * The panel stays mounted so it can fade/slide; it is `inert` (unfocusable) while closed.
 */
export default function Popover({ open, onOpenChange, label, renderTrigger, children }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const onOpenChangeRef = useRef(onOpenChange)
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange
  })

  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    panel?.focus({ preventScroll: true })
    panel?.scrollIntoView?.({ block: 'nearest' })

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // Capture phase + stopPropagation: only the popover closes, not the dialog around it.
      e.stopPropagation()
      e.preventDefault()
      onOpenChangeRef.current(false)
      triggerRef.current?.focus()
    }
    const onPointerDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) onOpenChangeRef.current(false)
    }
    document.addEventListener('keydown', onKey, true)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  return (
    <div className="pop-wrap" ref={wrapRef}>
      {renderTrigger({
        ref: triggerRef,
        onClick: () => onOpenChange(!open),
        'aria-haspopup': 'dialog',
        'aria-expanded': open,
      })}
      <div
        ref={panelRef}
        className={`pop${open ? ' open' : ''}`}
        role="dialog"
        aria-label={label}
        tabIndex={-1}
        inert={!open}
      >
        <button
          type="button"
          className="pop-close"
          aria-label="Close"
          onClick={() => {
            onOpenChange(false)
            triggerRef.current?.focus()
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  )
}
