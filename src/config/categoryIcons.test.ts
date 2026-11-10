import assert from 'node:assert/strict'
import { test } from 'node:test'
import { categories, categoryGroups } from './categories.ts'
import { categoryIcons, groupIcons } from './categoryIcons.ts'

test('every category and group has an icon', () => {
  for (const c of categories) assert.ok(categoryIcons[c.id], `missing icon for category ${c.id}`)
  for (const g of categoryGroups) assert.ok(groupIcons[g.id], `missing icon for group ${g.id}`)
})

test('no unused icon entries', () => {
  const ids = new Set(categories.map((c) => c.id))
  for (const id of Object.keys(categoryIcons)) assert.ok(ids.has(id), `icon for unknown category ${id}`)
})

test('icons are not reused between categories or groups', () => {
  const names = [...Object.values(categoryIcons), ...Object.values(groupIcons)].map((i) => i.iconName)
  assert.equal(new Set(names).size, names.length)
})
