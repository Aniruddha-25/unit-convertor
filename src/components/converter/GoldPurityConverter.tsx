import { useId, useState } from 'react'
import { categoryIcons } from '../../config/categoryIcons.ts'
import { findPurity, parseFineness, purities, purityBreakdown } from '../../converters/gold/purity.ts'
import { findWeightUnit, fromGrams, weightUnits } from '../../converters/gold/weight.ts'
import { formatCompact, formatNumber, parseInput } from '../../utils/conversionUtils.ts'
import AppIcon from '../layout/AppIcon.tsx'
import CopyButton from './CopyButton.tsx'
import Segmented from './Segmented.tsx'
import './UnitConverter.css'
import './Gold.css'

type Mode = 'karat' | 'fineness'

/** Units offered here: grams, kilograms, milligrams and tola. */
const UNITS = weightUnits.filter((u) => u.id !== 'ozt')
const DEFAULTS = { weight: '10', unit: 'g', mode: 'karat' as Mode, karat: '22k', fineness: '916' }

export default function GoldPurityConverter() {
  const uid = useId()
  const [weight, setWeight] = useState(DEFAULTS.weight)
  const [unitId, setUnitId] = useState(DEFAULTS.unit)
  const [mode, setMode] = useState<Mode>(DEFAULTS.mode)
  const [karatId, setKaratId] = useState(DEFAULTS.karat)
  const [finenessText, setFinenessText] = useState(DEFAULTS.fineness)

  const parsedWeight = parseInput(weight, false)
  const finenessInput = mode === 'fineness' ? parseFineness(finenessText) : null
  const fineness = mode === 'karat' ? findPurity(karatId).fineness : finenessInput?.ok ? finenessInput.value : null

  const weightError = parsedWeight.kind === 'error' ? parsedWeight.message : null
  const finenessError = finenessInput && !finenessInput.ok ? finenessInput.message : null
  const result = parsedWeight.kind === 'ok' && fineness !== null ? purityBreakdown(parsedWeight.value, unitId, fineness) : null
  const tooLarge = result !== null && !(Number.isFinite(result.totalGrams) && Number.isFinite(result.pureGrams))
  const shown = result !== null && !tooLarge ? result : null

  const unit = findWeightUnit(unitId)
  const reset = () => {
    setWeight(DEFAULTS.weight)
    setUnitId(DEFAULTS.unit)
    setMode(DEFAULTS.mode)
    setKaratId(DEFAULTS.karat)
    setFinenessText(DEFAULTS.fineness)
  }

  return (
    <section className="uc gc" aria-labelledby={`${uid}-title`}>
      <h2 id={`${uid}-title`}>
        <AppIcon icon={categoryIcons['gold-purity']} />
        Gold Purity Converter
      </h2>
      <p className="uc-desc">Find the pure gold and other metals in a piece of gold from its karat or fineness.</p>

      <div className="uc-field">
        <label htmlFor={`${uid}-w`}>Gold weight</label>
        <div className="gc-row">
          <input
            id={`${uid}-w`}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Enter a weight"
            aria-invalid={weightError !== null || tooLarge}
            aria-describedby={weightError || tooLarge ? `${uid}-werr` : undefined}
          />
          <select aria-label="Weight unit" value={unitId} onChange={(e) => setUnitId(e.target.value)}>
            {UNITS.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.symbol})
              </option>
            ))}
          </select>
        </div>
        {(weightError || tooLarge) && (
          <p id={`${uid}-werr`} className="uc-error" role="alert">
            {weightError ?? 'The result is too large to represent.'}
          </p>
        )}
      </div>

      <div className="uc-field gc-purity-field">
        <span className="gc-label" id={`${uid}-pl`}>
          Purity
        </span>
        <Segmented<Mode>
          label="Purity entered as"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'karat', label: 'Karat' },
            { value: 'fineness', label: 'Fineness' },
          ]}
        />
        {mode === 'karat' ? (
          <select aria-labelledby={`${uid}-pl`} value={karatId} onChange={(e) => setKaratId(e.target.value)}>
            {purities.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} ({p.fineness} · {formatNumber(p.fineness / 10)}%)
              </option>
            ))}
          </select>
        ) : (
          <>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              aria-labelledby={`${uid}-pl`}
              list={`${uid}-fl`}
              value={finenessText}
              onChange={(e) => setFinenessText(e.target.value)}
              placeholder="e.g. 916 (parts per 1000)"
              aria-invalid={finenessError !== null}
              aria-describedby={finenessError ? `${uid}-ferr` : undefined}
            />
            <datalist id={`${uid}-fl`}>
              {purities.map((p) => (
                <option key={p.id} value={p.fineness}>
                  {p.label}
                </option>
              ))}
            </datalist>
            {finenessError && (
              <p id={`${uid}-ferr`} className="uc-error" role="alert">
                {finenessError}
              </p>
            )}
          </>
        )}
      </div>

      {shown ? (
        <div className="gp-result" aria-live="polite">
          <div className="gp-bar" role="img" aria-label={`${formatNumber(shown.percent)}% pure gold, ${formatNumber(100 - shown.percent)}% other metals`}>
            <span className="gp-bar-pure" style={{ width: `${shown.percent}%` }} />
          </div>
          <div className="gp-tiles">
            <div className="gp-tile gp-pure">
              <span className="gp-k">Pure gold</span>
              <span className="gp-v">{formatCompact(shown.pureGrams)} g</span>
              {unit.id !== 'g' && (
                <span className="gp-sub">
                  {formatCompact(fromGrams(shown.pureGrams, unit.id))} {unit.symbol}
                </span>
              )}
            </div>
            <div className="gp-tile">
              <span className="gp-k">Other metals</span>
              <span className="gp-v">{formatCompact(shown.alloyGrams)} g</span>
              {unit.id !== 'g' && (
                <span className="gp-sub">
                  {formatCompact(fromGrams(shown.alloyGrams, unit.id))} {unit.symbol}
                </span>
              )}
            </div>
          </div>
          <dl className="gc-facts">
            <dt>Total weight</dt>
            <dd>
              {formatCompact(shown.totalGrams)} g
              {unit.id !== 'g' && parsedWeight.kind === 'ok' && ` (${formatNumber(parsedWeight.value)} ${unit.symbol})`}
            </dd>
            <dt>Purity</dt>
            <dd>{formatNumber(shown.percent)}%</dd>
            <dt>Fineness</dt>
            <dd>{formatNumber(shown.fineness)}</dd>
            <dt>Karat</dt>
            <dd>{shown.standard ? `${shown.karat}K` : `${formatNumber(Number(shown.karat.toFixed(2)))}K (calculated)`}</dd>
          </dl>
        </div>
      ) : (
        <div className="uc-result">
          <span className="uc-result-empty">
            {weightError || finenessError || tooLarge ? 'Fix the input to see a result.' : 'Enter a weight and purity to see the gold content.'}
          </span>
        </div>
      )}

      <div className="uc-actions">
        {shown && <CopyButton text={String(Number(shown.pureGrams.toPrecision(10)))} label="Copy pure gold (g)" />}
        <button type="button" className="uc-clear" onClick={() => setWeight('')}>
          Clear
        </button>
        <button type="button" className="uc-clear" onClick={reset}>
          Reset
        </button>
      </div>

      <details className="uc-notes">
        <summary>Calculation notes</summary>
        <ul>
          <li>Pure gold = total weight × fineness ÷ 1000 (the same as × purity % ÷ 100). Other metals = total weight − pure gold.</li>
          <li>Fineness is parts of pure gold per 1000: 24K = 999, 22K = 916, 20K = 833, 18K = 750, 14K = 585, 9K = 375.</li>
          <li>Values are theoretical, based on the selected purity. A real item can differ slightly; only an assay or hallmark test confirms its purity.</li>
          <li>1 tola = 11.6638038 g. This converter shows gold content by weight only; prices are in the Gold Rate converter.</li>
        </ul>
      </details>
    </section>
  )
}
