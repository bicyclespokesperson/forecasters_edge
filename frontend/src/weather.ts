import suncalc from "suncalc";
import * as L from "leaflet";
import "leaflet.markercluster";
import {
  Chart,
  RadarController,
  LineElement,
  PointElement,
  RadialLinearScale,
  Filler,
  Legend,
  Title,
} from "chart.js";
import {
  WeatherResponse,
  Point,
  DiscGolfCourse,
  calcWeatherScore,
  distanceBetween,
  toCourse,
  selectDefaultStartTime,
  CourseData,
} from "./weather-core.js";

const { getTimes } = suncalc;

Chart.register(
  RadarController,
  LineElement,
  PointElement,
  RadialLinearScale,
  Filler,
  Legend,
  Title
);

// Use mocked weather requests during development/testing
// Set to true to avoid hitting the weather API during development
const mockWeatherRequests =
  process.env.NODE_ENV === "test" ||
  (typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("mock"));
const kmToMile = 0.621371;
const maxDecimalPlaces = 3;
const BACKEND_URL = (() => {
  // Check for URL parameter override first
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    const backendOverride = urlParams.get("backend");
    if (backendOverride === "prod") {
      return "https://forecastersedge-zzfd.shuttle.app";
    } else if (backendOverride === "local") {
      return "http://localhost:3000";
    } else if (backendOverride) {
      return backendOverride;
    }
  }
  
  // Check environment variable
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }
  
  // Default behavior - use same origin for production, localhost:3000 for development
  return window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : window.location.origin;
})();

function pluralizeMiles(distance: number): string {
  const rounded = Math.round(distance);
  return rounded === 1 ? "mile" : "miles";
}

const weatherPool: Array<[Point, Promise<WeatherResponse>]> = [];
const courseDataCache = new Map<number, CourseData>();
const zipcodeLocations = new Map<string, Point>();
let ratingDimensions: Array<{
  id: number;
  name: string;
  description: string;
  min_value: number;
  max_value: number;
}> = [];

