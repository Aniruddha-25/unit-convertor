import { useSyncExternalStore } from 'react'
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons'
import AppIcon from '../AppIcon/AppIcon.tsx'
import { getTheme, setTheme, subscribeTheme } from './theme.ts'
import './ThemeToggle.css'

/**
 * One pill-shaped switch with two states: sun on the left = light theme, moon on the right = dark theme.
 * The thumb slides between them; the whole app switches theme through theme.ts.
 */
export default function ThemeToggle() {
  const dark = useSyncExternalStore(subscribeTheme, getTheme) === 'dark'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="theme-toggle"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
    >
      <span className="theme-thumb" aria-hidden="true">
        <AppIcon icon={faSun} />
        <AppIcon icon={faMoon} />
      </span>
    </button>
  )
}
