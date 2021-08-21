'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// Detecting light or dark theme
const darkThemeMq = window.matchMedia('(prefers-color-scheme: dark)');

// FUNCTIONS
const clearInputs = function () {
  inputCadence.value =
    inputDistance.value =
    inputDuration.value =
    inputElevation.value =
      '';
  inputType.value = 'running';
};

// initializing CLASSES
class Workout {
  id = Number(Date.now() + '');
  date = new Date().toISOString();
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; // in km
    this.duration = duration; // in min
  }
}
class Running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
  }
  // min/km
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
  }
  // km/h
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  #map;
  #mapEvent;
  constructor() {
    this.#getPosition();

    // changing type of workout
    inputType.addEventListener('change', this.#toggleElevationField);

    // Listener of submiting the form
    form.addEventListener('submit', this.#newWorkout.bind(this));
  }

  #getPosition() {
    navigator.geolocation.getCurrentPosition(
      position => this.#loadMap(position),
      function () {
        alert(`Please enable geolocation`);
      }
    );
  }
  #loadMap(position) {
    const [latitude, longitude] = [
      position.coords.latitude,
      position.coords.longitude,
    ];
    const coords = [latitude, longitude];
    this.#map = L.map('map', {
      scrollWheelZoom: false,
      smoothWheelZoom: true,
      smoothSensitivity: 2,
    }).setView(coords, 15);
    L.tileLayer(
      `https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png`,
      // `https://tiles.stadiamaps.com/tiles/alidade_smooth${
      //     darkThemeMq.matches ? '_dark' : ''
      //   }/{z}/{x}/{y}{r}.png`,
      {
        minZoom: 4,
        maxZoom: 18,
      }
    ).addTo(this.#map);

    L.marker(coords, { icon: currentPosMarker }).addTo(this.#map);
    this.#map.on('click', this.#showForm.bind(this));
  }
  #showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  #toggleElevationField() {
    inputCadence.parentElement.classList.toggle('form__row--hidden');
    inputElevation.parentElement.classList.toggle('form__row--hidden');
  }
  #newWorkout(e) {
    e.preventDefault();
    this.#renderWorkoutMarker(
      this.#mapEvent,
      inputType.value,
      `Roman Hrynevych`
    );
    clearInputs();
    form.classList.add('hidden');
  }
  #renderWorkoutMarker(mapEvent, type, content) {
    if (type === 'running') type = runningMarker;
    else type = cyclingMarker;
    const { lat, lng } = mapEvent.latlng;
    L.marker([lat, lng], { icon: type })
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${type === runningMarker ? `run-popup` : `cycl-popup`}`,
        })
      )
      .setPopupContent(content)
      .openPopup();
  }
}

const app = new App();
