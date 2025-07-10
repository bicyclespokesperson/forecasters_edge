#[derive(Clone)]
pub struct TimeWeightConfig {
    pub max_reports: u32,
    pub daily_penalty_rate: f32,
    pub min_weight: f32,
    pub max_age_days: u32,
}

impl Default for TimeWeightConfig {
    fn default() -> Self {
        Self {
            max_reports: 3,
            daily_penalty_rate: 0.25,
            min_weight: 0.01,
            max_age_days: 60,
        }
    }
}

pub fn calculate_weight(days_old: u32, config: &TimeWeightConfig) -> f32 {
    if days_old > config.max_age_days {
        return 0.0;
    }
    
    let weight = 1.0 - (days_old as f32 * config.daily_penalty_rate);
    weight.max(config.min_weight)
}