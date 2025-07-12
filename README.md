## Forecaster's Edge

Find the best nearby disc golf courses based on weather conditions, with user ratings and real-time course conditions.

- **Frontend**: TypeScript web app using [Open-Meteo](https://open-meteo.com/) Weather API
- **Backend**: Rust API for course ratings and conditions

## Quick Start

### Frontend Development
```bash
cd frontend/
npm install
npm run start       # Development server
npm run start:mock  # Development with mock data
npm run build       # Production build
```

### Backend Development
```bash
cd backend/
shuttle run         # Development server (recommended)
cargo run --bin xtask test  # Run tests
```

## Deployment

- **Frontend**: GitHub Pages (`npm run push-gh-pages`)
- **Backend**: Shuttle.rs (`cargo shuttle deploy`)
