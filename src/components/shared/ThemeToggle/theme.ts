export type Theme = 'light' | 'dark'

/** Must match the key read by the inline script in index.html, which applies the theme before first paint. */
const STORAGE_KEY = 'theme'
const ANIMATION_MS = 300

const media = window.matchMedia('(prefers-color-scheme: dark)')
const root = document.documentElement
const listeners = new Set<() => void>()

const isTheme = (value: unknown): value is Theme => value === 'light' || value === 'dark'
const systemTheme = (): Theme => (media.matches ? 'dark' : 'light')

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return isTheme(value) ? value : null
  } catch {
    return null
  }
}

let current: Theme = isTheme(root.dataset.theme) ? root.dataset.theme : (storedTheme() ?? systemTheme())
let animationTimer: ReturnType<typeof setTimeout> | undefined

/** Sets data-theme on <html>; every colour in the app comes from the CSS variables that attribute selects. */
function apply(next: Theme, animate: boolean) {
  if (animate && next !== current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('theme-anim') // a short colour transition while switching
    clearTimeout(animationTimer)
    animationTimer = setTimeout(() => root.classList.remove('theme-anim'), ANIMATION_MS)
  }
  root.dataset.theme = next
  if (next === current) return
  current = next
  listeners.forEach((notify) => notify())
}

apply(current, false)

/** The user's choice: applied now and remembered for next time. */
export function setTheme(next: Theme): void {
  apply(next, true)
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    /* storage unavailable: the choice still applies for this visit */
  }
}

export const getTheme = (): Theme => current

export function subscribeTheme(notify: () => void): () => void {
  listeners.add(notify)
  return () => {
    listeners.delete(notify)
  }
}

// Until the user chooses, follow the operating system's setting (including while the page is open).
media.addEventListener('change', () => {
  if (!storedTheme()) apply(systemTheme(), true)
})
// Another tab changed the theme.
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY) apply(storedTheme() ?? systemTheme(), true)
})
