use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct UserCourseData {
    pub ratings: HashMap<String, f64>,
    pub conditions: Option<CourseCondition>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CourseCondition {
    pub rating: i32,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RatingDimension {
    pub id: i32,
    pub name: String,
    pub description: Option<String>,
    pub min_value: i32,
    pub max_value: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RatingSubmission {
    pub user_id: String,
    pub ratings: HashMap<String, i32>, // dimension_name -> rating
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConditionSubmission {
    pub user_id: String,
    pub rating: i32,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CombinedSubmission {
    pub user_id: String,
    pub ratings: Option<HashMap<String, i32>>, // dimension_name -> rating (1-5)
    pub conditions_rating: Option<i32>,        // 1-5 scale (5 = best conditions)
    pub conditions_description: Option<String>, // description of conditions
}