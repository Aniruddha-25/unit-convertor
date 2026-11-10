import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fromGrams, toGrams, weightUnits } from './weight.ts'

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps * Math.max(1, Math.abs(b)), `${a} !~ ${b}`)

test('known weight conversions to grams', () => {
  close(toGrams(1, 'kg'), 1000)
  close(toGrams(1000, 'mg'), 1)
  close(toGrams(1, 'g'), 1)
  close(toGrams(1, 'ozt'), 31.1034768)
  close(toGrams(1, 'tola'), 11.6638038)
  close(toGrams(10, 'tola'), 116.638038)
})

test('round-trips through grams for every unit', () => {
  for (const u of weightUnits) for (const v of [0.001, 1, 123.456, 1e6]) close(fromGrams(toGrams(v, u.id), u.id), v)
  close(fromGrams(toGrams(1, 'ozt'), 'tola'), 31.1034768 / 11.6638038)
})

test('unknown unit throws', () => {
  assert.throws(() => toGrams(1, 'lb'))
})
