use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};

use serde::Deserialize;
use serde_json;
use sqlx::PgPool;
use std::collections::HashMap;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

pub mod database;
pub mod models;
pub mod time_weights;

use database::*;
use models::*;
use time_weights::*;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub time_config: TimeWeightConfig,
    pub verbose: bool,
}

pub fn create_app(state: AppState, verbose: bool) -> Router {
    let mut app_state = state;
    app_state.verbose = verbose;

    let mut router = Router::new()
        .route("/api/courses/bulk", get(get_bulk_course_data))
        .route("/api/courses/{id}/data", get(get_course_data))
        .route("/api/courses/{id}/submit", post(submit_combined))
        .route("/api/rating-dimensions", get(get_rating_dimensions))
        .route("/api/admin/tables", get(get_admin_tables))
        .route("/api/admin/rating-dimensions", get(get_admin_rating_dimensions))
        .route("/api/admin/course-ratings", get(get_admin_course_ratings))
        .route("/api/admin/course-conditions", get(get_admin_course_conditions))
        .route("/health", get(health_check))
        .layer(CorsLayer::permissive())
        .with_state(app_state);

    if verbose {
        router = router.layer(TraceLayer::new_for_http());
    }

    router
}

async fn health_check() -> &'static str {
    "OK"
}

