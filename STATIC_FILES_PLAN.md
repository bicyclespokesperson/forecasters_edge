# Plan to Serve Frontend from Backend

Based on the shuttle_static_files_example and your current project structure, here's a comprehensive plan to serve the frontend from the backend:

## Current State Analysis
- Backend: Axum server with API routes at `/api/*` and PostgreSQL database
- Frontend: TypeScript/HTML app currently deployed to GitHub Pages
- Empty `backend/frontend_dist/` directory exists
- Shuttle static files example shows simple `ServeDir::new("assets")` approach

## Implementation Plan

### 1. Add Static File Dependencies
**File:** `backend/Cargo.toml`
```toml
[dependencies]
# Add to existing dependencies:
tower-http = { version = "0.6", features = ["fs", "cors", "trace"] }
```

### 2. Build Frontend into Backend
**Script:** Create `backend/build_frontend.sh`
```bash
#!/bin/bash
cd ../frontend
npm run build
rm -rf ../backend/frontend_dist/*
cp -r dist/* ../backend/frontend_dist/
```

### 3. Update Backend Router
**File:** `backend/src/lib.rs`
```rust
use tower_http::services::{ServeDir, ServeFile};

pub fn create_app(state: AppState, verbose: bool) -> Router {
    // ... existing code ...
    
    let mut router = Router::new()
        // API routes first (highest priority)
        .route("/api/courses/bulk", get(get_bulk_course_data))
        .route("/api/courses/{id}/data", get(get_course_data))
        .route("/api/courses/{id}/submit", post(submit_combined))
        .route("/api/rating-dimensions", get(get_rating_dimensions))
        .route("/api/admin/tables", get(get_admin_tables))
        .route("/api/admin/rating-dimensions", get(get_admin_rating_dimensions))
        .route("/api/admin/course-ratings", get(get_admin_course_ratings))
        .route("/api/admin/course-conditions", get(get_admin_course_conditions))
        .route("/health", get(health_check))
        // Static file serving (fallback)
        .fallback_service(
            ServeDir::new("frontend_dist")
                .not_found_service(ServeFile::new("frontend_dist/index.html"))
        )
        .layer(CorsLayer::permissive())
        .with_state(app_state);
        
    // ... rest of function
}
```

### 4. Update Frontend Build Process
**File:** `frontend/package.json`
```json
{
  "scripts": {
    "build:backend": "npm run build && ../backend/build_frontend.sh",
    "deploy:combined": "npm run build:backend && cd ../backend && cargo shuttle deploy"
  }
}
```

### 5. Frontend API URL Configuration
**File:** `frontend/src/config.ts`
```typescript
export const API_BASE_URL = window.location.origin + '/api';
// Removes need for separate backend URL in production
```

### 6. Deployment Workflow
1. **Development**: Continue using separate servers (`shuttle run` + `npm run start`)
2. **Production**: Single deployment command (`npm run deploy:combined`)

## Key Benefits
- **Single origin**: Eliminates CORS issues
- **Simplified deployment**: One command deploys everything
- **Route precedence**: API routes take priority over static files
- **SPA support**: `not_found_service` serves `index.html` for client-side routing

## Migration Steps
1. Add `tower-http` "fs" feature to `Cargo.toml`
2. Create build script and update frontend package.json
3. Modify backend router to serve static files
4. Test locally with `npm run build:backend && cd ../backend && shuttle run`
5. Deploy with `npm run deploy:combined`

This approach follows the shuttle_static_files_example pattern while preserving your existing API structure and adding proper SPA support for client-side routing.