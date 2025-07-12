## Forecaster's Edge

Find the best nearby disc golf courses based on weather conditions, with user ratings and real-time course conditions.

- **Frontend**: TypeScript web app using [Open-Meteo](https://open-meteo.com/) Weather API
- **Backend**: Rust API that serves both frontend and API endpoints

## Quick Start

### Frontend Development
```bash
cd frontend/
npm install
npm run start       # Development server
npm run start:mock  # Development with mock data
```

### Backend Development (serves frontend + API)
```bash
cd backend/
shuttle run         # Serves frontend at / and API at /api/*
cargo run --bin xtask test  # Run tests
```

## Deployment

- **Unified**: Single deployment serves both frontend and backend
  ```bash
  cd backend/
  cargo shuttle deploy  # Deploys frontend + API together
  ```
- **Frontend only**: GitHub Pages (`npm run push-gh-pages`)
