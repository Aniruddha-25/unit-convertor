import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faBolt, faCalendar, faCalendarWeek, faCarBattery, faClock, faCoins, faCube, faDownLeftAndUpRightToCenter,
  faEarthAmericas, faExpand, faGasPump, faGaugeHigh, faGears, faHandFist, faHardDrive, faHourglassHalf,
  faHouse, faLayerGroup, faMicrochip, faPlug, faRightLeft, faRuler, faRulerCombined, faScaleBalanced,
  faShapes, faShoePrints, faTemperatureHalf, faUtensils, faWaveSquare, faWeightHanging,
} from '@fortawesome/free-solid-svg-icons'

/** One distinct icon per category id (see categories.ts). The test in categoryIcons.test.ts keeps this exhaustive. */
export const categoryIcons: Readonly<Record<string, IconDefinition>> = {
  length: faRuler,
  area: faExpand,
  volume: faCube,
  mass: faWeightHanging,
  temperature: faTemperatureHalf,
  angle: faRulerCombined,
  density: faLayerGroup,
  speed: faGaugeHigh,
  force: faHandFist,
  pressure: faDownLeftAndUpRightToCenter,
  energy: faBolt,
  power: faPlug,
  frequency: faWaveSquare,
  time: faClock,
  'time-duration': faHourglassHalf,
  'time-zone': faEarthAmericas,
  'date-difference': faCalendarWeek,
  'data-storage': faHardDrive,
  'data-rate': faRightLeft,
  currency: faCoins,
  'fuel-economy': faGasPump,
  cooking: faUtensils,
  'shoe-size': faShoePrints,
}

export const groupIcons: Readonly<Record<string, IconDefinition>> = {
  basic: faScaleBalanced,
  geometry: faShapes,
  motion: faGears,
  energy: faCarBattery,
  datetime: faCalendar,
  digital: faMicrochip,
  lifestyle: faHouse,
}