async function fetchCourseData(courseId: number): Promise<CourseData | null> {
  if (courseDataCache.has(courseId)) {
    return courseDataCache.get(courseId)!;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/courses/${courseId}/data`);
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`No data available for course ${courseId}`);
        return null;
      }
      throw new Error(
        `Backend API error: ${response.status} ${response.statusText}`
      );
    }

    const courseData: CourseData = await response.json();
    courseDataCache.set(courseId, courseData);
    return courseData;
  } catch (error) {
    console.error(
      `❌ Backend request failed - GET /api/courses/${courseId}/data:`,
      error
    );
    return null;
  }
}

async function fetchBulkCourseData(
  courseIds: number[]
): Promise<Map<number, CourseData>> {
  const uncachedIds = courseIds.filter((id) => !courseDataCache.has(id));
  const result = new Map<number, CourseData>();

  courseIds.forEach((id) => {
    if (courseDataCache.has(id)) {
      result.set(id, courseDataCache.get(id)!);
    }
  });

  if (uncachedIds.length === 0) {
    return result;
  }

  try {
    const idsParam = uncachedIds.join(",");
    const response = await fetch(
      `${BACKEND_URL}/api/courses/bulk?ids=${idsParam}`
    );

    if (!response.ok) {
      throw new Error(
        `Backend API error: ${response.status} ${response.statusText}`
      );
    }

    const bulkData: Record<number, CourseData> = await response.json();

    Object.entries(bulkData).forEach(([id, data]) => {
      const courseId = parseInt(id);
      courseDataCache.set(courseId, data);
      result.set(courseId, data);
    });

    console.log(
      `✅ Fetched data for ${Object.keys(bulkData).length} courses from backend`
    );
  } catch (error) {
    console.error("❌ Backend request failed - GET /api/courses/bulk:", error);
    console.log("ℹ️ Continuing without backend course data");
  }

  return result;
}

async function fetchRatingDimensions(): Promise<void> {
  if (ratingDimensions.length > 0) return;

  try {
    const response = await fetch(`${BACKEND_URL}/api/rating-dimensions`);
    if (response.ok) {
      ratingDimensions = await response.json();
    }
  } catch (error) {
    console.error(
      "❌ Backend request failed - GET /api/rating-dimensions:",
      error
    );
    ratingDimensions = [
      {
        id: 1,
        name: "quality",
        description: "Overall course quality",
        min_value: 1,
        max_value: 5,
      },
      {
        id: 2,
        name: "difficulty",
        description: "Course difficulty",
        min_value: 1,
        max_value: 5,
      },
    ];
  }
}

function formatConditionAge(timestamp?: string): string {
  if (!timestamp) {
    return "";
  }
  
  try {
    const conditionDate = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - conditionDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMinutes < 60) {
      return diffMinutes <= 1 ? "just now" : `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? "1h ago" : `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return diffDays === 1 ? "1d ago" : `${diffDays}d ago`;
    } else {
      const diffWeeks = Math.floor(diffDays / 7);
      return diffWeeks === 1 ? "1w ago" : `${diffWeeks}w ago`;
    }
  } catch (error) {
    console.warn("Failed to parse timestamp:", timestamp, error);
    return "";
  }
}

function createStarRating(name: string, currentValue: number = 0): string {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const activeClass = i <= currentValue ? "active" : "";
    stars.push(
      `<span class="star ${activeClass}" data-rating="${i}" data-name="${name}">★</span>`
    );
  }
  return `<div class="star-rating" data-name="${name}">${stars.join("")}</div>`;
}

function createRatingForm(course: DiscGolfCourse): string {
  const currentConditions = course.getConditions();
  const currentDescription = currentConditions?.description || "";
  const currentConditionsRating = currentConditions?.rating || 0;

  const dimensionRows = ratingDimensions
    .map(
      (dim) => `
    <div class="rating-row">
      <span class="rating-label">${dim.name}:</span>
      ${createStarRating(dim.name, 0)}
    </div>
  `
    )
    .join("");

  return `
    <div class="rating-form" id="rating-form-${
      course.id
    }" style="display: none;">
      <h4>Rate This Course</h4>
      ${dimensionRows}
      <div class="rating-row">
        <span class="rating-label">🏞️ Conditions:</span>
        ${createStarRating("conditions", 0)}
      </div>
      <input type="text" class="conditions-input" placeholder="Describe current conditions (optional)" 
             value="${currentDescription}" maxlength="128">
      <input type="text" class="user-id-input" placeholder="Your name/username (optional)" maxlength="50">
      <div class="rating-form-buttons">
        <button class="rate-button primary" onclick="submitCourseRating(${
          course.id
        })">Submit Rating</button>
        <button class="rate-button secondary" onclick="hideRatingForm(${
          course.id
        })">Cancel</button>
      </div>
      <div class="rating-message" id="rating-message-${
        course.id
      }" style="display: none;"></div>
    </div>
  `;
}

function showRatingForm(courseId: number): void {
  const form = document.getElementById(`rating-form-${courseId}`);
  const button = document.getElementById(`rate-course-btn-${courseId}`);
  if (form && button) {
    form.style.display = "block";
    button.style.display = "none";
  }
}

function hideRatingForm(courseId: number): void {
  const form = document.getElementById(`rating-form-${courseId}`);
  const button = document.getElementById(`rate-course-btn-${courseId}`);
  if (form && button) {
    form.style.display = "none";
    button.style.display = "block";
  }
}

async function submitCourseRating(courseId: number): Promise<void> {
  const form = document.getElementById(`rating-form-${courseId}`);
  const messageDiv = document.getElementById(`rating-message-${courseId}`);
  if (!form || !messageDiv) return;

  const submitButton = form.querySelector(
    ".rate-button.primary"
  ) as HTMLButtonElement;
  if (submitButton) submitButton.disabled = true;

  try {
    const ratings: Record<string, number> = {};
    let hasRatings = false;

    ratingDimensions.forEach((dim) => {
      const starRating = form.querySelector(
        `.star-rating[data-name="${dim.name}"]`
      );
      const activeStars = starRating?.querySelectorAll(".star.active");
      if (activeStars && activeStars.length > 0) {
        ratings[dim.name] = activeStars.length;
        hasRatings = true;
      }
    });

    const conditionsStarRating = form.querySelector(
      '.star-rating[data-name="conditions"]'
    );
    const conditionsActiveStars =
      conditionsStarRating?.querySelectorAll(".star.active");
    const conditionsRating = conditionsActiveStars?.length || 0;

    const conditionsInput = form.querySelector(
      ".conditions-input"
    ) as HTMLInputElement;
    const conditionsDescription = conditionsInput?.value.trim() || "";

    const userIdInput = form.querySelector(
      ".user-id-input"
    ) as HTMLInputElement;
    const userId = userIdInput?.value.trim() || "anonymous";

    const submission: any = { user_id: userId };

    if (hasRatings) {
      submission.ratings = ratings;
    }

    if (conditionsRating > 0) {
      submission.conditions_rating = conditionsRating;
      if (conditionsDescription) {
        submission.conditions_description = conditionsDescription;
      }
    }

    if (!submission.ratings && !submission.conditions_rating) {
      showRatingMessage(
        courseId,
        "Please provide at least one rating or condition update.",
        "error"
      );
      return;
    }

    const response = await fetch(
      `${BACKEND_URL}/api/courses/${courseId}/submit`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
      }
    );

    if (response.ok) {
      showRatingMessage(courseId, "Thank you for your rating!", "success");
      setTimeout(() => hideRatingForm(courseId), 2000);

      await fetchBulkCourseData([courseId]);
      const updatedData = courseDataCache.get(courseId);
      if (updatedData) {
        const course = displayedCourses.find((c) => c.id === courseId);
        if (course) {
          course.setCourseData(updatedData);
        }
      }
    } else {
      showRatingMessage(
        courseId,
        "Failed to submit rating. Please try again.",
        "error"
      );
    }
  } catch (error) {
    console.error(
      `❌ Backend request failed - POST /api/courses/${courseId}/submit:`,
      error
    );
    showRatingMessage(
      courseId,
      "Failed to submit rating. Please try again.",
      "error"
    );
  } finally {
    if (submitButton) submitButton.disabled = false;
    // Always hide the form regardless of success or failure
    hideRatingForm(courseId);
  }
}

function showRatingMessage(
  courseId: number,
  message: string,
  type: "success" | "error"
): void {
  const messageDiv = document.getElementById(`rating-message-${courseId}`);
  if (messageDiv) {
    messageDiv.textContent = message;
    messageDiv.className = `rating-message ${type}`;
    messageDiv.style.display = "block";
    setTimeout(() => {
      messageDiv.style.display = "none";
    }, 5000);
  }
}

function initializeStarRatings(courseId: number): void {
  const form = document.getElementById(`rating-form-${courseId}`);
  if (!form) return;

  const starRatings = form.querySelectorAll(".star-rating");
  starRatings.forEach((rating) => {
    const stars = rating.querySelectorAll(".star");
    stars.forEach((star, index) => {
      star.addEventListener("click", () => {
        const ratingName = rating.getAttribute("data-name");
        if (!ratingName) return;

        // Clear all active states
        stars.forEach((s) => s.classList.remove("active"));

        // Set active states up to clicked star
        for (let i = 0; i <= index; i++) {
          stars[i].classList.add("active");
        }
      });

      star.addEventListener("mouseenter", () => {
        // Show hover effect
        stars.forEach((s, i) => {
          (s as HTMLElement).style.color = i <= index ? "#ffd700" : "#ddd";
        });
      });
    });

    rating.addEventListener("mouseleave", () => {
      // Reset to actual rating state
      const activeStars = rating.querySelectorAll(".star.active");
      stars.forEach((s, i) => {
        (s as HTMLElement).style.color =
          i < activeStars.length ? "#ffd700" : "#ddd";
      });
    });
  });
}

let courses: Promise<DiscGolfCourse[]> | undefined;

let map: L.Map;
let courseMarkers: L.MarkerClusterGroup;
let displayedCourses: DiscGolfCourse[] = [];
let currentSortColumn = "score";
let isAscending = false;
let maxCourses = 10;
let userLocation: Point | undefined;

function getScoreColor(score: number): string {
  if (score >= 8) return "#28a745"; // excellent - green
  if (score >= 6.5) return "#6db33f"; // good - light green
  if (score >= 5) return "#ffc107"; // fair - yellow
  if (score >= 3.5) return "#fd7e14"; // poor - orange
  return "#dc3545"; // bad - red
}

function getScoreClass(score: number): string {
  if (score >= 8) return "score-excellent";
  if (score >= 6.5) return "score-good";
  if (score >= 5) return "score-fair";
  if (score >= 3.5) return "score-poor";
  return "score-bad";
}

function createCustomIcon(course: DiscGolfCourse): L.DivIcon {
  const score = course.getWeatherScore().score;
  const color = getScoreColor(score);

  return L.divIcon({
    html: `<div style="background-color: ${color}; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${score.toFixed(
      1
    )}</div>`,
    className: "custom-marker",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function createPopupContent(course: DiscGolfCourse): string {
  const score = course.getWeatherScore();
  const breakdown = score.breakdown;

  // Create detailed weather information with both actual values and percentages
  const factors = [
    `☔ Precipitation: ${breakdown.precipitation.raw.probability.toFixed(
      0
    )}% chance, ${breakdown.precipitation.raw.mm.toFixed(1)}mm`,
    `🌡️ Temperature: ${breakdown.temperature.raw.fahrenheit.toFixed(0)}°F (${(
      10 * breakdown.temperature.score
    ).toFixed(0)}% comfort)`,
    `💨 Wind: ${breakdown.wind.raw.mph.toFixed(0)} mph (${(
      10 * breakdown.wind.score
    ).toFixed(0)}% calm)`,
  ];

  const conditions = course.getConditions();
  if (conditions) {
    const descriptionText = conditions.description || "No description provided";
    const ageText = formatConditionAge(conditions.timestamp);
    const ageDisplay = ageText ? ` • ${ageText}` : "";
    factors.push(
      `🏞️ Conditions: ${descriptionText} (${conditions.rating}/5)${ageDisplay}`
    );
  } else {
    factors.push(`🏞️ Conditions: ❓`);
  }

  return `
    <div class="popup-content">
      <div class="popup-course-name">${course.name}</div>
      <div class="popup-score">
        <div class="weather-score ${getScoreClass(
          score.score
        )}">${score.score.toFixed(1)}</div>
      </div>
      <div class="popup-details">
        <strong>Distance:</strong> ${(course.distanceAwayKm * kmToMile).toFixed(
          0
        )} ${pluralizeMiles(course.distanceAwayKm * kmToMile)}<br>
        <strong>Holes:</strong> ${course.numHoles}<br>
      </div>
      <div class="chart-container" id="chart-${course.name
        .replace(/\s+/g, "-")
        .toLowerCase()}">
        <canvas width="150" height="150"></canvas>
      </div>
      <div class="weather-factors">
        ${factors
          .map((factor) => `<div class="factor">${factor}</div>`)
          .join("")}
      </div>
      <button class="rate-button primary" id="rate-course-btn-${course.id}" 
              onclick="showRatingForm(${course.id})">Rate This Course</button>
      ${createRatingForm(course)}
    </div>
  `;
}

function initializeMap(): void {
  console.log("🗺️ Initializing map...");

  const mapContainer = document.getElementById("map");
  if (!mapContainer) {
    console.error("❌ Map container not found!");
    return;
  }

  console.log("✅ Map container found:", mapContainer);
  console.log(
    "Map container dimensions:",
    mapContainer.getBoundingClientRect()
  );

  try {
    map = L.map("map").setView([39.8283, -98.5795], 4); // Center of US
    console.log("✅ Leaflet map created");

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);
    console.log("✅ Tile layer added");

    courseMarkers = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: false,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
    });

    map.addLayer(courseMarkers);
    console.log("✅ Marker cluster group added");

    // Force map to resize after a short delay
    setTimeout(() => {
      console.log("🔄 Forcing map resize...");
      map.invalidateSize();
    }, 100);
  } catch (error) {
    console.error("❌ Failed to initialize map:", error);
  }
}

function addCourseMarkers(courses: DiscGolfCourse[]): void {
  courseMarkers.clearLayers();

  courses.forEach((course) => {
    try {
      const marker = L.marker([course.location.lat, course.location.lon], {
        icon: createCustomIcon(course),
      });

      const popupContent = createPopupContent(course);
      const popup = marker.bindPopup(popupContent, {
        maxWidth: 280,
        closeButton: true,
        autoPan: true,
        autoPanPadding: [10, 10],
        keepInView: true,
        maxHeight: 300,
        className: 'custom-popup'
      });

      // Initialize chart and star ratings when popup opens
      marker.on("popupopen", () => {
        const chartId = `chart-${course.name
          .replace(/\s+/g, "-")
          .toLowerCase()}`;
        const chartContainer = document.getElementById(chartId);
        const canvas = chartContainer?.querySelector("canvas");

        if (canvas && !canvas.dataset.chartInitialized) {
          try {
            const breakdown = course.getWeatherScore().breakdown;
            console.log(`Weather breakdown for ${course.name}:`, breakdown);

            // Detect dark mode for better chart visibility
            const isDarkMode =
              window.matchMedia &&
              window.matchMedia("(prefers-color-scheme: dark)").matches;
            const chartColors = isDarkMode
              ? {
                  backgroundColor: "rgba(100, 200, 255, 0.3)",
                  borderColor: "rgba(100, 200, 255, 1)",
                  pointBackgroundColor: "rgba(100, 200, 255, 1)",
                  pointBorderColor: "#fff",
                  gridColor: "rgba(255, 255, 255, 0.2)",
                }
              : {
                  backgroundColor: "rgba(0, 123, 255, 0.2)",
                  borderColor: "rgba(0, 123, 255, 1)",
                  pointBackgroundColor: "rgba(0, 123, 255, 1)",
                  pointBorderColor: "#fff",
                  gridColor: "rgba(0, 0, 0, 0.1)",
                };

            const conditionsScore = course.getConditions()?.rating || 5;
            const conditionsDisplay = conditionsScore * 2;

            new Chart(canvas, {
              type: "radar",
              data: {
                labels: ["☔", "🌡️", "💨", "🏞️"],
                datasets: [
                  {
                    data: [
                      breakdown.precipitation.score || 0,
                      breakdown.temperature.score || 0,
                      breakdown.wind.score || 0,
                      conditionsDisplay,
                    ],
                    backgroundColor: chartColors.backgroundColor,
                    borderColor: chartColors.borderColor,
                    pointBackgroundColor: chartColors.pointBackgroundColor,
                    pointBorderColor: chartColors.pointBorderColor,
                  },
                ],
              },
              options: {
                responsive: false,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  r: {
                    suggestedMin: 0,
                    suggestedMax: 10,
                    ticks: { display: false },
                    pointLabels: {
                      font: { size: 10 },
                      color: isDarkMode
                        ? "rgba(255, 255, 255, 0.8)"
                        : "rgba(0, 0, 0, 0.8)",
                    },
                    grid: {
                      color: chartColors.gridColor,
                    },
                    angleLines: {
                      color: chartColors.gridColor,
                    },
                  },
                },
              },
            });
            canvas.dataset.chartInitialized = "true";
          } catch (error) {
            console.warn(`Failed to create chart for ${course.name}:`, error);
          }
        }

        // Initialize star rating interactions
        initializeStarRatings(course.id);
      });

      course.marker = marker;
      courseMarkers.addLayer(marker);
    } catch (error) {
      console.warn(`Could not create marker for ${course.name}:`, error);
    }
  });
}

function updateTimeDisplay(): void {
  const timeSlider = document.getElementById("timeSlider") as HTMLInputElement;
  const timeDisplay = document.getElementById("timeDisplay") as HTMLSpanElement;

  if (timeSlider && timeDisplay) {
    const hour = parseInt(timeSlider.value);
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const ampm = hour < 12 ? "AM" : "PM";
    timeDisplay.textContent = `${displayHour}:00 ${ampm}`;
  }
}

function getSelectedStartHour(): number {
  const timeSlider = document.getElementById("timeSlider") as HTMLInputElement;
  return timeSlider ? parseInt(timeSlider.value) : 18;
}

function sortCourses(
  courses: DiscGolfCourse[],
  column: string
): DiscGolfCourse[] {
  const sorted = [...courses].sort((a, b) => {
    let comparison = 0;
    switch (column) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "score":
        comparison = a.getWeatherScore().score - b.getWeatherScore().score;
        break;
      case "distance":
        comparison = a.distanceAwayKm - b.distanceAwayKm;
        break;
      case "holes":
        comparison = a.numHoles - b.numHoles;
        break;
    }
    return isAscending ? comparison : -comparison;
  });

  return sorted;
}

function updateCourseList(courses: DiscGolfCourse[]): void {
  const courseList = document.getElementById("courseList");
  if (!courseList) return;

  if (courses.length === 0) {
    courseList.innerHTML = '<div class="loading">No courses found</div>';
    return;
  }

  const sortedCourses = sortCourses(courses, currentSortColumn);

  courseList.innerHTML = "";

  sortedCourses.forEach((course) => {
    const courseCard = document.createElement("div");
    courseCard.className = "course-card";

    const score = course.getWeatherScore();

    courseCard.innerHTML = `
      <div class="course-name">${course.name}</div>
      <div class="course-details">
        <span>${(course.distanceAwayKm * kmToMile).toFixed(0)} ${pluralizeMiles(
      course.distanceAwayKm * kmToMile
    )}</span>
        <span>${course.numHoles} holes</span>
        <div class="weather-score ${getScoreClass(
          score.score
        )}">${score.score.toFixed(1)}</div>
      </div>
    `;

    courseCard.addEventListener("click", () => {
      if (course.marker) {
        map.setView([course.location.lat, course.location.lon], 13);
        course.marker.openPopup();
      }
    });

    courseList.appendChild(courseCard);
  });

  // Update course count
  const courseCount = document.getElementById("courseCount");
  if (courseCount) {
    courseCount.textContent = `Showing ${courses.length} courses`;
  }
}

async function fetchWeather(loc: Point): Promise<WeatherResponse> {
  const timezone = "auto";
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&hourly=temperature_2m,precipitation_probability,precipitation,windspeed_10m&temperature_unit=fahrenheit&forecast_days=1&timezone=${timezone}`;

  // Cache weather requests within 10 miles to avoid redundant API calls
  const sameWeatherThresholdMiles = 10;

  // Check cache for nearby weather reports
  if (weatherPool.length > 0) {
    console.log(
      `Checking weather cache for ${loc.toString()} (${
        weatherPool.length
      } cached locations)`
    );

    const closestExisting = weatherPool.reduce((a, b) => {
      return distanceBetween(a[0], loc) < distanceBetween(b[0], loc) ? a : b;
    });
    const milesApart = distanceBetween(loc, closestExisting[0]) * kmToMile;

    if (milesApart < sameWeatherThresholdMiles) {
      console.log(
        `✅ Using cached weather report for ${loc.toString()}. (${milesApart.toFixed(
          1
        )} miles from cached location ${closestExisting[0].toString()})`
      );
      return await closestExisting[1];
    } else {
      console.log(
        `❌ Cache miss: Closest cached location is ${milesApart.toFixed(
          1
        )} miles away (threshold: ${sameWeatherThresholdMiles} miles)`
      );
    }
  }

  if (mockWeatherRequests) {
    console.log(`🧪 Using MOCK weather data for ${loc.toString()}`);
  } else {
    console.log(`🌤️ Fetching REAL weather data for ${loc.toString()}`);
  }

  const weather: Promise<WeatherResponse> = (async () => {
    try {
      if (mockWeatherRequests) {
        return await fetchWeatherMock(loc);
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `Weather API error: ${response.status} ${response.statusText}`
        );
      }
      const data = await response.json();
      return new WeatherResponse(data);
    } catch (error) {
      console.error(`Failed to fetch weather for ${loc.toString()}:`, error);
      // Fallback to mock data if real API fails
      console.log(`🔄 Falling back to mock weather data for ${loc.toString()}`);
      return await fetchWeatherMock(loc);
    }
  })();

  weatherPool.push([loc, weather]);
  console.log(
    `📦 Cached weather request for ${loc.toString()} (cache size: ${
      weatherPool.length
    })`
  );

  return await weather;
}

