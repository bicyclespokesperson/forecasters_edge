use std::sync::Once;
use sqlx::PgPool;
use std::process::Command;

static INIT: Once = Once::new();

pub async fn setup_test_db() -> PgPool {
    // Ensure database setup runs only once across all tests
    INIT.call_once(|| {
        setup_database_once();
    });

    // Try to detect and use Shuttle's containerized PostgreSQL first
    if let Some(shuttle_url) = detect_shuttle_database().await {
        println!("✅ Using Shuttle containerized PostgreSQL for tests");
        return PgPool::connect(&shuttle_url).await.expect("Failed to connect to Shuttle database");
    }

    // Fall back to local PostgreSQL setup
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://test_user:test_password@localhost:5432/forecasters_edge_test".to_string());
    
    PgPool::connect(&database_url).await.expect("Failed to connect to test database")
}

fn setup_database_once() {
    // Check if PostgreSQL is running
    let pg_check = Command::new("pg_isready").output();
    if pg_check.is_err() || !pg_check.unwrap().status.success() {
        panic!("❌ PostgreSQL is not running. Please start PostgreSQL first:\n   macOS: brew services start postgresql\n   Linux: sudo systemctl start postgresql");
    }

    // Create test database (ignore if exists)
    let _ = Command::new("psql")
        .args(&["postgres", "-c", "CREATE DATABASE forecasters_edge_test"])
        .output();

    // Create test user (ignore if exists)  
    let _ = Command::new("psql")
        .args(&["postgres", "-c", "CREATE USER test_user WITH PASSWORD 'test_password'"])
        .output();

    // Grant privileges
    let output = Command::new("psql")
        .args(&["postgres", "-c", "GRANT ALL PRIVILEGES ON DATABASE forecasters_edge_test TO test_user"])
        .output()
        .expect("Failed to run psql");

    if !output.status.success() {
        panic!("Database setup failed: {}", String::from_utf8_lossy(&output.stderr));
    }

    println!("✅ Test database initialized");
}

async fn detect_shuttle_database() -> Option<String> {
    // Check if there's a Shuttle PostgreSQL container running
    let output = Command::new("docker")
        .args(&["ps", "--filter", "name=shuttle_forecasters-edge-backend_shared_postgres", "--format", "{{.Ports}}"])
        .output()
        .ok()?;

    let ports_output = String::from_utf8(output.stdout).ok()?;
    if ports_output.trim().is_empty() {
        return None;
    }

    // Extract port from output like "0.0.0.0:24898->5432/tcp"
    if let Some(port_start) = ports_output.find("0.0.0.0:") {
        if let Some(port_end) = ports_output[port_start + 8..].find("->") {
            let port = &ports_output[port_start + 8..port_start + 8 + port_end];
            return Some(format!("postgres://postgres:postgres@localhost:{}/forecasters-edge-backend", port));
        }
    }

    None
}

pub async fn cleanup_test_tables(pool: &PgPool) {
    // Clean up tables for test isolation
    let cleanup_queries = [
        "DROP TABLE IF EXISTS course_conditions CASCADE",
        "DROP TABLE IF EXISTS course_ratings CASCADE", 
        "DROP TABLE IF EXISTS rating_dimensions CASCADE",
    ];
    
    for query in cleanup_queries {
        sqlx::query(query).execute(pool).await.unwrap();
    }
}

pub async fn setup_test_tables(pool: &PgPool) {
    // Create fresh tables for each test
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS rating_dimensions (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            min_value INTEGER DEFAULT 1,
            max_value INTEGER DEFAULT 5,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",
    ).execute(pool).await.unwrap();

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS course_ratings (
            id SERIAL PRIMARY KEY,
            course_id INTEGER NOT NULL,
            user_id TEXT NOT NULL,
            dimension_id INTEGER NOT NULL,
            rating INTEGER NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (dimension_id) REFERENCES rating_dimensions(id)
        )",
    ).execute(pool).await.unwrap();

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS course_conditions (
            id SERIAL PRIMARY KEY,
            course_id INTEGER NOT NULL,
            user_id TEXT NOT NULL,
            rating INTEGER NOT NULL,
            description TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",
    ).execute(pool).await.unwrap();

    // Insert default rating dimensions
    sqlx::query(
        "INSERT INTO rating_dimensions (name, description, min_value, max_value)
         VALUES ('difficulty', 'Course difficulty level', 1, 5),
                ('quality', 'Overall course quality', 1, 5)
         ON CONFLICT (name) DO NOTHING",
    ).execute(pool).await.unwrap();
}