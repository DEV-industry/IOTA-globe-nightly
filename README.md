<p align="center">
  <img src="public/favicon.png" alt="IOTA Globe" width="80" />
</p>

<h1 align="center">🌐 IOTA Globe Explorer</h1>

<p align="center">
  <strong>Interactive 3D Validator Map & Real-Time Network Dashboard for the IOTA Blockchain</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" alt="Vite 6" />
  <img src="https://img.shields.io/badge/Three.js-0.184-000000?logo=three.js&logoColor=white" alt="Three.js" />
  <img src="https://img.shields.io/badge/Vercel-Serverless-000000?logo=vercel&logoColor=white" alt="Vercel" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

---

## ✨ Overview

**IOTA Globe** is a premium, real-time blockchain explorer dashboard that visualizes the IOTA mainnet validator network on an interactive 3D globe. The application fetches live data directly from the IOTA JSON-RPC endpoint through a secure serverless proxy, presenting network activity, transaction blocks, epoch progress, staking economics, and validator geographic distribution — all in a sleek, dark-themed interface with smooth animations.

---

## 🖼️ Features

### 🌍 Interactive 3D Globe
- **react-globe.gl** powered 3D visualization with Three.js rendering
- Validators plotted as colored, pulsing markers based on stake tier (top/mid/low)
- Sonar ring animations radiating from each validator node
- Animated arcs connecting validators across the globe (GitHub-style)
- Hex-polygon dot-matrix continent rendering
- Fly-to camera transitions when selecting a validator
- Zoom, rotate, and reset controls
- Auto-rotation with intelligent pause on user interaction
- Responsive scaling — optimized for both desktop and mobile

### 📊 Dashboard Cards
- **Epoch Overlay** — live countdown timer with progress bar, rotating validator showcase
- **Network Activity** — active validators, total stake, staking ratio, reference gas price
- **IOTA Price** — real-time IOTA/USD price fetched from CoinGecko API
- **Top Validators** — ranked list of top validators by stake with APY
- **Live TPS** — real-time transactions-per-second with animated sparkline chart
- **Transaction Blocks** — latest transactions with digest, sender, gas, and timing
- **Network Economics** — Ref. Gas Price, Avg. Txn Cost, Storage Fund, Total Staked, Network APY

### 📈 Analytics Page (`/charts`)
- **Block Overview** — highest fee block, total transactions, avg. block fullness, total tips
- **Validator Footprint** — interactive donut chart showing stake distribution by country or provider
- **Block Performance** — block time chart with moving average overlay
- **Transaction Analytics** — TPS & transaction count composite chart
- **Fee Dynamics** — transaction fees and median fees per block (base + priority)
- All charts powered by **Recharts** with live data from checkpoints

### 🔍 Advanced Search
- Debounced search with animated dropdown suggestions
- Supports Addresses, Transactions, Blocks, Epochs, and Validators
- Validator search matches against cached live data (name, address, description)
- Keyboard navigation (↑↓ navigate, Enter select, Esc close)
- Validator selection triggers fly-to animation on the globe
- Non-validator results open in the official IOTA Explorer

### 📋 Data Table
- Tabbed navigation: Transactions / Validators / Checkpoints
- Live transaction feed with digest, sender, gas cost, and timing
- Validator table with stake, APY, commission, and voting power
- Checkpoint table with sequence number, epoch, and transaction count
- Clickable rows linking to the IOTA Explorer

