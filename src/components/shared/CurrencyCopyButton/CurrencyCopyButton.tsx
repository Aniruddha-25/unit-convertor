import { formatAmount } from '../../../converters/finance/currency/currencyMath.ts'
import CopyButton from '../CopyButton/CopyButton.tsx'

interface Props {
  amount: number
  /** Three-letter ISO 4217 code, e.g. "INR". */
  currencyCode: string
  /** Fraction digits to copy; match what is displayed. */
  decimals: number
}

/** Copies a monetary value as "1,234.56 USD": international grouping, no currency symbol. */
export default function CurrencyCopyButton({ amount, currencyCode, decimals }: Props) {
  return <CopyButton text={`${formatAmount(amount, decimals, 'en-US')} ${currencyCode}`} />
}
