use forecasters_edge_backend::{
    create_app, database::setup_database, time_weights::TimeWeightConfig, AppState,
};
use sqlx::PgPool;
use std::env;

#[shuttle_runtime::main]

//async fn main() -> Result<(), Box<dyn std::error::Error>> {
async fn main(
    #[shuttle_shared_db::Postgres] pool: PgPool,
    #[shuttle_runtime::Secrets] _secrets: shuttle_runtime::SecretStore,
) -> shuttle_axum::ShuttleAxum {
    dotenvy::dotenv().ok();

    let verbose = env::args().any(|arg| arg == "-v" || arg == "--verbose");

    let db = setup_database(pool).await?;

    let app_state = AppState {
        db,
        time_config: TimeWeightConfig::default(),
        verbose: false, // This will be set inside create_app
    };

    let app = create_app(app_state, verbose);

    Ok(shuttle_axum::AxumService(app))
}
