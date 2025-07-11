# Forecaster's Edge Backend

Rust backend API for disc golf course ratings and conditions, built with Axum and PostgreSQL.

## Quick Start

### Local Development (Recommended)

```bash
# Install Docker and start it
# Then run with Shuttle (uses containerized PostgreSQL)
shuttle run
```

### Alternative Local Development

```bash
# Install prerequisites
brew install postgresql  # macOS
brew services start postgresql

# Setup database and run tests
cargo run --bin xtask test

# Start development server with verbose logging
cargo run --bin xtask dev
```

### Production Deployment

```bash
# Deploy to Shuttle
cargo shuttle deploy
```

## Prerequisites

- **Rust**: Install from https://rustup.rs/
- **Docker**: Required for `shuttle run` (recommended)
  - macOS: Download Docker Desktop
  - Ubuntu: `sudo apt install docker.io`
  - Windows: Download Docker Desktop
- **PostgreSQL**: Only required for alternative development with xtask
  - macOS: `brew install postgresql && brew services start postgresql`
  - Ubuntu: `sudo apt install postgresql postgresql-contrib`
  - Windows: Download from https://postgresql.org

## Development Tasks

Use the built-in task runner for common development operations:

```bash
# Setup PostgreSQL test database
cargo run --bin xtask setup-db

# Run all tests with automatic database setup
cargo run --bin xtask test

# Run tests in parallel (faster but may have race conditions)
cargo run --bin xtask test-parallel

# Start development server with database
cargo run --bin xtask dev

# Clean and reset test database
cargo run --bin xtask clean-db

# Show available commands
cargo run --bin xtask help
```

## API Endpoints

### Course Data
- `GET /api/courses/{id}/data` - Get ratings and conditions for a course
- `GET /api/courses/bulk?ids=1,2,3` - Get data for multiple courses
- `POST /api/courses/{id}/submit` - Submit ratings and/or conditions

### Metadata
- `GET /api/rating-dimensions` - Get available rating categories
- `GET /health` - Health check

### Example Request

```bash
# Submit combined rating and conditions
curl -X POST http://localhost:3000/api/courses/123/submit \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "player123",
    "ratings": {"difficulty": 4, "quality": 5},
    "conditions_rating": 3,
    "conditions_description": "muddy after rain"
  }'
```

## Environment Variables

### Local Development
- `DATABASE_URL`: PostgreSQL connection (auto-detected for tests)

### Production (Shuttle)
- Uses Shuttle's managed PostgreSQL database
- Secrets managed via `Secrets.toml`

## Testing

### Automated Testing
```bash
# All tests (recommended)
cargo run --bin xtask test

# Unit tests only
cargo test --lib

# Integration tests only  
cargo test --test integration_tests
```

### Manual API Testing
```bash
# Start server (recommended)
shuttle run

# Or alternative approach
cargo run --bin xtask dev

# Test with Python script
./send_request.py health
./send_request.py rating-dimensions
./send_request.py submit-combined
```

## Database

- **Local (shuttle run)**: Containerized PostgreSQL managed by Shuttle
- **Local (xtask)**: Local PostgreSQL with automatic test database setup
- **Production**: Shuttle-managed PostgreSQL
- **Migrations**: Handled automatically by sqlx
- **Test isolation**: Each test gets fresh database state

## Project Structure

```
src/
├── main.rs          # Shuttle runtime integration
├── lib.rs           # API routes and handlers  
├── database.rs      # Database operations
├── models.rs        # Data structures
└── bin/xtask.rs     # Development task runner

tests/
├── integration_tests.rs  # API endpoint tests
└── test_helpers.rs       # Database setup utilities
```

## Deployment

### Shuttle (Recommended)
```bash
# Login to Shuttle
cargo shuttle login

# Deploy
cargo shuttle deploy

# View logs
cargo shuttle logs
```

### Manual Deployment
1. Set up PostgreSQL database
2. Set `DATABASE_URL` environment variable
3. Run migrations: `cargo run`
4. Start server: `cargo run -- -v`

## Troubleshooting

### PostgreSQL Connection Issues
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL  
brew services start postgresql  # macOS
sudo systemctl start postgresql  # Linux

# Reset test database
cargo run --bin xtask clean-db
```

### Build Issues
```bash
# Update dependencies
cargo update

# Clean and rebuild
cargo clean && cargo build
```

For more detailed setup instructions, see [TEST_SETUP.md](TEST_SETUP.md).
