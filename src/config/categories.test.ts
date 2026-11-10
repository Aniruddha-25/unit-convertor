import assert from 'node:assert/strict'
import { test } from 'node:test'
import { categories, categoryGroups } from './categories.ts'

test('Gold has one unified navigation entry', () => {
  const gold = categories.filter((c) => c.name.toLowerCase().includes('gold'))
  assert.equal(gold.length, 1)
  assert.equal(gold[0].id, 'gold')
  assert.equal(gold[0].name, 'Gold Converter')
  assert.equal(gold[0].status, 'available')
  assert.equal(gold[0].groupId, 'finance')
})

test('the old separate Gold Rate and Gold Purity entries are gone', () => {
  const ids = categories.map((c) => c.id)
  assert.ok(!ids.includes('gold-rate'))
  assert.ok(!ids.includes('gold-purity'))
  assert.ok(!categories.some((c) => c.name === 'Gold Rate' || c.name === 'Gold Purity'))
})

test('category ids and names are unique, and every group exists', () => {
  assert.equal(new Set(categories.map((c) => c.id)).size, categories.length)
  assert.equal(new Set(categories.map((c) => c.name)).size, categories.length)
  const groups = new Set(categoryGroups.map((g) => g.id))
  for (const c of categories) assert.ok(groups.has(c.groupId), `${c.id} has unknown group ${c.groupId}`)
})

test('the Gold Converter is findable by name, case-insensitively', () => {
  const find = (q: string) => categories.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()))
  assert.deepEqual(find('gold converter').map((c) => c.id), ['gold'])
  assert.deepEqual(find('GOLD').map((c) => c.id), ['gold'])
})

const idsIn = (groupId: string) => categories.filter((c) => c.groupId === groupId).map((c) => c.id)

test('Finance is its own group holding Currency and Gold Converter, kept separate', () => {
  assert.ok(categoryGroups.some((g) => g.id === 'finance' && g.name === 'Finance'))
  assert.deepEqual(idsIn('finance'), ['currency', 'gold'])
})

test('Everyday & Lifestyle keeps only its own converters', () => {
  assert.deepEqual(idsIn('lifestyle'), ['fuel-economy', 'cooking', 'shoe-size'])
  assert.ok(!idsIn('lifestyle').includes('currency'))
  assert.ok(!idsIn('lifestyle').includes('gold'))
})

test('no unrelated converters moved into Finance, and every group is non-empty', () => {
  for (const id of ['time', 'time-zone', 'data-storage', 'length', 'fuel-economy']) {
    assert.notEqual(categories.find((c) => c.id === id)?.groupId, 'finance')
  }
  for (const g of categoryGroups) assert.ok(idsIn(g.id).length > 0, `group ${g.id} is empty`)
})
