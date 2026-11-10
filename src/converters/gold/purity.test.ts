import assert from 'node:assert/strict'
import { test } from 'node:test'
import { FINENESS_MAX, finenessToKarat, findPurity, goldPercent, parseFineness, pureGoldGrams, purities, purityBreakdown } from './purity.ts'
import { parseInput } from '../../utils/conversionUtils.ts'

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps * Math.max(1, Math.abs(b)), `${a} !~ ${b}`)

const TABLE: Array<[string, number, number, number]> = [
  ['24k', 24, 999, 99.9],
  ['22k', 22, 916, 91.6],
  ['20k', 20, 833, 83.3],
  ['18k', 18, 750, 75],
  ['14k', 14, 585, 58.5],
  ['9k', 9, 375, 37.5],
]

test('supported purities match the reference table', () => {
  assert.equal(purities.length, TABLE.length)
  for (const [id, karat, fineness, pct] of TABLE) {
    const p = findPurity(id)
    assert.equal(p.karat, karat)
    assert.equal(p.fineness, fineness)
    close(goldPercent(p.fineness), pct)
  }
  assert.throws(() => findPurity('21k'))
})

test('every purity: pure + other metals = total, with fineness-based pure gold', () => {
  for (const [, , fineness, pct] of TABLE) {
    const b = purityBreakdown(10, 'g', fineness)
    close(b.pureGrams, (10 * pct) / 100)
    close(b.pureGrams + b.alloyGrams, 10)
    close(b.percent, pct)
    assert.equal(b.fineness, fineness)
  }
})

test('worked example: 10 g of 22K', () => {
  const b = purityBreakdown(10, 'g', findPurity('22k').fineness)
  close(b.totalGrams, 10)
  close(b.pureGrams, 9.16)
  close(b.alloyGrams, 0.84)
  close(b.percent, 91.6)
  assert.equal(b.fineness, 916)
  assert.equal(b.karat, 22)
  assert.ok(b.standard)
})

test('unit conversions: g, kg, mg, tola', () => {
  close(purityBreakdown(1, 'kg', 750).pureGrams, 750)
  close(purityBreakdown(1, 'kg', 750).alloyGrams, 250)
  close(purityBreakdown(5000, 'mg', 750).totalGrams, 5)
  close(purityBreakdown(5000, 'mg', 750).pureGrams, 3.75)
  close(purityBreakdown(1, 'tola', 916).totalGrams, 11.6638038)
  close(purityBreakdown(1, 'tola', 916).pureGrams, 11.6638038 * 0.916)
  close(purityBreakdown(2, 'tola', 916).pureGrams, 2 * purityBreakdown(1, 'tola', 916).pureGrams)
  assert.throws(() => purityBreakdown(1, 'stone', 916))
})

test('equivalent karat for standard and custom fineness', () => {
  for (const [, karat, fineness] of TABLE) assert.deepEqual(finenessToKarat(fineness), { karat, standard: true })
  const custom = finenessToKarat(900)
  assert.equal(custom.standard, false)
  close(custom.karat, 21.6)
  close(finenessToKarat(500).karat, 12)
})

test('zero weight gives zero content; large weights stay accurate', () => {
  const z = purityBreakdown(0, 'g', 916)
  assert.equal(z.pureGrams, 0)
  assert.equal(z.alloyGrams, 0)
  close(pureGoldGrams(1e9, 916), 9.16e8)
})

test('fineness input validation', () => {
  assert.deepEqual(parseFineness('916'), { ok: true, value: 916 })
  assert.deepEqual(parseFineness(' 999.9 '), { ok: true, value: 999.9 })
  assert.deepEqual(parseFineness(String(FINENESS_MAX)), { ok: true, value: FINENESS_MAX })
  for (const bad of ['', '   ', '0', '0.0', '-5', '1001', 'abc', '9 16', '1e3', '--1']) {
    assert.equal(parseFineness(bad).ok, false, `should reject "${bad}"`)
  }
})

test('weight input validation (shared parser): invalid and negative rejected, zero accepted', () => {
  assert.equal(parseInput('abc', false).kind, 'error')
  assert.equal(parseInput('-1', false).kind, 'error')
  assert.equal(parseInput('', false).kind, 'empty')
  assert.deepEqual(parseInput('0', false), { kind: 'ok', value: 0 })
  assert.deepEqual(parseInput('10.5', false), { kind: 'ok', value: 10.5 })
})
