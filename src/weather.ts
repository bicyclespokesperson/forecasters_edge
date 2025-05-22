import { getTimes } from "suncalc";

const mockWeatherRequests = false;

const kmToMile = 0.621371;
const maxDecimalPlaces = 3;

const weatherPool: Array<[Point, Promise<WeatherResponse>]> = [];
const zipcodeLocations = new Map<string, Point>();
let courses: Promise<DiscGolfCourse[]> | undefined;

let currentSortColumn: string | null = null;
let isAscending = true;
let displayedCourses: DiscGolfCourse[] = [];

class WeatherResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  hourly_units: {
    time: string;
    temperature_2m: string;
    precipitation_probability: string;
    precipitation: string;
    windspeed_10m: string;
  };

  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    precipitation: number[];
    windspeed_10m: number[];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(data: any) {
    this.latitude = data.latitude;
    this.longitude = data.longitude;
    this.generationtime_ms = data.generationtime_ms;
    this.utc_offset_seconds = data.utc_offset_seconds;
    this.timezone = data.timezone;
    this.timezone_abbreviation = data.timezone_abbreviation;
    this.elevation = data.elevation;
    this.hourly_units = {
      time: data.hourly_units.time,
      temperature_2m: data.hourly_units.temperature_2m,
      precipitation_probability: data.hourly_units.precipitation_probability,
      precipitation: data.hourly_units.precipitation,
      windspeed_10m: data.hourly_units.windspeed_10m,
    };
    this.hourly = {
      time: data.hourly.time,
      temperature_2m: data.hourly.temperature_2m,
      precipitation_probability: data.hourly.precipitation_probability,
      precipitation: data.hourly.precipitation,
      windspeed_10m: data.hourly.windspeed_10m,
    };
  }
}

class Point {
  constructor(public lat: number, public lon: number) {}

  toString(): string {
    return `${this.lat.toFixed(maxDecimalPlaces)}, ${this.lon.toFixed(
      maxDecimalPlaces
    )}`;
  }
}

class WeatherScore {
  constructor(public score: number, public summary: string) {}
}

class DiscGolfCourse {
  private weatherScore: WeatherScore | undefined = undefined;

  public distanceAwayKm = NaN;

  constructor(
    public name: string,
    public numHoles: number,
    public location: Point
  ) {}

  public setWeatherScore(weatherScore: WeatherScore): void {
    this.weatherScore = weatherScore;
  }

  public getWeatherScore(): WeatherScore {
    if (!this.weatherScore) {
      throw new Error(`Weather score undefined for ${this.name}`);
    }
    return this.weatherScore;
  }

  public toString(): string {
    return `${this.name},${this.numHoles},${this.location.toString()},${
      this.weatherScore
    }`;
  }
}

function calcWeatherScore(weather: WeatherResponse): WeatherScore {
  // Weather start time is in local time based on the lat/lon of the request
  const weatherStartTime = new Date(weather.hourly.time[0]);

  const roundStartTime = (() => {
    const startHour = parseInt(
      (document.getElementById("hourSelect") as HTMLInputElement).value
    );

    if (!(startHour >= 0 && startHour <= 23)) {
      throw new Error("Invalid start hour");
    }

    // Assume the round start time matches course's local time
    const roundStartTime = new Date(weatherStartTime.valueOf());
    roundStartTime.setHours(startHour);
    roundStartTime.setMinutes(0);
    roundStartTime.setSeconds(0);
    roundStartTime.setMilliseconds(0);

    return roundStartTime;
  })();

  // Calculate how far into the hours array to look for the forecasted hourly weather.
  const offsetHours = Math.floor(
    (roundStartTime.valueOf() - weatherStartTime.valueOf()) / (1000 * 60 * 60)
  );

  if (offsetHours >= weather.hourly.precipitation_probability.length) {
    throw new Error(
      `Insufficient weather data. Needed ${offsetHours + 1} hours, got ${
        weather.hourly.precipitation_probability.length
      }.`
    );
  }

  const expectedRoundLength = 3;

  // isPreceeding = true means that the value is for the previous hour, not the instant value.
  // For example, since total precipitation is for the previous hour, we want arr[7:00] for a round
  // that starts at 6:00, since that value is how much it is expected to rain between 6:00 and 7:00.
  const avgValue = (arr: number[], isPreceeding: boolean): number => {
    const offset = Math.min(offsetHours + (isPreceeding ? 1 : 0), 23);
    const duringRound = arr.slice(offset, offset + expectedRoundLength);
    return duringRound.reduce((a, b) => a + b) / duringRound.length;
  };

  const precip = avgValue(weather.hourly.precipitation, true);
  const precipProbability = avgValue(
    weather.hourly.precipitation_probability,
    true
  );
  const temperature = avgValue(weather.hourly.temperature_2m, false);
  const windSpeed = avgValue(weather.hourly.windspeed_10m, true) * kmToMile;

  // Slight penalty if the temperature isn't in this range
  const minBestTemperatureF = 45;
  const maxBestTemperatureF = 82;
  const maxBestWindSpeedMPH = 25;

  const precipProbabilityScore = (1 - precipProbability / 100) * 2.5;

  // Any precipitation means there will be substantial rain
  const precipScore = Math.max(7.5 - 2.7 * precip, 0);
  const tempPenalty =
    (Math.max(minBestTemperatureF - temperature, 0) +
      Math.max(temperature - maxBestTemperatureF, 0)) /
    3;

  const windPenalty = Math.max(windSpeed - maxBestWindSpeedMPH, 0) / 2;
  const score = Math.max(
    precipScore + precipProbabilityScore - tempPenalty - windPenalty,
    1
  );

  // Calculate the weather score
  const components = `precip (mm): ${precip.toFixed(
    1
  )}, precipProbability (%): ${precipProbability.toFixed(
    1
  )}, windSpeed (mph): ${windSpeed.toFixed(
    1
  )}, temperature (F): ${temperature.toFixed(1)}`;

  const formula = `(${precipScore.toFixed(
    1
  )} precip score) + (${precipProbabilityScore.toFixed(
    1
  )} precip probability score) - (${tempPenalty.toFixed(
    1
  )} temperature score) - (${windPenalty.toFixed(
    1
  )} wind score) = ${score.toFixed(1)}`;
  return new WeatherScore(score, components + "\n\n" + formula);
}

