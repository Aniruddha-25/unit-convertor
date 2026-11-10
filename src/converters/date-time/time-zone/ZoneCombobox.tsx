import { useCallback } from 'react'
import { searchZones, viewAt, zoneDisplayName } from './timeZoneUtils.ts'
import Combobox from '../../../components/shared/Combobox/Combobox.tsx'

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

/** Time zone picker: search by city, country or IANA id. */
export default function ZoneCombobox({ label, value, zones, onChange }: Props) {
  const search = useCallback((query: string) => searchZones(zones, query, 50), [zones])
  return (
    <Combobox
      label={label}
      value={value}
      search={search}
      itemKey={(z) => z}
      inputText={(z) => `${zoneDisplayName(z)} — ${z}`}
      renderOption={(z) => (
        <>
          <span className="zc-main">
            {zoneDisplayName(z)}
            <span className="zc-sub">{z}</span>
          </span>
          <span className="zc-off">{currentOffset(z)}</span>
        </>
      )}
      onChange={onChange}
      placeholder="Search city, country or zone"
      emptyText="No matching time zone"
    />
  )
}
