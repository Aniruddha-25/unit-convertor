import { useState } from 'react'
import type { ConverterConfig } from '../../types/converter.ts'
import ClockTimeConverter from './ClockTimeConverter.tsx'
import Segmented from './Segmented.tsx'
import UnitConverter from './UnitConverter.tsx'
import './UnitConverter.css'
import './TimeConverter.css'

type Mode = 'duration' | 'clock'

/** Time category view: duration conversion (units) and clock-time input (time of day) as separate modes. */
export default function TimeConverter({ config }: { config: ConverterConfig }) {
  const [mode, setMode] = useState<Mode>('duration')

  return (
    <section className="uc tc" aria-label={config.title}>
      <h2>{config.title}</h2>
      <p className="uc-desc">
        {mode === 'duration' ? config.description : 'Pick or type a time of day and see it in 12-hour and 24-hour form.'}
      </p>
      <div className="tc-modes">
        <Segmented<Mode>
          label="Converter mode"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'duration', label: 'Duration' },
            { value: 'clock', label: 'Clock time' },
          ]}
        />
      </div>
      {mode === 'duration' ? <UnitConverter config={config} showHeader={false} /> : <ClockTimeConverter />}
    </section>
  )
}