### 🎨 UI/UX
- Dark space theme with animated star background
- Glassmorphism card design with backdrop blur
- Smooth staggered entrance animations via **Framer Motion**
- Full-screen loading screen with IOTA logo animation
- Custom scrollbar styling
- Responsive layout (mobile-first)
- Google Fonts: **Inter** (UI) + **JetBrains Mono** (monospace)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Vite + React)               │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │  Globe    │  │ Dashboard│  │ Analytics│               │
│  │  Scene    │  │  Cards   │  │  Charts  │               │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘               │
│       │              │              │                     │
│       └──────────────┼──────────────┘                     │
│                      │                                    │
│              ┌───────┴───────┐                            │
│              │  TanStack     │                            │
│              │  React Query  │                            │
│              └───────┬───────┘                            │
│                      │                                    │
│              ┌───────┴───────┐                            │
│              │  iotaApi.ts   │  (authorized fetch client) │
│              └───────┬───────┘                            │
└──────────────────────┼──────────────────────────────────┘
                       │  /api/*
                       ▼
┌──────────────────────────────────────────────────────────┐
│             Vercel Serverless Functions (api/)            │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐          │
│  │ /api/auth│  │ /api/rpc │  │/api/validators│          │
│  │ (JWT)    │  │ (proxy)  │  │  (merged data)│          │
│  └────┬─────┘  └────┬─────┘  └───────┬───────┘          │
│       │              │                │                   │
│       └──────────────┼────────────────┘                   │
│                      │                                    │
│              ┌───────┴───────┐                            │
│              │  _security.ts │                            │
│              │  CORS · Rate  │                            │
│              │  Limit · HMAC │                            │
│              └───────────────┘                            │
└──────────────────────┼──────────────────────────────────┘
                       │
                       ▼
            ┌──────────────────┐
            │  IOTA Mainnet    │
            │  JSON-RPC Node   │
            │ api.mainnet.     │
            │   iota.cafe      │
            └──────────────────┘
```

---

## 📁 Project Structure

```
IOTA-globe-nightly/
├── api/                          # Vercel Serverless Functions (backend)
│   ├── _security.ts              #   CORS, HMAC JWT auth, rate limiting
│   ├── auth.ts                   #   GET /api/auth — issue short-lived tokens
│   ├── rpc.ts                    #   POST /api/rpc — generic JSON-RPC proxy
│   └── validators.ts             #   GET /api/validators — merged system state + APY
│
├── public/                       # Static assets
│   ├── favicon.png               #   App favicon
│   └── profile.jpg               #   Author profile image
│
├── src/
│   ├── main.tsx                  # React entry point
│   ├── App.tsx                   # Root layout, routing, providers
│   ├── types.ts                  # Shared TypeScript interfaces
│   ├── index.css                 # Global styles, animations, Tailwind directives
│   ├── vite-env.d.ts             # Vite type declarations
│   │
│   ├── components/
│   │   ├── Dashboard/            # Dashboard page components
│   │   │   ├── AnalyticsPage.tsx #   /charts page with Recharts visualizations
│   │   │   ├── DataTable.tsx     #   Tabbed data table (Txs/Validators/Checkpoints)
│   │   │   ├── EpochOverlay.tsx  #   Epoch countdown + validator showcase
│   │   │   ├── Header.tsx        #   Top navigation bar with search & settings
│   │   │   ├── HeroGlobe.tsx     #   Globe container with validator modal
│   │   │   ├── LiveTpsCard.tsx   #   Real-time TPS with sparkline animation
│   │   │   ├── NetworkActivityCard.tsx  # Network stats summary
│   │   │   ├── NetworkEconomicsCard.tsx # Gas, Txn Cost, Storage, Stake, APY cards
│   │   │   ├── PriceOverlay.tsx  #   Live IOTA/USD price from CoinGecko
│   │   │   ├── TopValidatorsCard.tsx    # Top validators ranked by stake
│   │   │   └── TransactionBlocksCard.tsx # Recent transaction feed
│   │   │
│   │   ├── Globe/                # 3D Globe components
│   │   │   ├── GlobeScene.tsx    #   Main react-globe.gl scene
│   │   │   ├── GlobeControls.tsx #   Zoom in/out/reset overlay buttons
│   │   │   ├── ValidatorMarker.tsx #  Tooltip HTML generator for markers
│   │   │   └── ValidatorModal.tsx  #  Detailed validator info modal
│   │   │
│   │   └── UI/                   # Reusable UI components
│   │       ├── ErrorBoundary.tsx  #   React error boundary wrapper
│   │       ├── Footer.tsx        #   Page footer with logo & GitHub link
│   │       ├── GlobalLoader.tsx  #   Full-screen loading animation
│   │       ├── IotaLogo.tsx      #   Animated SVG IOTA logo
│   │       ├── SearchBar.tsx     #   Advanced search with suggestions
│   │       └── StarsBackground.tsx #  Canvas-based animated starfield
│   │
│   ├── context/
│   │   └── SettingsContext.tsx    # Globe settings (animations, auto-rotate)
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAnalyticsHistory.ts #  Checkpoint-based analytics data
│   │   ├── useCheckpoints.ts     #   Live checkpoint polling (5s)
│   │   ├── useEpochTimer.ts      #   Live epoch countdown timer
│   │   ├── useGeocode.ts         #   Validator → lat/lng geocoding
│   │   ├── useRecentTransactions.ts # Recent tx details from checkpoints
│   │   └── useValidators.ts      #   Validator + system state polling (30s)
│   │
│   ├── services/
│   │   └── iotaApi.ts            # API client with auth token management
│   │
│   └── utils/
│       ├── formatters.ts         # Number/address/time formatting utilities
│       └── validatorLocations.ts # Validator → city/country name mapping
│
├── index.html                    # HTML entry point
├── package.json                  # Dependencies & scripts
├── vite.config.ts                # Vite configuration with API proxy
├── tailwind.config.js            # Tailwind CSS theme customization
├── tsconfig.json                 # TypeScript configuration
├── postcss.config.js             # PostCSS plugins
├── .env.example                  # Environment variable template
└── .gitignore                    # Git ignore rules
```

---

## 🛠️ Tech Stack

| Layer         | Technology                                                    |
| ------------- | ------------------------------------------------------------- |
| **Framework** | React 19 + TypeScript 5.8                                     |
| **Bundler**   | Vite 6                                                        |
| **3D Globe**  | react-globe.gl + Three.js 0.184                               |
| **Charts**    | Recharts 3.8                                                  |
| **Animations**| Framer Motion 12                                              |
| **Routing**   | React Router DOM 7                                            |
| **Data**      | TanStack React Query 5 (auto-polling, caching, retry)         |
| **Styling**   | Tailwind CSS 3.4 + custom CSS animations                      |
| **Backend**   | Vercel Serverless Functions (@vercel/node)                     |
| **API**       | IOTA Mainnet JSON-RPC (`api.mainnet.iota.cafe`)               |
| **Fonts**     | Inter (UI), JetBrains Mono (monospace) via Google Fonts        |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **Vercel CLI** (optional, for local serverless functions)

### Installation

```bash
# Clone the repository
git clone https://github.com/DEV-industry/IOTA-globe-nightly.git
cd IOTA-globe-nightly

# Install dependencies
npm install
```

### Environment Setup

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Client-side (exposed to browser via Vite)
VITE_PROXY_BASE_URL=/api

# Server-side ONLY (Vercel Functions)
PROXY_API_TOKEN=your-strong-random-secret-here

# Optional token lifetime (seconds, default: 300)
PROXY_TOKEN_TTL_SECONDS=300

# Allowed origins/hosts (comma-separated)
ALLOWED_ORIGINS=http://localhost:5173
ALLOWED_HOSTS=localhost:5173
```

### Development

**Option A: Vite only (frontend)**
```bash
npm run dev
```
> Starts the Vite dev server at `http://localhost:5173`. API calls will fail without the serverless proxy.

**Option B: Vercel CLI (full-stack, recommended)**
```bash
npx vercel dev
```
> Runs both the Vite frontend and Vercel Serverless Functions together. The API proxy at `/api/*` will be fully operational.

### Build

```bash
npm run build
```

### Other Scripts

| Command            | Description                                   |
| ------------------ | --------------------------------------------- |
| `npm run dev`      | Start Vite dev server                         |
| `npm run build`    | Type-check + production build                 |
| `npm run preview`  | Preview production build locally              |
| `npm run format`   | Format source code with Prettier              |
| `npm run typecheck`| Run TypeScript type checking (no emit)        |

---

## 🔒 Security Architecture

The application implements a multi-layered security model for the serverless API proxy:

### 1. HMAC-Signed JWT Authentication
- The frontend requests a short-lived token from `/api/auth`
- Tokens are HMAC-SHA256 signed using a server-side secret (`PROXY_API_TOKEN`)
- Token payload includes: origin, host, user-agent hash, IP hash, nonce
- Tokens expire after a configurable TTL (default: 5 minutes)
- Automatic token refresh with 15-second skew buffer

### 2. CORS Policy
- Strict origin validation against an allowlist
- Supports dynamic Vercel preview URLs (`*.vercel.app`)
- Fallback to Host header and Referer header validation

### 3. Rate Limiting
- Per-IP, per-endpoint rate limits:
  - `/api/auth` — 30 req/min
  - `/api/validators` — 60 req/min
  - `/api/rpc` — 120 req/min

### 4. RPC Method Allowlist
Only these IOTA JSON-RPC methods are permitted through the proxy:
- `iota_getCheckpoints`
- `iota_multiGetTransactionBlocks`
- `iotax_getLatestIotaSystemState`
- `iotax_getValidatorsApy`

### 5. Input Validation
- Request body size limit (12 KB)
- Per-method parameter validation (types, ranges, array lengths)
- Transaction digest count limited to 50 per request

---

## 🌐 Deployment

The project is designed for **Vercel** deployment:

```bash
# Deploy to Vercel
npx vercel --prod
```

### Required Environment Variables (Vercel Dashboard)

| Variable                   | Description                              |
| -------------------------- | ---------------------------------------- |
| `PROXY_API_TOKEN`          | Secret for HMAC token signing            |
| `ALLOWED_ORIGINS`          | Comma-separated allowed origins          |
| `ALLOWED_HOSTS`            | Comma-separated allowed hosts            |
| `PROXY_TOKEN_TTL_SECONDS`  | Token lifetime in seconds (optional)     |

The Vercel deployment automatically:
- Builds the Vite frontend to `dist/`
- Deploys serverless functions from `api/`
- Configures routing so `/api/*` hits the functions

---

## 📡 Data Flow

### Polling Intervals

| Data Source           | Interval   | Hook                       |
| --------------------- | ---------- | -------------------------- |
| Validators + System   | 30 seconds | `useValidators`            |
| Checkpoints           | 5 seconds  | `useCheckpoints`           |
| Recent Transactions   | 10 seconds | `useRecentTransactions`    |
| Analytics History     | 5 seconds  | `useAnalyticsHistory`      |
| IOTA Price (external) | 60 seconds | `PriceOverlay` (CoinGecko) |

### Geocoding Strategy

Validators are plotted on the globe using a 3-tier geocoding strategy:

1. **Known Location Lookup** — Match validator name/description against a curated database of ~50 known validators and ~60 cities/countries
2. **Geo API** (future) — Resolve hostname from `netAddress` via IP geolocation
3. **Fallback Hash** — Deterministic positioning based on address hash, snapped to 13 major data center regions worldwide (avoids ocean placement)

---

## 🎯 Routes

| Path      | Component     | Description                               |
| --------- | ------------- | ----------------------------------------- |
| `/`       | `AppContent`  | Main dashboard with globe and data cards  |
| `/charts` | `ChartsPage`  | Analytics page with Recharts graphs       |

---

## 👤 Author

**DEV-Industry** — [GitHub](https://github.com/DEV-industry)

Built as a recruitment project for **Nightly** 🌙

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).