async function fetchWeatherMock(_p: Point): Promise<WeatherResponse> {
  const filePath = "data/sample_weather_response_st_helens.json";
  return await fetch(filePath)
    .then(async (response) => await response.text())
    .then(JSON.parse)
    .then((val) => new WeatherResponse(val));
}

function countDecimalPlaces(n: string): number {
  const parts = n.split(".");
  if (parts.length === 1) {
    return 0;
  }
  return parts[1].length;
}

function onLocationUpdated(): void {
  const inputBox = document.getElementById("userLatLon") as HTMLInputElement;

  if (inputBox.value.includes(",")) {
    const [newLat, newLon] = inputBox.value.split(",");
    const p = new Point(parseFloat(newLat), parseFloat(newLon));
    if (
      countDecimalPlaces(newLat) > maxDecimalPlaces ||
      countDecimalPlaces(newLon) > maxDecimalPlaces
    ) {
      inputBox.value = p.toString();
    }
  }
}

async function getBrowserLocation(): Promise<Point> {
  return await new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject("Geolocation is not supported by this browser.");
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const userLocation = new Point(latitude, longitude);
        resolve(userLocation);
      },
      (error) => {
        reject(`Unable to retrieve user location: ${error.message}`);
      }
    );
  });
}

async function fetchZipcodeDataset() {
  const filepath = "data/zipcode_lat_lon.csv";
  void (await fetch(filepath)
    .then(async (response) => await response.text())
    .then((contents) => contents.split("\n"))
    .then((lines) => {
      lines.map((line) => {
        const [zipcode, lat, lon] = line.split(",");
        zipcodeLocations.set(
          zipcode,
          new Point(parseFloat(lat), parseFloat(lon))
        );
      });
    }));
}

