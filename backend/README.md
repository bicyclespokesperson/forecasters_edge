# Forecaster's Edge Backend

Rust backend API for handling user ratings and course conditions.

## Setup

1. Install Rust: https://rustup.rs/
2. Install SQLx CLI: `cargo install sqlx-cli`
3. Run the server: `cargo run`

## Environment Variables

- `DATABASE_URL`: SQLite database path (default: `sqlite:./forecasters_edge.db`)
- `PORT`: Server port (default: 3000)

## API Endpoints

- `GET /api/courses/:id/data` - Get user data for a single course
- `GET /api/courses/data?ids=1,2,3` - Get user data for multiple courses
- `POST /api/courses/:id/ratings` - Submit course ratings
- `POST /api/courses/:id/conditions` - Submit course conditions
- `GET /api/rating-dimensions` - Get available rating dimensions
- `GET /health` - Health check

## Development

```bash
# Run with auto-reload
cargo watch -x run

# Run tests
cargo test

# Check formatting
cargo fmt --check

# Run linter
cargo clippy
```