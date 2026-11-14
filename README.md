# Interplanetary Survival Map — Mars Surface-Exploration Decision-Support System

**Team:** Quanta Buddies  
**Challenge:** NASA Space Apps Challenge 2026 — Interplanetary Exploration & Navigation  
**License:** Apache-2.0  
**Core Principle:** Build a scientifically transparent, offline-capable decision-support tool. Use NASA data as evidence, deterministic code for calculations, and AI only where it adds explainable value.

---

## 1. Project Goal & Overview

The **Interplanetary Survival Map** is a transparent, offline-first Marswalk planning environment designed for future planetary surface-exploration planners and astronaut-support teams.

The tool integrates real NASA and ESA topographic altimetry, hyperspectral mineralogy, in-situ weather archives, and shallow radar sounding into an interactive 2D/3D geospatial planning workflow across **10 major Martian regions**:
1. **Jezero Crater** (Perseverance Site — High-Resolution USGS 40m DEM)
2. **Gale Crater** (MSL Curiosity Site — Aeolis Mons Sedimentary Basin)
3. **Valles Marineris** (Grand Canyon System — 7 km Chasm Stratigraphy)
4. **Olympus Mons** (Shield Volcano Caldera Complex — +21.3 km Peak)
5. **Planum Boreum** (North Polar Water Ice Cap & Cryosphere)
6. **Hellas Planitia** (Impact Basin Lowland — High Pressure & Shielding)
7. **Elysium Planitia** (InSight Seismology & Volcanic Plain)
8. **Meridiani Planum** (Opportunity MER-B Hematite Spherule Plain)
9. **Noctis Labyrinthus** (Swarm Rescue Graben Canyon Network)
10. **Acidalia Planitia** (Ares III Lowland Permafrost Sheet)

---

## 2. Architecture & Design Principles

### System Layers
- **Frontend Layer:** React 18 + TypeScript + Vite + Tailwind CSS with dual 2D Canvas and 3D Globe views.
- **Compute Layer:** Deterministic TypeScript engines for Haversine planetary distances ($R_{Mars} = 3389.5\text{ km}$), bilinear DEM elevation interpolation, 3×3 Sobel slope gradient calculations, metabolic energy models, and A* 8-neighborhood discrete grid search.
- **Data Layer:** Bundled offline JSON DEM matrices, hazard catalogs, and science target datasets.
- **AI/Agent Layer:** Gemini 3.8 Flash RAG for explaining trade-offs, describing evidence uncertainty, and summarizing route options. All math and routing remain 100% deterministic in client code.

---

## 3. NASA Data Acquisition & Provenance Table