async function getUserLocation(): Promise<Point | undefined> {
  const locationInputBox = document.getElementById(
    "userLatLon"
  ) as HTMLInputElement;

  let result: Point | undefined = undefined;
  try {
    let locationInput = locationInputBox.value;

    if (locationInput === "") {
      throw new Error("No location provided");
    }

    if (locationInput.includes(",")) {
      const [newLat, newLon] = locationInput.split(",");
      const p = new Point(parseFloat(newLat), parseFloat(newLon));
      if (isNaN(p.lat) || isNaN(p.lon)) {
        throw new Error("Invalid lat/lon coordinate");
      }

      result = p;
    } else {
      if (locationInput.includes("-")) {
        locationInput = locationInput.substring(0, locationInput.indexOf("-"));
      }

      if (zipcodeLocations.size === 0) {
        await fetchZipcodeDataset();
      }

      result = zipcodeLocations.get(locationInput);
      if (!result) {
        throw new Error(`Unknown zipcode: ${result}`);
      }
    }
  } catch (error: unknown) {
    console.error(error);
  }

  if (result === undefined) {
    locationInputBox.style.border = "none";
    locationInputBox.style.outline = "2px solid red";
    locationInputBox.style.borderRadius = "5px";
  } else {
    locationInputBox.style.border = "";
    locationInputBox.style.outline = "";
    locationInputBox.style.borderRadius = "";
  }
  return result;
}

