# Test Setup for PostgreSQL Integration Tests

## Prerequisites

You need PostgreSQL installed locally to run integration tests.

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

## Run Tests (Automatic Setup)

The tests will automatically set up the PostgreSQL test database for you:

```bash
# Setup database and run all tests (recommended)
cargo run --bin xtask test

# Setup database only
cargo run --bin xtask setup-db

# Clean and reset database
cargo run --bin xtask clean-db

# Start development server with database
cargo run --bin xtask dev

# Show available commands
cargo run --bin xtask help
```

## Manual Testing

```bash
# Run all tests (database setup happens automatically)
cargo test -- --test-threads=1

# Run only unit tests
cargo test --lib

# Run only integration tests
cargo test --test integration_tests -- --test-threads=1
```

## Notes

- **Automatic setup**: Database and user creation happens automatically
- **Test isolation**: Each test gets a fresh database state
- **One-time setup**: Database initialization runs only once per test session
- **Production**: Uses Shuttle's managed PostgreSQL (no local setup needed)

## Environment Variables (Optional)

```bash
export DATABASE_URL="postgres://test_user:test_password@localhost:5432/forecasters_edge_test"
```

If not set, tests use the default connection string above.