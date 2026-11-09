import type { CategoryConfig } from '../../types/converter.ts'

export default function ComingSoon({ category }: { category: CategoryConfig }) {
  return (
    <section className="soon">
      <span className="badge">Coming Soon</span>
      <h2>{category.name}</h2>
      <p>{category.description}</p>
      <p>This converter is not available yet..</p>
    </section>
  )
}
