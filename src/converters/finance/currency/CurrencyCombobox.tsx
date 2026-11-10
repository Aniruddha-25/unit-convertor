import { useCallback } from 'react'
import 'flag-icons/css/flag-icons.min.css'
import Combobox from '../../../components/shared/Combobox/Combobox.tsx'
import { searchCurrencies } from './currencyData.ts'
import type { CurrencyInfo } from './types.ts'
import './CurrencyCombobox.css'

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

/** Currency picker: search by code, name or symbol, with the country flag. */
export default function CurrencyCombobox({ label, value, currencies, onChange }: Props) {
  const search = useCallback((query: string) => searchCurrencies(currencies, query), [currencies])
  return (
    <Combobox
      label={label}
      value={value}
      search={search}
      itemKey={(c) => c.code}
      inputText={(c) => `${c.code} — ${c.name}`}
      renderOption={(c) => (
        <>
          <Flag currency={c} />
          <span className="zc-main">
            {c.code}
            <span className="zc-sub">{c.name}</span>
          </span>
          <span className="zc-off">{c.symbol}</span>
        </>
      )}
      onChange={(c) => onChange(c.code)}
      placeholder="Search code, name or symbol"
      emptyText="No matching currency"
      leading={<Flag currency={value} />}
      className="cc"
    />
  )
}
