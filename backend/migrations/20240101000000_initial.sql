-- Initial database schema

-- Flexible rating dimensions table
CREATE TABLE rating_dimensions (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  min_value INTEGER DEFAULT 1,
  max_value INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Course ratings with dimensions
CREATE TABLE course_ratings (
  id INTEGER PRIMARY KEY,
  course_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  dimension_id INTEGER NOT NULL,
  rating INTEGER NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dimension_id) REFERENCES rating_dimensions(id)
);

-- Individual condition reports
CREATE TABLE course_conditions (
  id INTEGER PRIMARY KEY,
  course_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  rating INTEGER NOT NULL,         -- 1-5 scale (5 = best conditions)
  description TEXT NOT NULL,       -- "closed", "great conditions", "muddy", etc.
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_course_ratings_course_id ON course_ratings(course_id);
CREATE INDEX idx_course_ratings_dimension_id ON course_ratings(dimension_id);
CREATE INDEX idx_course_conditions_course_id ON course_conditions(course_id);
CREATE INDEX idx_course_conditions_timestamp ON course_conditions(timestamp);