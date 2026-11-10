import { categoryIcons, groupIcons } from '../shared/categoryIcons/categoryIcons.ts'
import AppIcon from '../shared/AppIcon/AppIcon.tsx'
import type { CategoryConfig, CategoryGroup } from '../../types/converter.ts'

interface Props {
  groups: readonly CategoryGroup[]
  categories: readonly CategoryConfig[]
  onSelect: (id: string) => void
}

export default function CategoryGrid({ groups, categories, onSelect }: Props) {
  return (
    <nav className="grid-nav" aria-label="Conversion categories">
      {groups.map((g) => (
        <section key={g.id} className="grid-group" aria-labelledby={`group-${g.id}`}>
          <h2 id={`group-${g.id}`}>
            <AppIcon icon={groupIcons[g.id]} />
            {g.name}
          </h2>
          <ul className="cat-grid">
            {categories
              .filter((c) => c.groupId === g.id)
              .map((c) => (
                <li key={c.id}>
                  <button type="button" className="cat-cell" aria-haspopup="dialog" onClick={() => onSelect(c.id)}>
                    <span className="cat-name">
                      <AppIcon icon={categoryIcons[c.id]} />
                      {c.name}
                    </span>
                    {c.status === 'coming-soon' && <span className="badge">Coming Soon</span>}
                  </button>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </nav>
  )
}
