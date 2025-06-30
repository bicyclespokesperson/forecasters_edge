# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Forecaster's Edge is a web application that ranks nearby disc golf courses by weather conditions. Users input a location (ZIP code or coordinates) and receive a list of nearby courses with weather scores based on precipitation, temperature, wind speed, and other factors.

## Key Development Commands

- `npm run build` - Compile TypeScript and build for production
- `npm run lint` - Run ESLint and Prettier formatting on TypeScript files
- `npm run start` - Start development server with live reload
- `npm run test` - Run unit tests using Mocha
- `npm run push-gh-pages` - Deploy to GitHub Pages

## Architecture

### Core Components

- **weather.ts** - Main business logic containing:
  - Weather API integration with Open-Meteo
  - Weather scoring algorithm (calcWeatherScore)
  - Course distance calculations using Haversine formula
  - Location services (browser geolocation, ZIP code lookup)
  - Dynamic table sorting and UI updates

- **index.html** - Main UI with location input, course table, and time selection
- **CSS styling** - Located in css/style.css

### Key Classes

- `WeatherResponse` - Parses weather API data
- `Point` - Represents lat/lon coordinates with distance calculations
- `DiscGolfCourse` - Course data with weather scoring
- `WeatherScore` - Combines numeric score with detailed breakdown

### Data Sources

- **Course Data**: data/usa_courses.csv - disc golf course locations
- **ZIP Codes**: data/zipcode_lat_lon.csv - ZIP to coordinate mapping
- **Weather API**: Open-Meteo API for real-time weather forecasts

### Weather Scoring Algorithm

The scoring system (1-10 scale) considers:
- Precipitation amount and probability
- Temperature (optimal 45-82°F)
- Wind speed (penalized above 25 mph)
- 3-hour round duration assumption

### Time-based Features

- Dynamic default start times: 5 PM weekdays, next hour on weekends
- Sunset calculation using suncalc library
- Weather forecasts calculated for specific start times

## TypeScript Configuration

- ES2020 modules with Node.js resolution
- Strict type checking enabled
- Parcel bundler for development and production builds

## Testing

Unit tests cover:
- Weather scoring algorithm edge cases
- Distance calculations (Haversine formula)
- CSV parsing (toCourse function)
- Time-based logic (chooseDefaultStartTime)

## Deployment

GitHub Pages deployment via dist/ folder with:
- Parcel-built assets
- Data files copied to dist/data/
- .nojekyll file for proper asset serving