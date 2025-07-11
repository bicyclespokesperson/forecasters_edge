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

export interface WeatherBreakdown {
  precipitation: {
    raw: { mm: number; probability: number };
    penalty: number;
    score: number;
  };
  temperature: {
    raw: { fahrenheit: number };
    penalty: number;
    score: number;
  };
  wind: {
    raw: { mph: number };
    penalty: number;
    score: number;
  };
  overall: number;
}

export interface CourseData {
  ratings: Record<string, number>;
  conditions?: {
    rating: number;
    description: string | null;
    timestamp?: string;
  };
}

export class WeatherScore {
  constructor(public score: number, public breakdown: WeatherBreakdown) {}
}

export class DiscGolfCourse {
  private weatherScore: WeatherScore | undefined = undefined;
  public distanceAwayKm = NaN;
  public marker: any = undefined;
  public courseData: CourseData | undefined = undefined;

  constructor(
    public id: number,
    public name: string,
    public numHoles: number,
    public location: Point
  ) {}

  public setWeatherScore(weatherScore: WeatherScore): void {
    this.weatherScore = weatherScore;
  }

  public setCourseData(courseData: CourseData): void {
    this.courseData = courseData;
  }

  public getCourseData(): CourseData | undefined {
    return this.courseData;
  }

  public getQuality(): number | undefined {
    return this.courseData?.ratings?.quality;
  }

  public getDifficulty(): number | undefined {
    return this.courseData?.ratings?.difficulty;
  }

  public getConditions(): { rating: number; description: string | null; timestamp?: string } | undefined {
    return this.courseData?.conditions;
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

function scorePrecipitation(precipMm: number): number {
  return 10 - Math.max(7.5 - 2.7 * precipMm, 0) * (10 / 7.5);
}

function scorePrecipitationProbability(precipProbability: number): number {
  return 10 - (((1 - precipProbability / 100) * 2.5) / 2.5) * 10;
}

function scoreTemperature(tempF: number): number {
  const minBestTemperatureF = 45;
  const maxBestTemperatureF = 82;
  const penalty =
    (Math.max(minBestTemperatureF - tempF, 0) +
      Math.max(tempF - maxBestTemperatureF, 0)) /
    3;
  return penalty;
}

function scoreWind(windSpeedMph: number): number {
  const maxBestWindSpeedMPH = 25;
  const penalty = Math.max(windSpeedMph - maxBestWindSpeedMPH, 0) / 2;
  return penalty;
}

export function calcWeatherScore(
  weather: WeatherResponse,
  startHour: number,
  conditions?: { rating: number; description: string | null; timestamp?: string }
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

  const precipMm = avgValue(weather.hourly.precipitation, true);
  const precipProbability = avgValue(
    weather.hourly.precipitation_probability,
    true
  );
  const tempF = avgValue(weather.hourly.temperature_2m, false);
  const windSpeedMph = avgValue(weather.hourly.windspeed_10m, true) * kmToMile;

  const precipScore = scorePrecipitation(precipMm);
  const precipProbabilityScore =
    scorePrecipitationProbability(precipProbability);
  const temperatureScore = scoreTemperature(tempF);
  const windScore = scoreWind(windSpeedMph);

  const [precipCoeff, precipProbCoeff, tempCoeff, windCoeff, conditionsCoeff] =
    [0.734011, 0.227356, 0.974824, 0.946542, 1.0];

  const conditionsPenalty = (() => {
    if (!conditions || conditions.rating >= 4) {
      return 0.0;
    }
    if (conditions.rating >= 3) {
      return conditions.rating / 2;
    }
    if (conditions.rating >= 2) {
      return conditions.rating * 1.5;
    }
    return 8 + conditions.rating;
  })();

  const score = Math.max(
    10 -
      precipScore * precipCoeff -
      precipProbabilityScore * precipProbCoeff -
      temperatureScore * tempCoeff -
      windScore * windCoeff -
      conditionsPenalty,
    0
  );

  const breakdown: WeatherBreakdown = {
    precipitation: {
      raw: { mm: precipMm, probability: precipProbability },
      penalty:
        precipScore * precipCoeff + precipProbabilityScore * precipProbCoeff,
      score: 10 - precipScore - precipProbabilityScore,
    },
    temperature: {
      raw: { fahrenheit: tempF },
      penalty: temperatureScore * tempCoeff,
      score: 10 - temperatureScore,
    },
    wind: {
      raw: { mph: windSpeedMph },
      penalty: windScore * windCoeff,
      score: 10 - windScore,
    },
    overall: score,
  };

  return new WeatherScore(score, breakdown);
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
    parseInt(sp[0]),
    sp[1],
    parseInt(sp[2]),
    new Point(parseFloat(sp[3]), parseFloat(sp[4]))
  );
}

export function selectDefaultStartTime(currentDate: Date): string {
  const dayOfWeek = currentDate.getDay();
  const currentHour = currentDate.getHours();

  if (dayOfWeek >= 1 && dayOfWeek <= 5 && currentHour < 16) {
    return "17";
  } else {
    const nextHour = (currentHour + 1) % 24;
    return nextHour.toString();
  }
}
