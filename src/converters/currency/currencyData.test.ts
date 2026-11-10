import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildCurrencyList, searchCurrencies } from './currencyData.ts'

const list = buildCurrencyList(['USD', 'EUR', 'INR', 'JPY', 'GBP', 'AED', 'CAD', 'AUD', 'CHF', 'CNY', 'XOF', 'ZZZ'])
const by = (code: string) => list.find((c) => c.code === code)

test('builds metadata for the major currencies and drops unknown codes', () => {
  assert.equal(list.length, 11)
  assert.equal(by('ZZZ'), undefined)
  assert.equal(by('INR')?.flag, 'in')
  assert.equal(by('USD')?.flag, 'us')
  assert.equal(by('GBP')?.flag, 'gb')
  assert.equal(by('JPY')?.decimals, 0)
  assert.equal(by('INR')?.symbol, '₹')
})

test('multi-country currencies get a sensible flag', () => {
  assert.equal(by('EUR')?.flag, 'eu')
  assert.equal(by('XOF')?.flag, null)
})

test('searches by code, name and symbol', () => {
  assert.equal(searchCurrencies(list, 'inr')[0].code, 'INR')
  assert.equal(searchCurrencies(list, 'rupee')[0].code, 'INR')
  assert.equal(searchCurrencies(list, 'yen')[0].code, 'JPY')
  assert.equal(searchCurrencies(list, '₹')[0].code, 'INR')
  assert.deepEqual(searchCurrencies(list, 'nothing-here'), [])
})
