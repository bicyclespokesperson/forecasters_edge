const mockWeatherRequests = false;

const kmToMile = 0.621371;
const maxDecimalPlaces = 3;

const weatherPool: Array<[Point, WeatherResponse]> = [];
const zipcodeLocations = new Map<string, Point>();

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

function calcWeatherScore(weather: WeatherResponse, name?: string): number {
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
  const minBestTemperatureF = 48;
  const maxBestTemperatureF = 90;
  const maxBestWindSpeedMPH = 30;

  // This is the probability of 0.1mm of rain. This means it's too high,
  // squaring the percentage gives a better estimate.
  const precipProbabilityScore =
    (1 - Math.pow(precipProbability / 100, 2)) * 10;

  // Any precipitation means there will be substantial rain
  // TODO: Maybe there should be some sort of bonus for a 0 precip score
  const precipScore = precip === 0 ? 10 : Math.max(1, 6 - 10 * precip);
  const tempPenalty =
    (Math.max(minBestTemperatureF - temperature, 0) +
      Math.max(temperature - maxBestTemperatureF, 0)) /
    3;

  const windPenalty = Math.max(windSpeed - maxBestWindSpeedMPH, 0) / 2;
  const result = Math.max(
    Math.min(precipScore, precipProbabilityScore) - tempPenalty - windPenalty,
    1
  );

  // Calculate the weather score
  console.log(
    `Weather score ${offsetHours} hours after midnight for ${name}: min((${precipScore.toFixed(
      2
    )} precip score), (${precipProbabilityScore.toFixed(
      2
    )} precip probability score)) - (${tempPenalty.toFixed(
      2
    )} temperature score) - (${windPenalty.toFixed(
      2
    )} wind score) = ${result.toFixed(2)}`
  );
  return result;
}

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
  console.log(`Fetching weather for ${loc.toString()}`);

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
            course.setWeatherScore(calcWeatherScore(weather, course.name));
          });
        })
      );

      courses.sort((c1, c2) => c2.getWeatherScore() - c1.getWeatherScore());

      return courses;
    })
    .then(updateCoursesTable);
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

    newRow.insertCell().innerHTML = course.getWeatherScore().toFixed(1);

    newRow.insertCell().innerHTML = (course.distanceAwayKm * kmToMile).toFixed(
      1
    );

    newRow.insertCell().innerHTML = course.numHoles.toFixed(0);
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
    .then((contents) => {
      const lines = contents.split("\n");
      lines.shift();
      return lines.map(toCourse);
    });

  return await courses;
}

async function pageInit(): Promise<void> {
  (document.getElementById("userLatLon") as HTMLInputElement).value = (
    await getBrowserLocation().catch((_err) => new Point(33.6458, -82.2888))
  ).toString();
}

void pageInit();
