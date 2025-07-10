use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use serde::Deserialize;
use sqlx::SqlitePool;
use std::collections::HashMap;
use tower_http::cors::CorsLayer;

pub mod models;
pub mod database;
pub mod time_weights;

use models::*;
use database::*;
use time_weights::*;

#[derive(Clone)]
pub struct AppState {
    pub db: SqlitePool,
    pub time_config: TimeWeightConfig,
}

pub fn create_app(state: AppState) -> Router {
    Router::new()
        .route("/api/courses/bulk", get(get_bulk_course_data))
        .route("/api/courses/:id/data", get(get_course_data))
        .route("/api/courses/:id/ratings", post(submit_rating))
        .route("/api/courses/:id/conditions", post(submit_condition))
        .route("/api/rating-dimensions", get(get_rating_dimensions))
        .route("/health", get(health_check))
        .layer(CorsLayer::permissive())
        .with_state(state)
}

async fn health_check() -> &'static str {
    "OK"
}


async fn get_course_data(
    Path(course_id): Path<i32>,
    State(state): State<AppState>,
) -> Result<Json<UserCourseData>, StatusCode> {
    let ratings = get_course_ratings(&state.db, course_id).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let conditions = get_course_conditions(&state.db, course_id, &state.time_config).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(UserCourseData { ratings, conditions }))
}

#[derive(Deserialize)]
struct BulkQuery {
    ids: String,
}

async fn get_bulk_course_data(
    Query(query): Query<BulkQuery>,
    State(state): State<AppState>,
) -> Result<Json<HashMap<i32, UserCourseData>>, StatusCode> {
    let course_ids: Vec<i32> = query.ids
        .split(',')
        .filter_map(|s| s.trim().parse().ok())
        .collect();

    let mut result = HashMap::new();
    
    for course_id in course_ids {
        let ratings = get_course_ratings(&state.db, course_id).await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
        let conditions = get_course_conditions(&state.db, course_id, &state.time_config).await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        result.insert(course_id, UserCourseData { ratings, conditions });
    }

    Ok(Json(result))
}

async fn submit_rating(
    Path(course_id): Path<i32>,
    State(state): State<AppState>,
    Json(rating): Json<RatingSubmission>,
) -> Result<StatusCode, StatusCode> {
    insert_rating(&state.db, course_id, rating).await
        .map_err(|e| {
            eprintln!("Error inserting rating: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;
    
    Ok(StatusCode::CREATED)
}

async fn submit_condition(
    Path(course_id): Path<i32>,
    State(state): State<AppState>,
    Json(condition): Json<ConditionSubmission>,
) -> Result<StatusCode, StatusCode> {
    insert_condition(&state.db, course_id, condition).await
        .map_err(|e| {
            eprintln!("Error inserting condition: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;
    
    Ok(StatusCode::CREATED)
}

async fn get_rating_dimensions(
    State(state): State<AppState>,
) -> Result<Json<Vec<RatingDimension>>, StatusCode> {
    let dimensions = get_all_rating_dimensions(&state.db).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    Ok(Json(dimensions))
}