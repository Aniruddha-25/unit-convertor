import { useState } from 'react'
import type { ConverterConfig } from '../../../types/converter.ts'
import ClockTimeConverter from './ClockTimeConverter.tsx'
import { categoryIcons } from '../../../components/shared/categoryIcons/categoryIcons.ts'
import { faHourglassHalf, faClock } from '@fortawesome/free-solid-svg-icons'
import AppIcon from '../../../components/shared/AppIcon/AppIcon.tsx'
import Segmented from '../../../components/shared/Segmented/Segmented.tsx'
import UnitConverter from '../../../components/shared/UnitConverter/UnitConverter.tsx'
import '../../../components/shared/converter.css'
import './TimeConverter.css'

type Mode = 'duration' | 'clock'

/** Time category view: duration conversion (units) and clock-time input (time of day) as separate modes. */
export default function TimeConverter({ config }: { config: ConverterConfig }) {
  const [mode, setMode] = useState<Mode>('duration')

  return (
    <section className="uc tc" aria-label={config.title}>
      <h2>
        <AppIcon icon={categoryIcons[config.id]} />
        {config.title}
      </h2>
      <p className="uc-desc">
        {mode === 'duration' ? config.description : 'Pick or type a time of day and see it in 12-hour and 24-hour form.'}
      </p>
      <div className="tc-modes">
        <Segmented<Mode>
          label="Converter mode"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'duration', label: 'Duration', icon: faHourglassHalf },
            { value: 'clock', label: 'Clock time', icon: faClock },
          ]}
        />
      </div>
      {mode === 'duration' ? <UnitConverter config={config} showHeader={false} /> : <ClockTimeConverter />}
    </section>
  )
}