function sortCourses(column: string): void {
  if (column === currentSortColumn) {
    isAscending = !isAscending;
  } else {
    currentSortColumn = column;
    isAscending = true;
  }

  displayedCourses.sort((a, b) => {
    let comparison = 0;
    switch (currentSortColumn) {
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

  // Update header classes
  const headers = document.querySelectorAll("#nearbyCourses thead th");
  headers.forEach((th) => {
    th.classList.remove("sort-asc", "sort-desc");
  });

  if (currentSortColumn) {
    const activeHeader = document.querySelector(
      `#nearbyCourses thead th[data-column="${currentSortColumn}"]`
    );
    if (activeHeader) {
      activeHeader.classList.add(isAscending ? "sort-asc" : "sort-desc");
    }
  }

  updateCoursesTable(displayedCourses);
}

async function fetchWeather(loc: Point): Promise<WeatherResponse> {
  const timezone = "auto";

  // Use Open-Meteo API to fetch the weather forecast for a particular location
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&hourly=temperature_2m,precipitation_probability,precipitation,windspeed_10m&temperature_unit=fahrenheit&forecast_days=1&timezone=${timezone}`;

  // We don't need to fetch a new weather report if we already have one from nearby
  const sameWeatherThresholdMiles = 10;

  if (weatherPool.length > 0) {
    const closestExisting = weatherPool.reduce((a, b) => {
      return distanceBetween(a[0], loc) < distanceBetween(b[0], loc) ? a : b;
    });
    const milesApart = distanceBetween(loc, closestExisting[0]) * kmToMile;
    if (milesApart < sameWeatherThresholdMiles) {
      console.log(
        `Returned cached weather report for ${loc.toString()}. (${milesApart.toFixed(
          1
        )} miles away from ${closestExisting[0].toString()})`
      );
      return closestExisting[1];
    }
  }

  console.log(`Fetching weather for ${loc.toString()}`);

  const weather: Promise<WeatherResponse> = (async () => {
    if (mockWeatherRequests) {
      return await fetchWeatherMock(loc);
    }

    return await fetch(url)
      .then(async (response) => await response.json())
      .then((val) => new WeatherResponse(val));
  })();
  weatherPool.push([loc, weather]);

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

// Haversine formula to get the distance between two points
function distanceBetween(point1: Point, point2: Point): number {
  const earthRadiusKm = 6371;
  const dLat = degToRad(point2.lat - point1.lat);
  const dLng = degToRad(point2.lon - point1.lon);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degToRad(point1.lat)) *
      Math.cos(degToRad(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = earthRadiusKm * c; // Distance in km
  return d;
}

function degToRad(deg: number): number {
  return deg * (Math.PI / 180);
}

async function getBrowserLocation(): Promise<Point> {
  return await new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!navigator.geolocation) {
      // eslint-disable-next-line prefer-promise-reject-errors
      reject("Geolocation is not supported by this browser.");
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const userLocation = new Point(latitude, longitude);
        resolve(userLocation);
      },
      (error) => {
        // eslint-disable-next-line prefer-promise-reject-errors
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
      // Remove suffix from zipcodes of the form 12345-4545
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

function getDesiredCourseCount(): number {
  const desiredCourseCount = parseInt(
    (document.getElementById("desiredCourseCount") as HTMLInputElement).value
  );

  const minCourses = 1;
  const maxCourses = 20;
  return Math.max(Math.min(desiredCourseCount, maxCourses), minCourses);
}

async function nearestCourses(): Promise<void> {
  const loc = await getUserLocation();
  if (!loc) {
    return;
  }

  console.log(`Determining weather at courses near ${loc.toString()}`);

  void fetchCourses()
    .then(async (courses) => {
      courses = courses.filter((course) => course.numHoles >= 18);
      courses.forEach(
        (course) =>
          (course.distanceAwayKm = distanceBetween(course.location, loc))
      );
      courses.sort((c1, c2) => c1.distanceAwayKm - c2.distanceAwayKm);
      const n = getDesiredCourseCount();
      courses = courses.slice(0, n);

      await Promise.all(
        courses.map(async (course) => {
          await fetchWeather(course.location).then((weather) => {
            course.setWeatherScore(calcWeatherScore(weather));
          });
        })
      );

      courses.sort(
        (c1, c2) => c2.getWeatherScore().score - c1.getWeatherScore().score
      );

      // Update displayedCourses with the fetched and initially sorted courses
      displayedCourses = courses;
      return courses;
    })
    // Pass displayedCourses to updateCoursesTable
    .then(() => updateCoursesTable(displayedCourses));

  updateSunsetTime(loc);
}

function updateCoursesTable(courses: DiscGolfCourse[]): void {
  const table = document
    .getElementById("nearbyCourses")
    ?.getElementsByTagName("tbody")[0];
  if (table == null) {
    return;
  }

  // Clear existing courses
  table.innerHTML = "";

  for (const course of courses) {
    const newRow = table.insertRow();
    newRow.insertCell().innerHTML = course.name;

    const scoreCell = newRow.insertCell();
    scoreCell.innerHTML = course.getWeatherScore().score.toFixed(1);
    scoreCell.addEventListener("click", (event: Event) => {
      const clickedCell = event.target as HTMLTableCellElement;

      if (!clearInfoPopups()) {
        const span = document.createElement("span");
        span.textContent = course.getWeatherScore().summary;
        span.className = "more_info";
        clickedCell.appendChild(span);
      }
      event.stopPropagation();
    });

    scoreCell.title = course.getWeatherScore().summary;

    // Round to nearest 5, since the user's zipcode isn't very precise
    newRow.insertCell().innerHTML = (
      Math.round((course.distanceAwayKm * kmToMile) / 5) * 5
    ).toFixed(0);

    newRow.insertCell().innerHTML = course.numHoles.toFixed(0);
  }
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

function clearInfoPopups(): boolean {
  const table = document
    .getElementById("nearbyCourses")
    ?.getElementsByTagName("tbody")[0];
  if (table == null) {
    return false;
  }

  let removedAny = false;
  for (const row of table.rows) {
    for (const childCell of row.cells) {
      const childElement = childCell.querySelector(".more_info") as HTMLElement;
      if (childElement) {
        const duration_ms = 150;
        childElement.style.animation = `fadeOut linear ${duration_ms}ms`;
        setTimeout(() => {
          childCell.removeChild(childElement);
        }, duration_ms);
        removedAny = true;
      }
    }
  }

  return removedAny;
}

function toCourse(line: string): DiscGolfCourse {
  const delimiter = ",";
  const sp = line.split(delimiter);
  return new DiscGolfCourse(
    sp[0],
    parseInt(sp[1]),
    new Point(parseFloat(sp[2]), parseFloat(sp[3]))
  );
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

  // Make sure the CSV is downloaded fresh at least every week (not cached)
  // by making the URL unique
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
  document.addEventListener("click", clearInfoPopups);
  document.addEventListener("touchStart", clearInfoPopups);

  (document.getElementById("userLatLon") as HTMLInputElement).value = (
    await getBrowserLocation().catch((_err) => new Point(33.6458, -82.2888))
  ).toString();

  const nearestCoursesButton = document.getElementById("nearestCoursesButton");
  nearestCoursesButton?.addEventListener("click", nearestCourses);

  const locationInputBox = document.getElementById(
    "userLatLon"
  ) as HTMLInputElement;
  locationInputBox?.addEventListener("change", onLocationUpdated);

  const tableHeaders = document
    .getElementById("nearbyCourses")
    ?.getElementsByTagName("thead")[0]
    ?.getElementsByTagName("th");

  if (tableHeaders) {
    const columnMappings = ["name", "score", "distance", "holes"];
    for (let i = 0; i < tableHeaders.length; i++) {
      const header = tableHeaders[i];
      const columnName = columnMappings[i];
      if (columnName) {
        header.dataset.column = columnName;
        header.addEventListener("click", () => sortCourses(columnName));
      }
    }
  }
}

void pageInit();
