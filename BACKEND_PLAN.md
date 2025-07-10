# Enhanced Rust Backend with Multi-Dimensional Ratings

## 1. Database Design
- **Flexible rating system**: `rating_dimensions` table for extensible dimensions (difficulty, quality, etc.)
- **Course ratings**: Link courses to users and rating dimensions
- **Condition tracking**: `condition_types` table with time-weighted `course_conditions`
- **Time-weighted averages**: Recent conditions weighted higher (7d=100%, 30d=75%, 90d=50%)

## 2. API Implementation
- Multi-dimensional rating endpoints (GET/POST)
- Condition reporting with time-weighted averages
- Dynamic dimension/condition type management
- User session tracking via IP hashing

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
- Configurable condition types
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
-- Condition types (muddy, overgrown, well-maintained, etc.)
condition_types (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,        -- 'tee_condition', 'fairway_condition', etc.
  description TEXT,
  created_at TIMESTAMP
);

-- Individual condition reports
course_conditions (
  id INTEGER PRIMARY KEY,
  course_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  condition_type_id INTEGER NOT NULL,
  rating INTEGER NOT NULL,   -- 1-5 scale
  notes TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (condition_type_id) REFERENCES condition_types(id)
);
```

## API Endpoints

**Enhanced endpoints:**
- `GET /api/courses/{id}/ratings` - Get all dimensional ratings
- `POST /api/courses/{id}/ratings` - Submit multi-dimensional rating
- `GET /api/courses/{id}/conditions` - Get time-weighted condition averages
- `POST /api/courses/{id}/conditions` - Submit condition report
- `GET /api/rating-dimensions` - Get available rating dimensions
- `GET /api/condition-types` - Get available condition types

## Time-Weighted Averaging Algorithm

**Algorithm for condition averages:**
- Recent reports (< 7 days): 100% weight
- Week-old reports (7-30 days): 75% weight  
- Month-old reports (30-90 days): 50% weight
- Older reports (90+ days): 25% weight

This ensures recent conditions have more impact while still considering historical data.

## Frontend Integration

**Enhanced WeatherScore class:**
```typescript
class WeatherScore {
  weatherScore: number;
  userRatings: {
    difficulty: number;
    quality: number;
    // extensible for future dimensions
  };
  conditions: {
    teeCondition: number;
    fairwayCondition: number;
    // etc.
  };
  combinedScore: number; // Weather + user ratings + conditions
}
```