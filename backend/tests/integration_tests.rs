use axum_test::TestServer;
use forecasters_edge_backend::{
    create_app, models::*, time_weights::TimeWeightConfig, AppState,
};
use serde_json::json;
use sqlx::SqlitePool;
use std::collections::HashMap;

async fn setup_test_app() -> TestServer {
    // Use in-memory database for tests
    let database_url = "sqlite::memory:";
    
    let pool = SqlitePool::connect(database_url).await.unwrap();
    
    // Run migrations manually since we're not using the setup_database function
    sqlx::query(
        "CREATE TABLE rating_dimensions (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            min_value INTEGER DEFAULT 1,
            max_value INTEGER DEFAULT 5,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )"
    )
    .execute(&pool)
    .await
    .unwrap();

    sqlx::query(
        "CREATE TABLE course_ratings (
            id INTEGER PRIMARY KEY,
            course_id INTEGER NOT NULL,
            user_id TEXT NOT NULL,
            dimension_id INTEGER NOT NULL,
            rating INTEGER NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (dimension_id) REFERENCES rating_dimensions(id)
        )"
    )
    .execute(&pool)
    .await
    .unwrap();

    sqlx::query(
        "CREATE TABLE course_conditions (
            id INTEGER PRIMARY KEY,
            course_id INTEGER NOT NULL,
            user_id TEXT NOT NULL,
            rating INTEGER NOT NULL,
            description TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )"
    )
    .execute(&pool)
    .await
    .unwrap();

    // Insert default rating dimensions
    sqlx::query(
        "INSERT INTO rating_dimensions (name, description, min_value, max_value)
         VALUES ('difficulty', 'Course difficulty level', 1, 5),
                ('quality', 'Overall course quality', 1, 5)"
    )
    .execute(&pool)
    .await
    .unwrap();

    let app_state = AppState {
        db: pool,
        time_config: TimeWeightConfig::default(),
    };

    let app = create_app(app_state);
    TestServer::new(app).unwrap()
}

#[tokio::test]
async fn test_health_check() {
    let server = setup_test_app().await;
    
    let response = server.get("/health").await;
    
    response.assert_status_ok();
    response.assert_text("OK");
}

#[tokio::test]
async fn test_get_rating_dimensions() {
    let server = setup_test_app().await;
    
    let response = server.get("/api/rating-dimensions").await;
    
    response.assert_status_ok();
    let dimensions: Vec<RatingDimension> = response.json();
    assert_eq!(dimensions.len(), 2);
    assert_eq!(dimensions[0].name, "difficulty");
    assert_eq!(dimensions[1].name, "quality");
}

#[tokio::test]
async fn test_get_course_data_empty() {
    let server = setup_test_app().await;
    
    let response = server.get("/api/courses/123/data").await;
    
    response.assert_status_ok();
    let data: UserCourseData = response.json();
    assert!(data.ratings.is_empty());
    assert!(data.conditions.is_none());
}

#[tokio::test]
async fn test_submit_and_get_rating() {
    let server = setup_test_app().await;
    
    // Submit a rating
    let rating_submission = json!({
        "user_id": "test_user_123",
        "ratings": {
            "difficulty": 4,
            "quality": 5
        }
    });
    
    let response = server
        .post("/api/courses/123/ratings")
        .json(&rating_submission)
        .await;
    
    response.assert_status(axum::http::StatusCode::CREATED);
    
    // Get the course data
    let response = server.get("/api/courses/123/data").await;
    
    response.assert_status_ok();
    let data: UserCourseData = response.json();
    assert_eq!(data.ratings.len(), 2);
    assert_eq!(data.ratings["difficulty"], 4.0);
    assert_eq!(data.ratings["quality"], 5.0);
    assert!(data.conditions.is_none());
}

#[tokio::test]
async fn test_submit_and_get_condition() {
    let server = setup_test_app().await;
    
    // Submit a condition report
    let condition_submission = json!({
        "user_id": "test_user_456",
        "rating": 3,
        "description": "muddy after rain"
    });
    
    let response = server
        .post("/api/courses/456/conditions")
        .json(&condition_submission)
        .await;
    
    response.assert_status(axum::http::StatusCode::CREATED);
    
    // Get the course data
    let response = server.get("/api/courses/456/data").await;
    
    response.assert_status_ok();
    let data: UserCourseData = response.json();
    assert!(data.ratings.is_empty());
    assert!(data.conditions.is_some());
    
    let conditions = data.conditions.unwrap();
    assert_eq!(conditions.rating, 3);
    assert_eq!(conditions.description, "muddy after rain");
}


#[tokio::test]
async fn test_bulk_course_data() {
    let server = setup_test_app().await;
    
    // Submit data for multiple courses
    let rating1 = json!({
        "user_id": "user1",
        "ratings": { "difficulty": 3 }
    });
    
    let rating2 = json!({
        "user_id": "user2", 
        "ratings": { "quality": 4 }
    });
    
    server.post("/api/courses/101/ratings").json(&rating1).await;
    server.post("/api/courses/102/ratings").json(&rating2).await;
    
    // Get bulk data
    let response = server
        .get("/api/courses/bulk")
        .add_query_param("ids", "101,102,103")
        .await;
    
    response.assert_status_ok();
    let data: HashMap<i32, UserCourseData> = response.json();
    
    assert_eq!(data.len(), 3);
    assert_eq!(data[&101].ratings["difficulty"], 3.0);
    assert_eq!(data[&102].ratings["quality"], 4.0);
    assert!(data[&103].ratings.is_empty()); // No data for course 103
}

#[tokio::test]
async fn test_multiple_ratings_average() {
    let server = setup_test_app().await;
    
    // Submit multiple ratings for the same course
    let rating1 = json!({
        "user_id": "user1",
        "ratings": { "difficulty": 2 }
    });
    
    let rating2 = json!({
        "user_id": "user2",
        "ratings": { "difficulty": 4 }
    });
    
    server.post("/api/courses/200/ratings").json(&rating1).await;
    server.post("/api/courses/200/ratings").json(&rating2).await;
    
    // Get the averaged result
    let response = server.get("/api/courses/200/data").await;
    
    response.assert_status_ok();
    let data: UserCourseData = response.json();
    assert_eq!(data.ratings["difficulty"], 3.0); // Average of 2 and 4
}

#[tokio::test]
async fn test_invalid_course_id() {
    let server = setup_test_app().await;
    
    let response = server.get("/api/courses/not_a_number/data").await;
    
    response.assert_status_bad_request();
}

#[tokio::test]
async fn test_malformed_rating_submission() {
    let server = setup_test_app().await;
    
    let bad_rating = json!({
        "user_id": "test_user",
        "ratings": {
            "nonexistent_dimension": 5
        }
    });
    
    let response = server
        .post("/api/courses/123/ratings")
        .json(&bad_rating)
        .await;
    
    response.assert_status(axum::http::StatusCode::INTERNAL_SERVER_ERROR);
}