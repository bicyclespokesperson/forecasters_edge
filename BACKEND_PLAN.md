# Enhanced Rust Backend with Multi-Dimensional Ratings

## 1. Database Design

- **Flexible rating system**: `rating_dimensions` table for extensible dimensions (difficulty, quality, etc.)
- **Course ratings**: Link courses to users and rating dimensions
- **Condition tracking**: Simple rating + description with time-weighted averages
- **Time-weighted averages**: Recent conditions weighted higher

## 2. API Implementation

- Multi-dimensional rating endpoints (GET/POST)
- Condition reporting with time-weighted averages
- Dynamic dimension management

## 3. Backend Architecture

- Axum server with SQLx/SQLite
- Time-weighted averaging algorithms
- CORS configuration for frontend integration
- Railway deployment with health checks

## 4. Frontend Integration

- Enhanced `WeatherScore` class with user ratings + conditions
- Combined scoring: Weather (60%) + User ratings (25%) + Conditions (15%)
- Dynamic UI for rating submission and display
- Real-time condition updates

## 5. Extensibility

- Easy addition of new rating dimensions
- Free-form condition descriptions
- Flexible weighting algorithms
- Admin endpoints for dimension management

This creates a comprehensive rating system that's both user-friendly and easily extensible for future enhancements.

## Database Schema Details

### Multi-dimensional Ratings

```sql
-- Flexible rating dimensions table
rating_dimensions (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,        -- 'difficulty', 'quality', etc.
  description TEXT,
  min_value INTEGER DEFAULT 1,
  max_value INTEGER DEFAULT 5,
  created_at TIMESTAMP
);

-- Course ratings with dimensions
course_ratings (
  id INTEGER PRIMARY KEY,
  course_id TEXT NOT NULL,
  user_id TEXT NOT NULL,     -- IP hash or session ID
  dimension_id INTEGER NOT NULL,
  rating INTEGER NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dimension_id) REFERENCES rating_dimensions(id)
);
```

### Course Conditions with Time-Weighted Averages

```sql
-- Note: Removed condition_types table - using free-form description instead

-- Individual condition reports
course_conditions (
  id INTEGER PRIMARY KEY,
  course_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  rating INTEGER NOT NULL,         -- 1-5 scale (5 = best conditions)
  description TEXT NOT NULL,       -- "closed", "great conditions", "muddy", etc.
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

**Bulk user data retrieval:**

- `GET /api/courses/data?ids=1,2,3,4,5` - Get user data for multiple courses (typically 10)
- `POST /api/courses/data` - Get user data for multiple courses (large lists via request body)

**Single course user data:**

- `GET /api/courses/{id}/data` - Get user data (ratings + conditions) for one course

**Separate submission endpoints:**

- `POST /api/courses/{id}/ratings` - Submit multi-dimensional rating
- `POST /api/courses/{id}/conditions` - Submit condition report

**Individual data endpoints:**

- `GET /api/courses/{id}/ratings` - Get all dimensional ratings only
- `GET /api/courses/{id}/conditions` - Get time-weighted condition averages only

**Metadata endpoints:**

- `GET /api/rating-dimensions` - Get available rating dimensions

## Time-Weighted Averaging Algorithm

**Configurable parameters:**

```rust
struct TimeWeightConfig {
    max_reports: u32,                   // Default: 3 (never use more than 3 reports)
    daily_penalty_rate: f32,            // Default: 0.25 (25% per day - steep decay)
    min_weight: f32,                    // Default: 0.01 (1% minimum)
    max_age_days: u32,                  // Default: 60 days (discard after)
}
```

**Algorithm logic:**

1. **Limit reports**: Use only the 3 most recent reports
2. **Steep daily penalty**: Weight = max(min_weight, 1.0 - (days_old \* daily_penalty_rate))
3. **Hard cutoff**: Discard reports older than max_age_days

**Example weights with defaults:**

- Day 0: 100% weight
- Day 1: 75% weight
- Day 2: 50% weight
- Day 3: 25% weight
- Day 4: 1% weight (minimum)

**Real scenario example:**

- Today's report: 100% → ~99% of final average
- 14-day-old reports: 1% each → ~1% of final average combined

This ensures the most recent report dominates while older reports provide minimal context.

## Frontend Integration

**Phase 1: Backend handles ratings/conditions only**

- Frontend continues to handle weather data and scoring
- Backend provides user ratings and course conditions
- Combined scoring remains on frontend

**Data retrieval approach:**

- Use `GET /api/courses/data?ids=...` for bulk loading user data (typical: 10 courses on map view)
- Use `GET /api/courses/{id}/data` for single course user data
- Separate submission flows for better UX (users can rate without reporting conditions)

**Enhanced WeatherScore class (extensible):**

```typescript
interface UserCourseData {
  userRatings: {
    difficulty: number;
    quality: number;
    // extensible for future dimensions
  };
  conditions: {
    rating: number; // 1-5 scale (5 = best conditions)
    description: string; // "closed", "great conditions", "muddy", etc.
  };
  // Future: weather data could be added here
  // weather?: WeatherData;
}

class WeatherScore {
  weatherScore: number; // Calculated on frontend (current)
  userCourseData?: UserCourseData; // From backend API
  combinedScore: number; // Weather + user ratings + conditions (frontend)

  // Future extensibility hook
  static combineScores(
    weatherScore: number,
    userData?: UserCourseData
  ): number {
    if (!userData) return weatherScore;

    // Current: Weather (60%) + User ratings (25%) + Conditions (15%)
    const userRatingAvg =
      Object.values(userData.userRatings).reduce((a, b) => a + b, 0) /
      Object.keys(userData.userRatings).length;
    const conditionRating = userData.conditions.rating;

    return weatherScore * 0.6 + userRatingAvg * 0.25 + conditionRating * 0.15;
  }
}
```

**Usage patterns:**

- **Map view loading**:
  1. Load courses from CSV (existing)
  2. Bulk API call gets user data for visible courses
  3. Combine weather + user data for display
- **Detail view**: Single course API call for popup user data
- **Rating submission**: Separate form/modal for course ratings
- **Condition reporting**: Separate form/modal for current conditions
- **Real-time updates**: Individual endpoints for incremental updates

**Example implementation:**

```javascript
// Load courses from CSV (existing)
const courses = await loadCourses();

// Get user data for visible courses
const userDataMap = await fetch("/api/courses/data?ids=1,2,3,4,5").then((r) =>
  r.json()
);

// Combine data
courses.forEach((course) => {
  const userData = userDataMap[course.id];
  // Weather score calculated as before (frontend)
  const weatherScore = calcWeatherScore(course, weatherData);

  // Enhanced score with user data
  course.setWeatherScore(
    new WeatherScore(
      weatherScore,
      userData,
      WeatherScore.combineScores(weatherScore, userData)
    )
  );
});
```

**Future extensibility:**

- Backend could eventually serve weather data in the same API response
- Frontend could optionally use backend weather vs. client-side calculation
- Easy migration path without breaking existing functionality
