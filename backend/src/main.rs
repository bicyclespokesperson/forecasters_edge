use forecasters_edge_backend::{create_app, database::setup_database, time_weights::TimeWeightConfig, AppState};
use std::env;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();
    
    let verbose = env::args().any(|arg| arg == "-v" || arg == "--verbose");
    
    let db = setup_database().await?;
    
    let app_state = AppState {
        db,
        time_config: TimeWeightConfig::default(),
        verbose: false, // This will be set inside create_app
    };

    let app = create_app(app_state, verbose);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
    if verbose {
        println!("🚀 Server running on http://0.0.0.0:3000 (verbose mode enabled)");
    } else {
        println!("🚀 Server running on http://0.0.0.0:3000");
    }
    
    axum::serve(listener, app).await?;
    Ok(())
}