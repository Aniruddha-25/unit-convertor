# Unit Converter

A React + TypeScript + Vite app. Pick a category from the grid; it opens in a dialog (close with the × button or Escape).

## Converters

| Category | Status |
| --- | --- |
| Time | Available: **Duration** (ns → years) and **Clock time** (12h/24h time of day) |
| Time Zone | Available |
| All others | Coming soon |

### Time Zone Converter

Converts a date and time between any two IANA time zones.
- **Input:** the date and time are shown compactly. Click a time to open the picker (a native date picker in ISO `YYYY-MM-DD`, so day/month order is never ambiguous, plus a clock dial or typed fields in 12-hour or 24-hour format). It closes with ×, Escape or an outside click. Hours, minutes, seconds and dates (including leap years) are validated with clear messages.
- **Input:** the date and time are shown compactly; click a time to open the date picker and clock dial (closes with ×, Escape or an outside click). Dates use (native date picker, ISO `YYYY-MM-DD`, so day/month order is never ambiguous) and a time chosen on a clock dial or typed, in 12-hour (with AM/PM) or 24-hour format. Hours, minutes, seconds and dates (including leap years) are validated with clear messages.
- **Zones:** a searchable list of every IANA zone the browser reports (plus UTC). Search by city, country or identifier (e.g. "india", "new york", "Asia/Tok"). Each option shows its *current* UTC offset.
- **Accuracy:** [`@js-temporal/polyfill`](https://github.com/js-temporal/temporal-polyfill) with the IANA database. No hand-maintained UTC offset tables, and the browser's local zone is never assumed. Offsets and daylight saving are computed for the exact date chosen.
- **DST edge cases:** a local time that happens twice (clocks go back) or never (clocks jump forward) is detected and explained, and you choose which occurrence or adjustment to use. No guess is made.
- **Result:** converted time, weekday and full date, offset, and whether it is the previous, same or next day compared with the source date.
- **Swap** exchanges the zones and keeps the same moment in time. **Copy** copies the converted result. **Reset** restores the defaults.

Code layout: `src/converters/timezone/timeZoneUtils.ts` (pure logic, tested), `zoneAliases.ts` (search aliases and legacy-name mapping only), `src/components/converter/TimeZoneConverter.tsx` (UI), `ZoneCombobox.tsx` (searchable select), `ClockTimeInput.tsx` (shared clock input).

### Time Converter

- **Duration:** units are converted through seconds using fixed factors. Months and years are *averages* (1 year = 365.25 days, 1 month = 30.4375 days), not calendar months.
- **Clock time:** a time of day (not a duration) shown in 12-hour and 24-hour form, plus elapsed time since midnight.

## Scripts

```
npm run dev     # start the dev server
npm run build   # type-check and build
npm run lint
npm test        # unit tests (Node test runner)
```

---

# React + TypeScript + Vite template notes

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## Deploying to GitHub Pages

The project is configured for the repository URL:

<https://Aniruddha-25.github.io/unit-convertor/>

To enable deployment:

1. In the repository on GitHub, open **Settings → Pages** and set the build and deployment source to **GitHub Actions**.
2. Push changes to the `main` branch. The workflow in `.github/workflows/deploy.yml` installs dependencies with `npm ci`, builds the site with `npm run build`, and deploys the `dist` directory.
3. After the workflow completes, the site will be available at the URL above.

The Vite base path is set to `/unit-convertor/` so built assets resolve correctly from the repository’s Pages URL.

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
