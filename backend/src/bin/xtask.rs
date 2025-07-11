use std::env;
use std::process::{Command, exit};

fn main() {
    let args: Vec<String> = env::args().collect();
    
    if args.len() < 2 {
        print_help();
        return;
    }
    
    match args[1].as_str() {
        "setup-db" => setup_db(),
        "clean-db" => clean_db(),
        "test" => run_tests(false),
        "test-parallel" => run_tests(true),
        "dev" => dev_server(),
        "help" | "--help" | "-h" => print_help(),
        _ => {
            eprintln!("Unknown command: {}", args[1]);
            print_help();
            exit(1);
        }
    }
}

fn print_help() {
    println!("Forecasters Edge Backend - Development Tasks");
    println!();
    println!("Usage: cargo run --bin xtask <COMMAND>");
    println!();
    println!("Commands:");
    println!("  setup-db      Setup PostgreSQL test database");
    println!("  clean-db      Clean and reset test database");
    println!("  test          Run tests (sequential)");
    println!("  test-parallel Run tests (parallel)");
    println!("  dev           Start development server");
    println!("  help          Show this help");
}

fn setup_db() {
    println!("🔧 Setting up test database...");
    
    // Check if PostgreSQL is running
    let pg_check = Command::new("pg_isready").output();
    if pg_check.is_err() || !pg_check.unwrap().status.success() {
        eprintln!("❌ PostgreSQL is not running. Please start PostgreSQL first:");
        eprintln!("   macOS: brew services start postgresql");
        eprintln!("   Linux: sudo systemctl start postgresql");
        exit(1);
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
        eprintln!("❌ Database setup failed: {}", String::from_utf8_lossy(&output.stderr));
        exit(1);
    }

    println!("✅ Test database ready");
}

fn clean_db() {
    println!("🧹 Cleaning test database...");
    
    // Drop database
    let _ = Command::new("psql")
        .args(&["postgres", "-c", "DROP DATABASE IF EXISTS forecasters_edge_test"])
        .output();
    
    // Recreate database
    let output1 = Command::new("psql")
        .args(&["postgres", "-c", "CREATE DATABASE forecasters_edge_test"])
        .output()
        .expect("Failed to run psql");
    
    // Grant privileges
    let output2 = Command::new("psql")
        .args(&["postgres", "-c", "GRANT ALL PRIVILEGES ON DATABASE forecasters_edge_test TO test_user"])
        .output()
        .expect("Failed to run psql");
    
    if !output1.status.success() || !output2.status.success() {
        eprintln!("❌ Database cleanup failed");
        if !output1.status.success() {
            eprintln!("Create DB error: {}", String::from_utf8_lossy(&output1.stderr));
        }
        if !output2.status.success() {
            eprintln!("Grant privileges error: {}", String::from_utf8_lossy(&output2.stderr));
        }
        exit(1);
    }
    
    println!("✅ Database cleaned and recreated");
}

fn run_tests(parallel: bool) {
    setup_db();
    
    println!("🧪 Running tests...");
    
    let mut cmd = Command::new("cargo");
    cmd.args(&["test"]);
    
    if !parallel {
        cmd.args(&["--", "--test-threads=1"]);
    }
    
    let status = cmd.status().expect("Failed to run cargo test");
    
    if !status.success() {
        eprintln!("❌ Tests failed");
        exit(1);
    }
    
    println!("✅ All tests passed");
}

fn dev_server() {
    setup_db();
    
    println!("🚀 Starting development server...");
    
    let status = Command::new("cargo")
        .args(&["run", "--bin", "forecasters-edge-backend", "--", "-v"])
        .status()
        .expect("Failed to start server");
    
    if !status.success() {
        eprintln!("❌ Server failed to start");
        exit(1);
    }
}