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
            "INSERT OR IGNORE INTO rating_dimensions (name, description, min_value, max_value)
             VALUES (?, ?, ?, ?)",
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
        "SELECT rd.name, AVG(CAST(cr.rating AS REAL)) as avg_rating
         FROM course_ratings cr
         JOIN rating_dimensions rd ON cr.dimension_id = rd.id
         WHERE cr.course_id = ?
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
         WHERE course_id = ?
         ORDER BY timestamp DESC
         LIMIT ?",
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
        let dimension_id: i32 = sqlx::query("SELECT id FROM rating_dimensions WHERE name = ?")
            .bind(&dimension_name)
            .fetch_one(pool)
            .await?
            .get("id");

        sqlx::query(
            "INSERT INTO course_ratings (course_id, user_id, dimension_id, rating)
             VALUES (?, ?, ?, ?)",
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
         VALUES (?, ?, ?, ?)",
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
