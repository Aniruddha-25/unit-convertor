import { countries, currencies } from 'country-data-list'
import type { CurrencyInfo } from './types.ts'

/** Currencies shared by many countries: use the conventional flag (or none) instead of an arbitrary member. */
const SHARED_FLAG: Readonly<Record<string, string | null>> = {
  EUR: 'eu',
  XOF: null,
  XAF: null,
  XCD: null,
  XPF: null,
  XDR: null,
}

const displayNames = new Intl.DisplayNames('en', { type: 'currency', fallback: 'none' })

function narrowSymbol(code: string): string {
  const part = new Intl.NumberFormat('en', { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol' })
    .formatToParts(0)
    .find((p) => p.type === 'currency')
  return part?.value ?? code
}

function flagFor(code: string): string | null {
  if (code in SHARED_FLAG) return SHARED_FLAG[code]
  const users = countries.all.filter((c) => c.status === 'assigned' && c.currencies.includes(code))
  if (users.length === 0) return null
  // Prefer the issuing country, whose alpha-2 is the currency's first two letters (USD->US, INR->IN).
  const home = users.find((c) => c.alpha2 === code.slice(0, 2)) ?? users[0]
  return home.alpha2.toLowerCase()
}

/** Metadata comes from country-data-list (ISO 4217 + ISO 3166); only codes the rate provider quotes are kept. */
export function buildCurrencyList(availableCodes: Iterable<string>): CurrencyInfo[] {
  const list: CurrencyInfo[] = []
  for (const code of availableCodes) {
    const meta = (currencies as unknown as Record<string, { name: string; symbol?: string; decimals: number | null } | undefined>)[code]
    if (!meta) {
      // Newer ISO codes the library predates (e.g. MRU, SLE, ZWG): fall back to the platform's CLDR data.
      const name = displayNames.of(code)
      if (!name || name === code) continue // unofficial codes some providers add (FOK, KID, ...)
      list.push({ code, name, symbol: narrowSymbol(code), decimals: 2, flag: flagFor(code) })
      continue
    }
    list.push({
      code,
      name: meta.name,
      symbol: meta.symbol ?? code,
      decimals: typeof meta.decimals === 'number' ? meta.decimals : 2,
      flag: flagFor(code),
    })
  }
  return list.sort((a, b) => a.name.localeCompare(b.name))
}

const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/** Case/accent-insensitive search by code, name, or symbol; code matches rank first. */
export function searchCurrencies(list: readonly CurrencyInfo[], query: string, limit = 60): CurrencyInfo[] {
  const q = query.trim().toLowerCase()
  if (!q) return list.slice(0, limit)
  const nq = norm(q)
  const scored: Array<[number, CurrencyInfo]> = []
  for (const c of list) {
    const code = c.code.toLowerCase()
    const name = norm(c.name)
    let score = -1
    if (code === q) score = 0
    else if (code.startsWith(q)) score = 1
    else if (name.startsWith(nq)) score = 2
    else if (name.includes(nq)) score = 3
    else if (c.symbol.toLowerCase() === q) score = 4
    if (score >= 0) scored.push([score, c])
  }
  return scored.sort((a, b) => a[0] - b[0]).slice(0, limit).map(([, c]) => c)
}
