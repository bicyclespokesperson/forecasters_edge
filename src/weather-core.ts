import suncalc from "suncalc";

const { getTimes } = suncalc;

// Unused in core module, but kept for compatibility
const mockWeatherRequests = false;
const kmToMile = 0.621371;
const maxDecimalPlaces = 3;

export class WeatherResponse {
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

export class Point {
  constructor(public lat: number, public lon: number) {}

  toString(): string {
    return `${this.lat.toFixed(maxDecimalPlaces)}, ${this.lon.toFixed(
      maxDecimalPlaces
    )}`;
  }
}

export class WeatherScore {
  constructor(
    public score: number,
    public summary: string,
    public breakdown: { [key: string]: number }
  ) {}
}

export class DiscGolfCourse {
  private weatherScore: WeatherScore | undefined = undefined;
  public distanceAwayKm = NaN;
  public marker: any = undefined;

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

export function calcWeatherScore(
  weather: WeatherResponse,
  startHour: number
): WeatherScore {
  const weatherStartTime = new Date(weather.hourly.time[0]);

  if (!(startHour >= 0 && startHour <= 23)) {
    throw new Error("Invalid start hour");
  }

  const roundStartTime = new Date(weatherStartTime.valueOf());
  roundStartTime.setHours(startHour);
  roundStartTime.setMinutes(0);
  roundStartTime.setSeconds(0);
  roundStartTime.setMilliseconds(0);

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

  const minBestTemperatureF = 45;
  const maxBestTemperatureF = 82;
  const maxBestWindSpeedMPH = 25;

  const precipProbabilityScore = (1 - precipProbability / 100) * 2.5;
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

  const breakdown = {
    Precipitation: Math.max(100 - precipProbability, 0),
    Temperature: Math.max(100 - tempPenalty * 10, 0),
    Wind: Math.max(100 - windPenalty * 5, 0),
    Overall: score * 10,
  };

  return new WeatherScore(score, components + "\n\n" + formula, breakdown);
}

export function distanceBetween(point1: Point, point2: Point): number {
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
  const d = earthRadiusKm * c;
  return d;
}

function degToRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function toCourse(line: string): DiscGolfCourse {
  const delimiter = ",";
  const sp = line.split(delimiter);
  return new DiscGolfCourse(
    sp[0],
    parseInt(sp[1]),
    new Point(parseFloat(sp[2]), parseFloat(sp[3]))
  );
}

export function selectDefaultStartTime(currentDate: Date): string {
  const dayOfWeek = currentDate.getDay();
  const currentHour = currentDate.getHours();

  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    return "17";
  } else {
    const nextHour = (currentHour + 1) % 24;
    return nextHour.toString();
  }
}
