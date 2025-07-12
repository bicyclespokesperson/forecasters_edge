# Forecaster's Edge Backend

Rust API for disc golf course ratings and conditions, built with Axum and PostgreSQL. Serves both frontend and API from a single deployment using embedded assets. Hosted at [shuttle.rs](https://console.shuttle.dev/project/proj_01JZW0P9WDWA25ZZMQXS9KB24D/deployments).

## Quick Start

```bash
# Development server - serves frontend at / and API at /api/*
shuttle run

# Run tests
cargo run --bin xtask test

# Deploy unified frontend + backend
cargo shuttle deploy
```

## Prerequisites

- **Rust**: Install from https://rustup.rs/
- **Docker**: Required for `shuttle run`
- **Node.js**: Required for frontend building (build script automatically builds frontend)

## Architecture

- **Embedded Assets**: Frontend is embedded directly in the binary at compile time
- **Unified Serving**: Frontend served at `/`, API at `/api/*`
- **Build Integration**: Frontend automatically built before backend compilation

## API Endpoints

- `GET /api/courses/{id}/data` - Get course ratings and conditions
- `POST /api/courses/{id}/submit` - Submit ratings and conditions
- `GET /api/rating-dimensions` - Get rating categories
- `GET /health` - Health check

## Testing

```bash
# Run all tests
cargo run --bin xtask test

# Manual API testing
./send_request.py health
```

For detailed setup instructions, see [TEST_SETUP.md](TEST_SETUP.md).
