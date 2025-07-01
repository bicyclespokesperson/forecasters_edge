# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Forecaster's Edge is a modern web application that helps disc golfers find the best nearby courses based on weather conditions. The app features an interactive map interface, detailed weather scoring, and responsive design that works seamlessly on desktop and mobile devices.

## Key Development Commands

- `npm run build` - Compile TypeScript and build for production
- `npm run lint` - Run ESLint and Prettier formatting on TypeScript files
- `npm run start` - Start development server with live weather API requests
- `npm run start:mock` - Start development server with mocked weather data (for testing)
- `npm run test` - Run unit tests using Mocha
- `npm run push-gh-pages` - Deploy to GitHub Pages

## Architecture

### Core Components

- **weather-core.ts** - Core business logic module containing:
  - Weather scoring algorithm (calcWeatherScore)
  - Course distance calculations using Haversine formula
  - Data models (WeatherResponse, DiscGolfCourse, Point, WeatherScore)
  - Time-based logic (chooseDefaultStartTime)
  - CSV parsing utilities (toCourse)

- **weather.ts** - UI and interaction layer containing:
  - Interactive map implementation with Leaflet.js
  - Radar chart creation with Chart.js
  - Weather API integration with Open-Meteo
  - Location services (browser geolocation, ZIP code lookup)
  - Course marker clustering and popup management
  - Mock weather system for development/testing

- **index.html** - Modern responsive UI with interactive map, sidebar course list, and time controls
- **about.html** - Comprehensive documentation page with feature explanations
- **css/style.css** - Responsive styling with dark mode support and mobile optimization

### Key Classes

- `WeatherResponse` - Parses weather API data from Open-Meteo
- `Point` - Represents lat/lon coordinates with distance calculations
- `DiscGolfCourse` - Course data with weather scoring and map integration
- `WeatherScore` - Combines numeric score with detailed breakdown and summary data

### Data Sources

- **Course Data**: data/usa_courses.csv - disc golf course locations (18+ holes)
- **ZIP Codes**: data/zipcode_lat_lon.csv - ZIP to coordinate mapping
- **Weather API**: Open-Meteo API for real-time weather forecasts
- **Mock Data**: Sample weather responses for development and testing

### Weather Scoring Algorithm

The scoring system (1-10 scale) considers:
- Precipitation amount and probability
- Temperature (optimal 45-82°F)
- Wind speed (penalized above 25 mph)
- 3-hour round duration assumption

### UI Features

#### Interactive Map
- **Leaflet.js** integration with OpenStreetMap tiles
- **Color-coded markers** based on weather scores (green=excellent, red=poor)
- **Marker clustering** for performance with many courses
- **Popup charts** showing detailed weather breakdowns using Chart.js radar charts
- **Click-to-center** functionality for easy navigation

#### Responsive Design
- **Desktop layout**: Side-by-side map and course list with fixed sidebar
- **Mobile layout**: Scrollable webpage with map at top, course list below
- **Mobile view toggles**: "🗺️ Map" and "📋 List" buttons to adjust map size (25vh-60vh)
- **Dark mode support** that adapts to system preferences and includes chart color optimization
- **Touch-friendly** controls and interactions
- **Natural scrolling**: Mobile users can scroll through full course list without viewport constraints

#### Weather Visualization
- **Radar charts** in popups showing precipitation, temperature, wind, and overall scores
- **Emoji chart labels** (☔, 🌡️, 💨, ⭐) for compact display in mobile popups
- **Detailed weather data** including actual values (°F, mph, mm, %) alongside comfort percentages
- **Color-coded scores** with intuitive green/yellow/red system
- **Dark mode chart adaptation** with optimized colors for visibility

### Time-based Features

- Dynamic default start times: 5 PM weekdays, next hour on weekends
- Sunset calculation using suncalc library
- Weather forecasts calculated for specific start times
- Time slider with live updates

### Development & Testing

#### Mock Weather System
- **URL parameter**: `?mock` enables mock weather data
- **Environment detection**: Automatically uses mocks during testing
- **Consistent data**: Reproducible weather scenarios for development

#### TypeScript Configuration
- ES2020 modules with Node.js resolution
- Strict type checking enabled
- Parcel bundler for development and production builds
- Separated core logic for better testability

#### Dependencies
- **Leaflet.js**: Interactive mapping
- **Chart.js**: Radar chart visualization
- **Leaflet.markercluster**: Performance optimization
- **suncalc**: Sunset time calculations

## Testing

Unit tests cover:
- Weather scoring algorithm edge cases
- Distance calculations (Haversine formula)
- CSV parsing (toCourse function)
- Time-based logic (chooseDefaultStartTime)
- WeatherResponse data parsing
- Point coordinate formatting

Run tests with `npm test` or use mock mode with `npm run start:mock`.

## Deployment

GitHub Pages deployment via dist/ folder with:
- Parcel-built assets (CSS, JS bundles)
- Data files copied to dist/data/
- .nojekyll file for proper asset serving
- Optimized builds with minification

The app automatically adapts to user preferences including location services, dark mode, and responsive design.