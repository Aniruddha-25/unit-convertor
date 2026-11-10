import { useCallback } from 'react'
import type { UnitDefinition } from '../../../types/converter.ts'
import Combobox from '../Combobox/Combobox.tsx'

interface Props {
  label: string
  value: UnitDefinition
  units: readonly UnitDefinition[]
  onChange: (id: string) => void
}

/** Searchable unit picker: matches name, symbol or id (e.g. "mbps"). */
export default function UnitCombobox({ label, value, units, onChange }: Props) {
  const search = useCallback(
    (query: string) => {
      const q = query.trim().toLowerCase()
      return q ? units.filter((u) => [u.name, u.symbol, u.id].some((s) => s.toLowerCase().includes(q))) : units
    },
    [units],
  )
  return (
    <Combobox
      label={label}
      value={value}
      search={search}
      itemKey={(u) => u.id}
      inputText={(u) => `${u.name} (${u.symbol})`}
      renderOption={(u) => (
        <span className="zc-main">
          {u.name}
          <span className="zc-sub">{u.symbol}</span>
        </span>
      )}
      onChange={(u) => onChange(u.id)}
      placeholder="Search unit"
      emptyText="No matching unit"
    />
  )
}
