
class Point {
  constructor(public lat: number, public lon: number) {}
  
  toString(): string {
    return `(${this.lat}, ${this.lon})`;
  }
}

class DiscGolfCourse {
  private weatherScore: number = 1;

  public distanceAwayKm: number = NaN;

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
    return `${this.name},${this.city},${this.numHoles},${this.location},${this.weatherScore}`;
  }
}

function updateValue() {
  var newLat = (<HTMLInputElement>document.getElementById("userLatitude")).value;
  var newLon = (<HTMLInputElement>document.getElementById("userLongitude")).value;
  let p = new Point(parseFloat(newLat), parseFloat(newLon));
  console.log("New value is: " + p.toString());
}

// Haversine formula to get the distance between two points
function distanceBetween(point1: Point, point2: Point): number {
  const earth_radius_km = 6371;
  const dLat = degToRad(point2.lat - point1.lat);
  const dLng = degToRad(point2.lon - point1.lon);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degToRad(point1.lat)) * Math.cos(degToRad(point2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = earth_radius_km * c; // Distance in km
  return d;
}

function degToRad(deg: number): number {
  return deg * (Math.PI / 180)
}

function getUserLocation(): Promise<Point> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject('Geolocation is not supported by this browser.');
      return;
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

getUserLocation().then((loc) => {
  (<HTMLInputElement>document.getElementById("userLatitude")).value = `${loc.lat}`;
  (<HTMLInputElement>document.getElementById("userLongitude")).value = `${loc.lon}`;
}).catch((_err) => {
  (<HTMLInputElement>document.getElementById("userLatitude")).value = '45';
  (<HTMLInputElement>document.getElementById("userLongitude")).value = '-122';
});

function readUserLocation() {
  var newLat = (<HTMLInputElement>document.getElementById("userLatitude")).value;
  var newLon = (<HTMLInputElement>document.getElementById("userLongitude")).value;
  return new Point(parseFloat(newLat), parseFloat(newLon));
}

function nearestCourses() {
  const loc = readUserLocation();
  
  fetchCourses().then((courses) => {
    courses = courses.filter(course => course.numHoles >= 18);
    courses.forEach(course => course.distanceAwayKm = distanceBetween(course.location, loc));
    courses.sort((c1, c2) => c1.distanceAwayKm - c2.distanceAwayKm);
    const n = 10;
    return courses.slice(0, n);
  }).then(updateCoursesTable);
}

function updateCoursesTable(courses: DiscGolfCourse[]) {
  const kmToMile = 0.621371;
  
  const table = document.getElementById("nearbyCourses");
  if (!table) {
    return;
  }
  
  // Clear existing courses
  table.getElementsByTagName("tbody")[0].innerHTML = "";

  for (let course of courses) {
    const row = document.createElement("tr");

    const name = document.createElement("td");
    name.textContent = course.name;
    row.appendChild(name);

    const numHoles = document.createElement("td");
    numHoles.textContent = course.numHoles.toFixed(0);
    row.appendChild(numHoles);

    const distanceAway = document.createElement("td");
    distanceAway.textContent = (course.distanceAwayKm * kmToMile).toFixed(1);
    row.appendChild(distanceAway);

    table.appendChild(row);
  }
}

function toCourse(line: string): DiscGolfCourse {
  const delimiter = ',';
  const sp = line.split(delimiter);
  return new DiscGolfCourse(sp[0], sp[1], parseInt(sp[5]), new Point(parseFloat(sp[7]), parseFloat(sp[8])));
}

async function fetchCourses(): Promise<DiscGolfCourse[]> {
  const filePath = 'data/usa_courses.csv';

  let courses: Promise<DiscGolfCourse[]> = fetch(filePath)
    .then(response => response.text())
    .then(data => {
      let lines = data.split('\n');
      lines.shift();
      return lines.map(toCourse)
    });
  
  return courses;
}