async function loadNearestCourses(): Promise<void> {
  const loc = await getUserLocation();
  if (!loc) {
    return;
  }

  userLocation = loc;
  console.log(`Determining weather at courses near ${loc.toString()}`);

  void fetchCourses().then(async (courses) => {
    courses = courses.filter((course) => course.numHoles >= 18);
    courses.forEach(
      (course) =>
        (course.distanceAwayKm = distanceBetween(course.location, loc))
    );
    courses.sort((c1, c2) => c1.distanceAwayKm - c2.distanceAwayKm);
    courses = courses.slice(0, maxCourses);

    const courseList = document.getElementById("courseList");
    if (courseList) {
      courseList.innerHTML =
        '<div class="loading">Loading weather and course data...</div>';
    }

    const courseIds = courses.map((course) => course.id);
    const bulkCourseData = await fetchBulkCourseData(courseIds);

    await Promise.all(
      courses.map(async (course) => {
        const courseData = bulkCourseData.get(course.id);
        if (courseData) {
          course.setCourseData(courseData);
        }

        await fetchWeather(course.location).then((weather) => {
          const startHour = getSelectedStartHour();
          const conditions = course.getConditions();
          course.setWeatherScore(
            calcWeatherScore(weather, startHour, conditions)
          );
        });
      })
    );

    courses.sort(
      (c1, c2) => c2.getWeatherScore().score - c1.getWeatherScore().score
    );

    displayedCourses = courses;
    addCourseMarkers(courses);
    updateCourseList(courses);

    // Center map on user location with appropriate zoom
    if (courses.length > 0) {
      const markers = courses.map((c) => c.marker!).filter((m) => m);
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
    } else {
      map.setView([loc.lat, loc.lon], 10);
    }

    // Show "Show More" button
    const showMoreButton = document.getElementById("showMoreButton");
    if (showMoreButton && maxCourses === 10) {
      showMoreButton.style.display = "block";
    }
  });

  updateSunsetTime(loc);
}

