# Unit Converter

A React + TypeScript web app for unit conversion. Pick a category from the grid and it opens in a dialog.

**Live:** <https://Aniruddha-25.github.io/unit-convertor/>

## Converters


```mermaid
flowchart LR
    A["Unit Converter"]

    A --> B["Basic Measurements"]
    A --> C["Geometry & Mathematics"]
    A --> D["Motion & Mechanics"]
    A --> E["Energy & Electrical"]
    A --> F["Date & Time"]
    A --> G["Digital & Computing"]
    A --> H["Everyday & Lifestyle"]

    B --> B1["Length"]
    B --> B2["Area"]
    B --> B3["Volume"]
    B --> B4["Mass / Weight"]
    B --> B5["Temperature"]

    C --> C1["Angle"]
    C --> C2["Density"]

    D --> D1["Speed"]
    D --> D2["Force"]
    D --> D3["Pressure"]

    E --> E1["Energy"]
    E --> E2["Power"]
    E --> E3["Frequency"]

    F --> F1["Time<br/>(Duration, Clock time)"]
    F --> F2["Time Zone"]
    F --> F3["Time Duration"]
    F --> F4["Date Difference"]

    G --> G1["Data Storage"]
    G --> G2["Data Transfer Rate"]

    H --> H0["Currency"]
    H --> H1["Fuel Economy"]
    H --> H2["Cooking Measurements"]
    H --> H3["Shoe Size"]

    classDef root fill:#e5e7eb,stroke:#374151,color:#111827
    classDef basic fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef geometry fill:#cffafe,stroke:#0891b2,color:#164e63
    classDef motion fill:#fee2e2,stroke:#dc2626,color:#7f1d1d
    classDef energy fill:#ffedd5,stroke:#ea580c,color:#7c2d12
    classDef datetime fill:#fef3c7,stroke:#d97706,color:#78350f
    classDef digital fill:#dcfce7,stroke:#16a34a,color:#14532d
    classDef lifestyle fill:#f3e8ff,stroke:#9333ea,color:#581c87
  

    class A root
    class B,B1,B2,B3,B4,B5 basic
    class C,C1,C2 geometry
    class D,D1,D2,D3 motion
    class E,E1,E2,E3 energy
    class F,F1,F2,F3,F4 datetime
    class G,G1,G2 digital
    class H,H0,H1,H2,H3 lifestyle
```

## Tech Stack

- React 19 + TypeScript
- Vite
- ESLint, Node test runner

## Getting Started

```bash
git clone https://github.com/Aniruddha-25/unit-convertor.git
```

```bash
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