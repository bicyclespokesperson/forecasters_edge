# Forecaster's Edge Backend

Rust API for disc golf course ratings and conditions, built with Axum and PostgreSQL. Hosted at [shuttle.rs](https://console.shuttle.dev/project/proj_01JZW0P9WDWA25ZZMQXS9KB24D/deployments).

## Quick Start

```bash
# Development server (recommended)
shuttle run

# Run tests
cargo run --bin xtask test

# Deploy to production
cargo shuttle deploy
```

## Prerequisites

- **Rust**: Install from https://rustup.rs/
- **Docker**: Required for `shuttle run`

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
