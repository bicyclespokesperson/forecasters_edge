# Testing Guide

## Mock Weather Data

The application supports using mock weather data instead of live API calls for development and testing.

### How Mock Mode Works

Mock mode is automatically enabled when:
- `NODE_ENV=test` (for unit tests)
- URL contains `?mock` parameter (for browser testing)

### Using Mock Mode

**Option 1: URL Parameter**
```
http://localhost:1234?mock
```

**Option 2: npm script**
```bash
npm run start:mock
```

**Option 3: Manual URL**
```
npm run start
# Then visit: http://localhost:1234?mock
```

### Mock Mode Features

- 🧪 Uses sample weather data from `data/sample_weather_response_st_helens.json`
- 🔄 Automatic fallback to mock data if real API fails
- 📱 Visual indicator in header: "Forecaster's Edge (MOCK MODE)"
- 📦 Same caching behavior as real API calls
- ⚡ Faster development without API rate limits

### Weather Caching

The application automatically caches weather requests within 10 miles:

- ✅ **Cache Hit**: Uses existing weather data for nearby locations
- ❌ **Cache Miss**: Fetches new weather data for distant locations
- 📦 **Cache Size**: Grows as you test different locations
- 🔄 **Auto-Cleanup**: Cache resets on page reload

### Console Logging

Enable browser console (F12) to see detailed caching behavior:

```
🧪 MOCK MODE: Using sample weather data instead of live API
Checking weather cache for 45.354, -122.772 (0 cached locations)
🧪 Using MOCK weather data for 45.354, -122.772
📦 Cached weather request for 45.354, -122.772 (cache size: 1)
✅ Using cached weather report for 45.355, -122.773. (0.1 miles from cached location 45.354, -122.772)
```

### Testing Different Scenarios

1. **Cache Testing**: Enter nearby locations to test cache hits
2. **API Fallback**: Mock API failures to test fallback behavior  
3. **Performance**: Use mock mode for faster UI testing
4. **Real Data**: Use normal mode for production testing