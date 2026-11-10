import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import AppIcon from '../AppIcon/AppIcon.tsx'
import './Segmented.css'

interface Option<T extends string> {
  icon?: IconDefinition
  value: T
  label: string
}

interface Props<T extends string> {
  label: string
  options: readonly Option<T>[]
  value: T
  onChange: (v: T) => void
}

/** Small segmented toggle built from buttons (aria-pressed), keyboard accessible. */
export default function Segmented<T extends string>({ label, options, value, onChange }: Props<T>) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`seg-btn${o.value === value ? ' on' : ''}`}
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          <AppIcon icon={o.icon} />
          {o.label}
        </button>
      ))}
    </div>
  )
}
