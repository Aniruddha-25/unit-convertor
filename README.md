# Unit Converter

A React + TypeScript web app for unit conversion. Pick a category from the grid and it opens in a dialog.

**Live:** <https://Aniruddha-25.github.io/unit-convertor/>

## Converters

Currently available: **Time** (Duration, Clock time) and **Time Zone**. All others are coming soon.

```mermaid
flowchart LR
    A["Unit Converter"]

    A --> B["Physical"]
    A --> C["Computer"]
    A --> D["Date & Time"]
    A --> E["Other"]

    B --> B1["Time<br/>(Duration, Clock time)"]
    B --> B2["Length"]
    B --> B3["Area"]
    B --> B4["Volume"]
    B --> B5["Mass / Weight"]
    B --> B6["Temperature"]
    B --> B7["Speed"]
    B --> B8["Pressure"]
    B --> B9["Energy"]
    B --> B10["Power"]
    B --> B11["Force"]
    B --> B12["Density"]
    B --> B13["Frequency"]
    B --> B14["Angle"]

    C --> C1["Data Storage"]
    C --> C2["Data Transfer Rate"]

    D --> D1["Time Zone"]
    D --> D2["Time Duration"]
    D --> D3["Date Difference"]

    E --> E1["Fuel Economy"]
    E --> E2["Cooking Measurements"]
    E --> E3["Shoe Size"]

    classDef root fill:#e5e7eb,stroke:#374151,color:#111827
    classDef physical fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef computer fill:#dcfce7,stroke:#16a34a,color:#14532d
    classDef datetime fill:#fef3c7,stroke:#d97706,color:#78350f
    classDef other fill:#f3e8ff,stroke:#9333ea,color:#581c87

    class A root
    class B,B1,B2,B3,B4,B5,B6,B7,B8,B9,B10,B11,B12,B13,B14 physical
    class C,C1,C2 computer
    class D,D1,D2,D3 datetime
    class E,E1,E2,E3 other
```

> Source of truth: [src/config/categories.ts](src/config/categories.ts)

### Adding a converter

1. Add or update the category in `src/config/categories.ts` (set `status: 'available'` and attach a `converter`).
2. Update the diagram above: add a node under its group and list it in the matching `class` line.

## Tech Stack

- React 19 + TypeScript
- Vite
- `@js-temporal/polyfill` (time zones and DST)
- ESLint, Node test runner

## Getting Started

Requires Node.js (CI uses 22).

```bash
git clone https://github.com/Aniruddha-25/unit-convertor.git
cd unit-convertor
npm install
```

| Task             | Command           |
|------------------|-------------------|
| Run locally      | `npm run dev`     |
| Production build | `npm run build`   |
| Preview build    | `npm run preview` |
| Lint             | `npm run lint`    |
| Test             | `npm test`        |

## Deployment

Deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`.

1. In **Settings → Pages**, set the source to **GitHub Actions**.
2. Push to `main`.

The Vite base path is `/unit-convertor/` ([vite.config.ts](vite.config.ts)). Update it if the repository is renamed.

## Contributing

Fork, create a branch, run `npm run lint` and `npm test`, then open a pull request.

## License

No license file is included yet.
