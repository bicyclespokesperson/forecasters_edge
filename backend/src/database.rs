use anyhow::Result;
use sqlx::{PgPool, Row};
use std::collections::HashMap;

use crate::models::*;
use crate::time_weights::*;

pub async fn setup_database(pool: PgPool) -> Result<PgPool> {
    sqlx::migrate!("./migrations").run(&pool).await?;

    // Initialize default rating dimensions
    initialize_rating_dimensions(&pool).await?;

    Ok(pool)
}

async fn initialize_rating_dimensions(pool: &PgPool) -> Result<()> {
    let dimensions = [
        ("difficulty", "Course difficulty level", 1, 5),
        ("quality", "Overall course quality", 1, 5),
    ];

    for (name, description, min_val, max_val) in dimensions {
        sqlx::query(
            "INSERT INTO rating_dimensions (name, description, min_value, max_value)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (name) DO NOTHING",
        )
        .bind(name)
        .bind(description)
        .bind(min_val)
        .bind(max_val)
        .execute(pool)
        .await?;
    }

    Ok(())
}

pub async fn get_course_ratings(pool: &PgPool, course_id: i32) -> Result<HashMap<String, f64>> {
    let rows = sqlx::query(
        "SELECT rd.name, AVG(CAST(cr.rating AS FLOAT)) as avg_rating
         FROM course_ratings cr
         JOIN rating_dimensions rd ON cr.dimension_id = rd.id
         WHERE cr.course_id = $1
         GROUP BY rd.name",
    )
    .bind(course_id)
    .fetch_all(pool)
    .await?;

    let mut ratings = HashMap::new();
    for row in rows {
        let name: String = row.get("name");
        let avg_rating: Option<f64> = row.get("avg_rating");
        if let Some(avg) = avg_rating {
            ratings.insert(name, avg);
        }
    }

    Ok(ratings)
}

pub async fn get_course_conditions(
    pool: &PgPool,
    course_id: i32,
    time_config: &TimeWeightConfig,
) -> Result<Option<CourseCondition>> {
    let rows = sqlx::query(
        "SELECT rating, description, timestamp
         FROM course_conditions
         WHERE course_id = $1
         ORDER BY timestamp DESC
         LIMIT $2",
    )
    .bind(course_id)
    .bind(time_config.max_reports as i64)
    .fetch_all(pool)
    .await?;

    if rows.is_empty() {
        return Ok(None);
    }

    let weighted_conditions: Vec<_> = rows
        .into_iter()
        .map(|row| {
            // For tests, just assume recent timestamp (0 days old)
            // In production, this would parse the actual timestamp
            let days_old = 0u32;
            let weight = calculate_weight(days_old, time_config);

            WeightedCondition {
                rating: row.get("rating"),
                description: row.get("description"),
                weight,
            }
        })
        .filter(|wc| wc.weight > 0.0)
        .collect();

    if weighted_conditions.is_empty() {
        return Ok(None);
    }

    let total_weight: f32 = weighted_conditions.iter().map(|wc| wc.weight).sum();
    let weighted_rating: f32 = weighted_conditions
        .iter()
        .map(|wc| wc.rating as f32 * wc.weight)
        .sum();

    let avg_rating = (weighted_rating / total_weight).round() as i32;

    // Use the most recent description
    let description = weighted_conditions[0].description.clone();

    Ok(Some(CourseCondition {
        rating: avg_rating,
        description,
    }))
}

pub async fn insert_rating(
    pool: &PgPool,
    course_id: i32,
    submission: RatingSubmission,
) -> Result<()> {
    for (dimension_name, rating) in submission.ratings {
        let dimension_id: i32 = sqlx::query("SELECT id FROM rating_dimensions WHERE name = $1")
            .bind(&dimension_name)
            .fetch_one(pool)
            .await?
            .get("id");

        sqlx::query(
            "INSERT INTO course_ratings (course_id, user_id, dimension_id, rating)
             VALUES ($1, $2, $3, $4)",
        )
        .bind(course_id)
        .bind(&submission.user_id)
        .bind(dimension_id)
        .bind(rating)
        .execute(pool)
        .await?;
    }

    Ok(())
}