async fn get_course_data(
    Path(course_id): Path<i32>,
    State(state): State<AppState>,
) -> Result<Json<UserCourseData>, StatusCode> {
    let ratings = get_course_ratings(&state.db, course_id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let conditions = get_course_conditions(&state.db, course_id, &state.time_config)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response_data = UserCourseData {
        ratings,
        conditions,
    };

    if state.verbose {
        let json_str = serde_json::to_string_pretty(&response_data)
            .unwrap_or_else(|_| "Failed to serialize".to_string());
        println!("📤 GET /api/courses/{}/data -> {}", course_id, json_str);
    }

    Ok(Json(response_data))
}

#[derive(Deserialize)]
struct BulkQuery {
    ids: String,
}

fn parse_ids(ids_str: &str) -> Vec<i32> {
    ids_str
        .split(',')
        .filter_map(|s| s.trim().parse().ok())
        .collect()
}

async fn get_bulk_course_data(
    Query(query): Query<BulkQuery>,
    State(state): State<AppState>,
) -> Result<Json<HashMap<i32, UserCourseData>>, StatusCode> {
    let course_ids = parse_ids(&query.ids);

    let mut result = HashMap::new();

    for course_id in course_ids {
        let ratings = get_course_ratings(&state.db, course_id)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        let conditions = get_course_conditions(&state.db, course_id, &state.time_config)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        result.insert(
            course_id,
            UserCourseData {
                ratings,
                conditions,
            },
        );
    }

    if state.verbose {
        let json_str = serde_json::to_string_pretty(&result)
            .unwrap_or_else(|_| "Failed to serialize".to_string());
        println!("📤 GET /api/courses/bulk?ids={} -> {}", query.ids, json_str);
    }

    Ok(Json(result))
}

async fn submit_combined(
    Path(course_id): Path<i32>,
    State(state): State<AppState>,
    Json(submission): Json<CombinedSubmission>,
) -> Result<StatusCode, StatusCode> {
    if state.verbose {
        let json_str = serde_json::to_string_pretty(&submission)
            .unwrap_or_else(|_| "Failed to serialize".to_string());
        println!("📥 POST /api/courses/{}/submit <- {}", course_id, json_str);
    }

    // Submit ratings if provided
    if let Some(ratings) = submission.ratings {
        if !ratings.is_empty() {
            let rating_submission = RatingSubmission {
                user_id: submission.user_id.clone(),
                ratings,
            };
            insert_rating(&state.db, course_id, rating_submission)
                .await
                .map_err(|e| {
                    eprintln!("Error inserting ratings: {:?}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                })?;
        }
    }

    // Submit conditions if provided
    if let Some(rating) = submission.conditions_rating {
        // Validate description length (max 128 characters)
        if let Some(ref desc) = submission.conditions_description {
            if desc.len() > 128 {
                return Err(StatusCode::BAD_REQUEST);
            }
        }
        
        let condition_submission = ConditionSubmission {
            user_id: submission.user_id.clone(),
            rating,
            description: submission.conditions_description,
        };
        insert_condition(&state.db, course_id, condition_submission)
            .await
            .map_err(|e| {
                eprintln!("Error inserting condition: {:?}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;
    }

    if state.verbose {
        println!("📤 POST /api/courses/{}/submit -> 201 CREATED", course_id);
    }

    Ok(StatusCode::CREATED)
}

async fn get_rating_dimensions(
    State(state): State<AppState>,
) -> Result<Json<Vec<RatingDimension>>, StatusCode> {
    let dimensions = get_all_rating_dimensions(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if state.verbose {
        let json_str = serde_json::to_string_pretty(&dimensions)
            .unwrap_or_else(|_| "Failed to serialize".to_string());
        println!("📤 GET /api/rating-dimensions -> {}", json_str);
    }

    Ok(Json(dimensions))
}

async fn get_admin_tables(
    State(state): State<AppState>,
) -> Result<Json<DatabaseOverview>, StatusCode> {
    let overview = get_database_overview(&state.db)
        .await
        .map_err(|e| {
            eprintln!("Error in get_admin_tables: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    if state.verbose {
        let json_str = serde_json::to_string_pretty(&overview)
            .unwrap_or_else(|_| "Failed to serialize".to_string());
        println!("📤 GET /api/admin/tables -> {}", json_str);
    }

    Ok(Json(overview))
}

async fn get_admin_rating_dimensions(
    Query(pagination): Query<PaginationParams>,
    State(state): State<AppState>,
) -> Result<Json<PaginatedResponse<RatingDimension>>, StatusCode> {
    let page = pagination.page.unwrap_or(1).max(1);
    let limit = pagination.limit.unwrap_or(50).clamp(1, 500);

    let response = get_all_rating_dimensions_paginated(&state.db, page, limit)
        .await
        .map_err(|e| {
            eprintln!("Error in get_admin_rating_dimensions: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    if state.verbose {
        let json_str = serde_json::to_string_pretty(&response)
            .unwrap_or_else(|_| "Failed to serialize".to_string());
        println!("📤 GET /api/admin/rating-dimensions?page={}&limit={} -> {}", page, limit, json_str);
    }

    Ok(Json(response))
}

async fn get_admin_course_ratings(
    Query(pagination): Query<PaginationParams>,
    State(state): State<AppState>,
) -> Result<Json<PaginatedResponse<CourseRatingRow>>, StatusCode> {
    let page = pagination.page.unwrap_or(1).max(1);
    let limit = pagination.limit.unwrap_or(50).clamp(1, 500);

    let response = get_all_course_ratings_paginated(&state.db, page, limit)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if state.verbose {
        let json_str = serde_json::to_string_pretty(&response)
            .unwrap_or_else(|_| "Failed to serialize".to_string());
        println!("📤 GET /api/admin/course-ratings?page={}&limit={} -> {}", page, limit, json_str);
    }

    Ok(Json(response))
}

async fn get_admin_course_conditions(
    Query(pagination): Query<PaginationParams>,
    State(state): State<AppState>,
) -> Result<Json<PaginatedResponse<CourseConditionRow>>, StatusCode> {
    let page = pagination.page.unwrap_or(1).max(1);
    let limit = pagination.limit.unwrap_or(50).clamp(1, 500);

    let response = get_all_course_conditions_paginated(&state.db, page, limit)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if state.verbose {
        let json_str = serde_json::to_string_pretty(&response)
            .unwrap_or_else(|_| "Failed to serialize".to_string());
        println!("📤 GET /api/admin/course-conditions?page={}&limit={} -> {}", page, limit, json_str);
    }

    Ok(Json(response))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_ids() {
        assert_eq!(parse_ids("1,2,3"), vec![1, 2, 3]);
        assert_eq!(parse_ids(" 1, 2 ,3 "), vec![1, 2, 3]);
        assert_eq!(parse_ids("1,  ,3"), vec![1, 3]);
        assert_eq!(parse_ids("1,2,a,3"), vec![1, 2, 3]);
        assert_eq!(parse_ids(""), Vec::<i32>::new());
        assert_eq!(parse_ids("  "), Vec::<i32>::new());
    }
}