function updateSunsetTime(loc: Point) {
  const sunsetParagraph = document.getElementById("sunsetTime");
  if (sunsetParagraph === null) {
    return;
  }

  const today = new Date();
  const sunInfo = getTimes(today, loc.lat, loc.lon);

  const formattedTime = sunInfo.sunset.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
  sunsetParagraph.textContent = `Sunset today: ${formattedTime}`;
}

async function fetchCourses(): Promise<DiscGolfCourse[]> {
  const getWeekNumber = (date: Date) => {
    const oneJan = new Date(date.getFullYear(), 0, 1);
    const numberOfDays = Math.floor(
      (date.getSeconds() - oneJan.getSeconds()) / (24 * 60 * 60)
    );
    return Math.ceil((date.getDay() + 1 + numberOfDays) / 7);
  };

  const currentDate = new Date();
  const weekNumber = getWeekNumber(currentDate);
  const filePath = "data/usa_courses.csv?v=" + weekNumber;

  if (!courses) {
    courses = fetch(filePath)
      .then(async (response) => await response.text())
      .then((contents) => {
        const lines = contents.split("\n");
        lines.shift();
        return lines.map(toCourse);
      });
  }

  return await courses;
}

async function pageInit(): Promise<void> {
  console.log("🚀 Starting page initialization...");

  // Wait for DOM to be fully loaded
  if (document.readyState === "loading") {
    console.log("⏳ Waiting for DOM to load...");
    await new Promise((resolve) => {
      document.addEventListener("DOMContentLoaded", resolve);
    });
  }

  // Show mock mode indicator if enabled
  if (mockWeatherRequests) {
    console.log("🧪 MOCK MODE: Using sample weather data instead of live API");
    const header = document.querySelector(".header h1") as HTMLElement;
    if (header) {
      header.textContent = "Forecaster's Edge (MOCK MODE)";
      header.style.color = "#ff6b35";
    }
  }

  // Initialize map after ensuring DOM is ready
  console.log("📍 Initializing map...");
  initializeMap();

  // Fetch rating dimensions
  await fetchRatingDimensions();

  // Auto-detect location and set default
  try {
    const browserLocation = await getBrowserLocation();
    const locationInput = document.getElementById(
      "userLatLon"
    ) as HTMLInputElement;
    locationInput.value = browserLocation.toString();
  } catch (error) {
    console.warn("Could not get browser location:", error);
    const locationInput = document.getElementById(
      "userLatLon"
    ) as HTMLInputElement;
    locationInput.value = new Point(33.6458, -82.2888).toString(); // Default location
  }

  // Set default start time
  const timeSlider = document.getElementById("timeSlider") as HTMLInputElement;
  if (timeSlider) {
    const defaultStartTimeValue = selectDefaultStartTime(new Date());
    timeSlider.value = defaultStartTimeValue;
    updateTimeDisplay();
  }

  // Event listeners
  const locationInput = document.getElementById(
    "userLatLon"
  ) as HTMLInputElement;
  locationInput?.addEventListener("change", onLocationUpdated);
  locationInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      loadNearestCourses();
    }
  });

  timeSlider?.addEventListener("input", () => {
    updateTimeDisplay();
    if (displayedCourses.length > 0 && userLocation) {
      // Reload weather scores with new time
      loadNearestCourses();
    }
  });

  const sortSelect = document.getElementById("sortSelect") as HTMLSelectElement;
  sortSelect?.addEventListener("change", (e) => {
    const target = e.target as HTMLSelectElement;
    if (currentSortColumn === target.value) {
      isAscending = !isAscending;
    } else {
      currentSortColumn = target.value;
      isAscending = target.value === "score" ? false : true;
    }
    updateCourseList(displayedCourses);
  });

  const showMoreButton = document.getElementById("showMoreButton");
  showMoreButton?.addEventListener("click", () => {
    maxCourses = 20;
    showMoreButton.style.display = "none";
    loadNearestCourses();
  });

  const loadWeatherButton = document.getElementById("loadWeatherButton");
  loadWeatherButton?.addEventListener("click", () => {
    loadNearestCourses();
  });
}

// Expose functions to global scope for onclick handlers
(window as any).showRatingForm = showRatingForm;
(window as any).hideRatingForm = hideRatingForm;
(window as any).submitCourseRating = submitCourseRating;

export { pageInit };

void pageInit();
