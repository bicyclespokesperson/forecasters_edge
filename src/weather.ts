const mockWeatherRequests = true;

const maxDecimalPlaces = 4;

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

class DiscGolfCourse {
  private weatherScore = 1;

  public distanceAwayKm = NaN;

  constructor(
    public name: string,
    public city: string,
    public numHoles: number,
    public location: Point
  ) {}

  public setWeatherScore(weatherScore: number): void {
    if (weatherScore < 0 || weatherScore > 10) {
      throw new Error("Weather score must be between 0 and 10");
    }
    this.weatherScore = weatherScore;
  }

  public getWeatherScore(): number {
    return this.weatherScore;
  }

  public toString(): string {
    return `${this.name},${this.city},${
      this.numHoles
    },${this.location.toString()},${this.weatherScore}`;
  }
}

function calcWeatherScore(weather: WeatherResponse): number {
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

  // Calculate how far into the hours array to look for the forecasted hourly weather
  const offsetHours = Math.floor(
    (roundStartTime.valueOf() - weatherStartTime.valueOf()) / (1000 * 60 * 60)
  );

  if (offsetHours >= weather.hourly.precipitation_probability.length) {
    throw new Error(
      `Insufficient weather data. Needed ${offsetHours + 1} hours, got ${weather.hourly.precipitation_probability.length}.`
    );
  }

  // Calculate the weather score
  const result =
    (100 - weather.hourly.precipitation_probability[offsetHours]) / 10;
  console.log(`Weather score after ${offsetHours} hours: ${result}`);
  return result;
}

const weatherPool: Array<[Point, WeatherResponse]> = [];

async function fetchWeather(loc: Point): Promise<WeatherResponse> {
  const timezone = "auto";

  // Use Open-Meteo API to fetch the weather forecast for a particular location
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&hourly=temperature_2m,precipitation_probability,precipitation,windspeed_10m&temperature_unit=fahrenheit&forecast_days=1&timezone=${timezone}`;

  // We don't need to fetch a new weather report if we already have one from nearby
  const sameWeatherThresholdKm = 20;
  const existing = weatherPool.find((elem) => {
    return distanceBetween(elem[0], loc) < sameWeatherThresholdKm;
  });
  if (existing !== undefined) {
    console.log(`Returned cached weather report for ${loc.toString()}`);
    return existing[1];
  }

  const weather: WeatherResponse = await (async () => {
    if (mockWeatherRequests) {
      return await fetchWeatherMock(loc);
    }

    return await fetch(url)
      .then(async (response) => await response.json())
      .then((val) => new WeatherResponse(val));
  })();

  weatherPool.push([loc, weather]);
  return weather;
}

async function fetchWeatherMock(_p: Point): Promise<WeatherResponse> {
  // const filePath = "data/sample_weather_response.json";
  const filePath = "data/sample_weather_response_2.json";
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

// TODO: Validation (maybe set textbox background to red for bad data)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function onLatLonUpdated(): void {
  const inputBox = document.getElementById("userLatLon") as HTMLInputElement;

  const [newLat, newLon] = inputBox.value.split(",");
  const p = new Point(parseFloat(newLat), parseFloat(newLon));

  if (
    countDecimalPlaces(newLat) > maxDecimalPlaces ||
    countDecimalPlaces(newLon) > maxDecimalPlaces
  ) {
    inputBox.value = p.toString();
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

function getUserLocation(): Point {
  const [newLat, newLon] = (
    document.getElementById("userLatLon") as HTMLInputElement
  ).value.split(",");
  return new Point(parseFloat(newLat), parseFloat(newLon));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function nearestCourses(): Promise<void> {
  const loc = getUserLocation();
  console.log(`Determining weather at courses near ${loc.toString()}`);

  void fetchCourses()
    .then(async (courses) => {
      courses = courses.filter((course) => course.numHoles >= 18);
      courses.forEach(
        (course) =>
          (course.distanceAwayKm = distanceBetween(course.location, loc))
      );
      courses.sort((c1, c2) => c1.distanceAwayKm - c2.distanceAwayKm);
      const n = 10;
      courses = courses.slice(0, n);

      await Promise.all(
        courses.map(async (course) => {
          await fetchWeather(course.location).then((weather) => {
            console.log(`Got weather for: ${course.name}`);
            course.setWeatherScore(calcWeatherScore(weather));
          });
        })
      );

      courses.sort((c1, c2) => c2.getWeatherScore() - c1.getWeatherScore());

      return courses;
    })
    .then(updateCoursesTable);
}

function updateCoursesTable(courses: DiscGolfCourse[]): void {
  const kmToMile = 0.621371;

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
    const c1 = newRow.insertCell();
    c1.innerHTML = course.name;

    const c2 = newRow.insertCell();
    c2.innerHTML = course.numHoles.toFixed(0);

    const c3 = newRow.insertCell();
    c3.innerHTML = (course.distanceAwayKm * kmToMile).toFixed(1);

    const c4 = newRow.insertCell();
    c4.innerHTML = course.getWeatherScore().toString();
  }
}

function toCourse(line: string): DiscGolfCourse {
  const delimiter = ",";
  const sp = line.split(delimiter);
  return new DiscGolfCourse(
    sp[0],
    sp[1],
    parseInt(sp[5]),
    new Point(parseFloat(sp[7]), parseFloat(sp[8]))
  );
}

async function fetchCourses(): Promise<DiscGolfCourse[]> {
  const filePath = "data/usa_courses.csv";

  const courses: Promise<DiscGolfCourse[]> = fetch(filePath)
    .then(async (response) => await response.text())
    .then((data) => {
      const lines = data.split("\n");
      lines.shift();
      return lines.map(toCourse);
    });

  return await courses;
}

async function pageInit(): Promise<void> {
  await getBrowserLocation()
    .then((loc) => {
      (document.getElementById("userLatLon") as HTMLInputElement).value =
        loc.toString();
    })
    .catch((_err) => {
      (document.getElementById("userLatLon") as HTMLInputElement).value =
        new Point(45, -122).toString();
    });
}

void pageInit();
