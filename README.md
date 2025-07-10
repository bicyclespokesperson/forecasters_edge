## Forecaster's Edge

Ranks the weather at nearby disc golf courses with user ratings and course conditions. 

- **Frontend**: Interactive web app powered by the [Open-Meteo](https://open-meteo.com/) Weather API
- **Backend**: Rust API for user-generated course ratings and conditions

### Project Structure

```
forecasters-edge/
├── frontend/          # TypeScript web application
│   ├── src/          # Source code
│   ├── data/         # Course data and weather samples
│   └── package.json  # Frontend dependencies
├── backend/          # Rust API server
│   ├── src/         # Rust source code
│   └── Cargo.toml   # Rust dependencies
└── README.md
```

### Frontend Development

```bash
cd frontend/
npm install
npm run start      # Development server
npm run test       # Run tests
npm run build      # Production build
npm run lint       # Code formatting
```

### Backend Development

```bash
cd backend/
cargo run          # Start API server
cargo test         # Run tests
cargo clippy       # Linting
```

### Deployment

- **Frontend**: GitHub Pages (`npm run push-gh-pages`)
- **Backend**: Railway or similar Rust hosting platform
