import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

/** Decorative Font Awesome icon with the app's single size/alignment style (see .app-icon in App.css). */
export default function AppIcon({ icon }: { icon: IconDefinition | undefined }) {
  if (!icon) return null
  return <FontAwesomeIcon icon={icon} fixedWidth className="app-icon" aria-hidden="true" />
}