| Region | Primary Source Product ID & URL | Spatial Bounds (Lat / Lon) | Stored Grid Res. | Native Res. | Provenance Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Jezero Crater** | USGS CTX/HiRISE `JEZ_hirise_soc_006_DTM` [[USGS]](https://planetarymaps.usgs.gov/mosaic/mars2020_trn/HiRISE/) | $18.38^\circ\text{N}\text{--}18.56^\circ\text{N}$, $77.30^\circ\text{E}\text{--}77.48^\circ\text{E}$ | $39.9\text{m}$ | $1\text{m--}20\text{m}$ | `LIVE_NASA` |
| **Gale Crater** | MSL Navcam/HiRISE DTM `PSP_009149_1750` [[PDS]](https://pds-geosciences.wustl.edu/msl/) | $-5.85^\circ\text{S}\text{--}-4.35^\circ\text{S}$, $137.10^\circ\text{E}\text{--}138.10^\circ\text{E}$ | $620\text{m}$ | $463\text{m}$ | `RASTER-DERIVED` |
| **Valles Marineris** | ESA HRSC & MOLA MEGDR `mgsl_300x` [[PDS]](https://pds-geosciences.wustl.edu/mgs/) | $-17.50^\circ\text{S}\text{--}-10.00^\circ\text{S}$, $-66.00^\circ\text{E}\text{--}-52.00^\circ\text{E}$ | $4750\text{m}$ | $463\text{m}$ | `RASTER-DERIVED` |
| **Olympus Mons** | MGS MOLA MEGDR 128ppd `mgsl_300x` [[PDS]](https://pds-geosciences.wustl.edu/mgs/) | $15.00^\circ\text{N}\text{--}22.50^\circ\text{N}$, $-140.00^\circ\text{E}\text{--}-127.50^\circ\text{E}$ | $4800\text{m}$ | $463\text{m}$ | `RASTER-DERIVED` |
| **Planum Boreum** | MRO SHARAD / MOLA MEGDR `s_00410201` [[PDS]](https://pds-geosciences.wustl.edu/mro/) | $82.00^\circ\text{N}\text{--}90.00^\circ\text{N}$, $-180.00^\circ\text{E}\text{--}180.00^\circ\text{E}$ | $8200\text{m}$ | $463\text{m}$ | `RASTER-DERIVED` |
| **Hellas Planitia** | MGS MOLA MEGDR 128ppd `megt_42s_070e` [[PDS]](https://pds-geosciences.wustl.edu/mgs/) | $-47.00^\circ\text{S}\text{--}-37.50^\circ\text{S}$, $64.00^\circ\text{E}\text{--}77.00^\circ\text{E}$ | $4750\text{m}$ | $463\text{m}$ | `RASTER-DERIVED` |
| **Elysium Planitia** | NASA InSight SEIS & MRO HiRISE [[PDS]](https://pds-geosciences.wustl.edu/insight/) | $1.00^\circ\text{N}\text{--}5.00^\circ\text{N}$, $152.00^\circ\text{E}\text{--}157.50^\circ\text{E}$ | $2360\text{m}$ | $463\text{m}$ | `RASTER-DERIVED` |
| **Meridiani Planum** | MER-B Opportunity / MOLA MEGDR [[PDS]](https://pds-geosciences.wustl.edu/mer/) | $-1.50^\circ\text{S}\text{--}1.10^\circ\text{N}$, $355.50^\circ\text{E}\text{--}359.50^\circ\text{E}$ | $1640\text{m}$ | $463\text{m}$ | `RASTER-DERIVED` |
| **Noctis Labyrinthus** | ESA HRSC & MOLA MEGDR `frt0003bf4` [[ESA]](https://www.esa.int/) | $-9.50^\circ\text{S}\text{--}-4.50^\circ\text{S}$, $-106.00^\circ\text{E}\text{--}-98.00^\circ\text{E}$ | $3200\text{m}$ | $463\text{m}$ | `RASTER-DERIVED` |
| **Acidalia Planitia** | MGS MOLA MEGDR `megt_50n_339e` [[PDS]](https://pds-geosciences.wustl.edu/mgs/) | $46.50^\circ\text{N}\text{--}53.00^\circ\text{N}$, $334.00^\circ\text{E}\text{--}345.00^\circ\text{E}$ | $3380\text{m}$ | $463\text{m}$ | `RASTER-DERIVED` |

---

## 4. Deterministic Computations vs. AI Disclosure

- **Deterministic Computations:**
  - Route planning (A* search with min-heap priority queue).
  - Slope calculation ($\theta = \arctan(\Delta z / d)$).
  - Planetary distance ($R_{Mars} = 3389.5\text{ km}$).
  - Atmospheric pressure scaling ($P(z) = P_0 \exp(-z / 11.1\text{km})$).
  - Rover mobility limits ($15^\circ$ drive ceiling) vs. Human EVA thresholds ($15\text{--}20^\circ$ metabolic expenditure surge).
- **AI-Use Disclosure:**
  - AI is used solely to generate natural language explanations of pre-computed route trade-offs and summarize scientific evidence.
  - The AI assistant never calculates coordinates, elevations, distances, or safety scores.
  - When offline, a deterministic fallback summary engine provides instant explanations without LLM network dependency.

---

## 5. Setup & Local Reproduction Instructions

### Prerequisites
- Node.js 18+
- npm 9+

### Commands
```bash
# Install dependencies
npm install --legacy-peer-deps

npm install --force

npm install react-is --save --legacy-peer-deps

# Run automated unit & integration test suite (32 tests)
npm test

# Run TypeScript type check
npx tsc --noEmit

# Run Linter
npm run lint

# Build production bundle
npm run build

# Start local server
npm start
```

---

## 6. Known Scientific & Data Limitations

1. **Sub-Grid Obstacles:** Coarse DEMs (620m to 8.2km cell spacing) cannot resolve 20cm rocks or narrow cracks; sub-meter hazards are photometrically estimated.
2. **Dynamic Soil Mechanics:** Slope thresholds evaluate geometric incline and wheel slip limits but do not model dynamic soil shear strength or 6-wheel suspension kinetics in real time.
3. **Uncrewed Operational Era:** Telemetry represents active robotic assets (Perseverance & Curiosity); human crew EVA biometrics are explicitly labeled `DATA_UNAVAILABLE`.

---

## 7. License & Copyright
Licensed under the **Apache License, Version 2.0**. See `LICENSE` for details. © 2026 Quanta Buddies.

---

## 8. AI Studio Development Acknowledgment

Google AI Studio was used as an AI-assisted development tool for selected development tasks, including parts of the user interface and development workflow. The project concept, system design, feature planning, integration, testing, and overall development direction are maintained by Quanta Buddies.
