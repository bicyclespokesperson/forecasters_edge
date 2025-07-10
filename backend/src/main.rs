use forecasters_edge_backend::{create_app, database::setup_database, time_weights::TimeWeightConfig, AppState};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let db = setup_database().await?;
    
    let app_state = AppState {
        db,
        time_config: TimeWeightConfig::default(),
    };

    let app = create_app(app_state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
    println!("🚀 Server running on http://0.0.0.0:3000");
    
    axum::serve(listener, app).await?;
    Ok(())
}