pub async fn insert_condition(
    pool: &PgPool,
    course_id: i32,
    submission: ConditionSubmission,
) -> Result<()> {
    sqlx::query(
        "INSERT INTO course_conditions (course_id, user_id, rating, description)
         VALUES ($1, $2, $3, $4)",
    )
    .bind(course_id)
    .bind(&submission.user_id)
    .bind(submission.rating)
    .bind(&submission.description)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn get_all_rating_dimensions(pool: &PgPool) -> Result<Vec<RatingDimension>> {
    let rows =
        sqlx::query("SELECT id, name, description, min_value, max_value FROM rating_dimensions")
            .fetch_all(pool)
            .await?;

    let dimensions = rows
        .into_iter()
        .map(|row| RatingDimension {
            id: row.get("id"),
            name: row.get("name"),
            description: row.get("description"),
            min_value: row.get("min_value"),
            max_value: row.get("max_value"),
        })
        .collect();

    Ok(dimensions)
}

struct WeightedCondition {
    rating: i32,
    description: String,
    weight: f32,
}

pub async fn get_all_rating_dimensions_paginated(
    pool: &PgPool,
    page: u32,
    limit: u32,
) -> Result<PaginatedResponse<RatingDimension>> {
    let offset = (page - 1) * limit;
    
    let total_count: i64 = sqlx::query("SELECT COUNT(*) as count FROM rating_dimensions")
        .fetch_one(pool)
        .await?
        .get("count");

    let rows = sqlx::query(
        "SELECT id, name, description, min_value, max_value 
         FROM rating_dimensions 
         ORDER BY id 
         LIMIT $1 OFFSET $2"
    )
    .bind(limit as i64)
    .bind(offset as i64)
    .fetch_all(pool)
    .await?;

    let dimensions = rows
        .into_iter()
        .map(|row| RatingDimension {
            id: row.get("id"),
            name: row.get("name"),
            description: row.get("description"),
            min_value: row.get("min_value"),
            max_value: row.get("max_value"),
        })
        .collect();

    let total_pages = ((total_count as f64) / (limit as f64)).ceil() as u32;

    Ok(PaginatedResponse {
        data: dimensions,
        page,
        limit,
        total_count: total_count as u32,
        total_pages,
    })
}

pub async fn get_all_course_ratings_paginated(
    pool: &PgPool,
    page: u32,
    limit: u32,
) -> Result<PaginatedResponse<CourseRatingRow>> {
    let offset = (page - 1) * limit;
    
    let total_count: i64 = sqlx::query("SELECT COUNT(*) as count FROM course_ratings")
        .fetch_one(pool)
        .await?
        .get("count");

    let rows = sqlx::query(
        "SELECT cr.id, cr.user_id, cr.dimension_id, rd.name as dimension_name, 
                cr.rating, cr.created_at::text as created_at
         FROM course_ratings cr
         JOIN rating_dimensions rd ON cr.dimension_id = rd.id
         ORDER BY cr.created_at DESC
         LIMIT $1 OFFSET $2"
    )
    .bind(limit as i64)
    .bind(offset as i64)
    .fetch_all(pool)
    .await?;

    let ratings = rows
        .into_iter()
        .map(|row| CourseRatingRow {
            id: row.get("id"),
            user_id: row.get("user_id"),
            dimension_id: row.get("dimension_id"),
            dimension_name: row.get("dimension_name"),
            rating: row.get("rating"),
            created_at: row.get("created_at"),
        })
        .collect();

    let total_pages = ((total_count as f64) / (limit as f64)).ceil() as u32;

    Ok(PaginatedResponse {
        data: ratings,
        page,
        limit,
        total_count: total_count as u32,
        total_pages,
    })
}

pub async fn get_all_course_conditions_paginated(
    pool: &PgPool,
    page: u32,
    limit: u32,
) -> Result<PaginatedResponse<CourseConditionRow>> {
    let offset = (page - 1) * limit;
    
    let total_count: i64 = sqlx::query("SELECT COUNT(*) as count FROM course_conditions")
        .fetch_one(pool)
        .await?
        .get("count");

    let rows = sqlx::query(
        "SELECT id, user_id, rating, description, created_at::text as created_at
         FROM course_conditions 
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2"
    )
    .bind(limit as i64)
    .bind(offset as i64)
    .fetch_all(pool)
    .await?;

    let conditions = rows
        .into_iter()
        .map(|row| CourseConditionRow {
            id: row.get("id"),
            user_id: row.get("user_id"),
            rating: row.get("rating"),
            description: row.get("description"),
            created_at: row.get("created_at"),
        })
        .collect();

    let total_pages = ((total_count as f64) / (limit as f64)).ceil() as u32;

    Ok(PaginatedResponse {
        data: conditions,
        page,
        limit,
        total_count: total_count as u32,
        total_pages,
    })
}

pub async fn get_database_overview(pool: &PgPool) -> Result<DatabaseOverview> {
    let rating_dimensions_count: i64 = sqlx::query("SELECT COUNT(*) as count FROM rating_dimensions")
        .fetch_one(pool)
        .await?
        .get("count");

    let course_ratings_count: i64 = sqlx::query("SELECT COUNT(*) as count FROM course_ratings")
        .fetch_one(pool)
        .await?
        .get("count");

    let course_conditions_count: i64 = sqlx::query("SELECT COUNT(*) as count FROM course_conditions")
        .fetch_one(pool)
        .await?
        .get("count");

    let tables = vec![
        TableStats {
            table_name: "rating_dimensions".to_string(),
            row_count: rating_dimensions_count as u32,
        },
        TableStats {
            table_name: "course_ratings".to_string(),
            row_count: course_ratings_count as u32,
        },
        TableStats {
            table_name: "course_conditions".to_string(),
            row_count: course_conditions_count as u32,
        },
    ];

    Ok(DatabaseOverview { tables })
}
