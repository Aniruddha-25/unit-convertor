import { useState } from 'react'
import CategoryGrid from './components/layout/CategoryGrid.tsx'
import ComingSoon from './components/layout/ComingSoon.tsx'
import Modal from './components/layout/Modal.tsx'
import ConverterView from './components/converter/ConverterView.tsx'
import { categories, categoryGroups } from './config/categories.ts'
import './App.css'

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = categories.find((c) => c.id === selectedId) ?? null

  return (
    <div className="app">
      <header className="app-header">
        <h1>Unit Converter</h1>
        <p>Choose a category to start converting.</p>
      </header>
      <main className="content">
        <CategoryGrid groups={categoryGroups} categories={categories} onSelect={setSelectedId} />
      </main>
      {selected && (
        <Modal label={`${selected.name} converter`} onClose={() => setSelectedId(null)}>
          {selected.status === 'available' ? (
            <ConverterView category={selected} />
          ) : (
            <ComingSoon category={selected} />
          )}
        </Modal>
      )}
    </div>
  )
}
