'use strict';

const form = document.querySelector('.form');
const formRows = Array.prototype.slice.call(
  document.querySelectorAll(`.form__row`)
);

const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

const popupWrapper = document.querySelector(`.popup--wrapper`);

// initializing CLASSES
class Workout {
  id = Date.now() + '';
  date = new Date();
  marker;
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; // in km
    this.duration = duration; // in min
  }
  _makeDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  _changeIdAndDate(id, date) {
    this.id = id;
    this.date = date;
  }
}
class Running extends Workout {
  type = 'running';
  markerType = L.icon({
    iconUrl: `./img/running-pin${darkThemeMq.matches ? `-dark` : ``}.png`,
    iconSize: [280 / 12, 570 / 12],
    iconAnchor: [11, 44],
    popupAnchor: [0.33, -46],
  });
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._makeDescription();
  }
  // min/km
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  markerType = L.icon({
    iconUrl: `./img/cycling-pin${darkThemeMq.matches ? `-dark` : ``}.png`,
    iconSize: [280 / 12, 570 / 12],
    iconAnchor: [11, 44],
    popupAnchor: [0.33, -46],
  });
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._makeDescription();
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

  #workouts = [];

  constructor() {
    this.globalEvent;
    this.#getPosition();

    // load workouts from local storage
    this.#loadWorkouts();

    // changing type of workout
    inputType.addEventListener('change', this.#toggleElevationField);

    // Listener of submiting the form
    form.addEventListener('submit', this.#newWorkout.bind(this));

    popupWrapper.addEventListener(
      'click',
      function (e) {
        if (e.target.classList.contains('popup-yes')) {
          this.#removeWorkout(this.globalEvent);
          this.#hidePopupForm();
        }
        if (
          e.target.classList.contains('popup-no') ||
          e.target.classList.contains('popup--wrapper')
        ) {
          this.#hidePopupForm();
        }
      }.bind(this)
    );

    // On esc click close form
    document.addEventListener(
      'keydown',
      function (e) {
        if (e.key === 'Escape') this.#hideForm(false);
        if (e.key === '`') {
        }
      }.bind(this)
    );

    // On workout click move to him on map
    containerWorkouts.addEventListener(
      'click',
      function (e) {
        if (e.target.classList.contains('workout__edit')) {
          const element = e.target.closest('.workout');
          const workout = this.#workouts.find(
            el => el.id === element.dataset.id
          );
          const editFormHTML = this.#swapToEditHTML(workout);
          let doc = new DOMParser().parseFromString(editFormHTML, 'text/html');
          console.log(doc.body.children[0]);
          console.log(element);
          console.log(workout);
          element.parentNode.replaceChild(doc.body.children[0], element);

          document
            .querySelector(`.w--form`)
            .addEventListener('click', function (e) {
              console.log(e);
            });

          return;
        }

        if (e.target.classList.contains('workout__delete')) {
          this.#showPopupForm();
          this.globalEvent = e;
          return;
        }

        if (!e.target.closest('.workout')?.classList.contains('w--form')) {
          this.#moveToPopup(e);
        }
      }.bind(this)
    );
  }

  // Edit Functions
  #swapToEditHTML(workout) {
    return `
    <li class="workout workout--${workout.type} w--form">
      <span class="workout__title">
        <h2>${workout.description}</h2>
        <span class="edit--control">
          <span class="icon icon--accept"
            ><ion-icon name="checkmark-done"></ion-icon
          ></span>
          <span class="icon icon--decline"
            ><ion-icon name="close"></ion-icon
          ></span>
        </span>
      </span>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
        }</span>
        <input type="text" class="workout--edit--input" name="" />
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <input type="text" class="workout--edit--input" name="" />
      </div>
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${
          workout.type === 'running'
            ? workout.pace.toFixed(1)
            : workout.speed.toFixed(1)
        }</span>
        <span class="workout__unit">${
          workout.type === 'running' ? 'min/km' : 'km/h'
        }</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <input type="text" class="workout--edit--input" name="" />
      </div>
    </li>
    `;
  }

  //////////////////////////
  // Popup Functions
  #moveToPopup(e) {
    const htmlWorkout = e.target.closest('.workout');

    if (!htmlWorkout) return;

    const workout = this.#workouts.find(el => el.id === htmlWorkout.dataset.id);
    this.#map.flyTo(workout.coords, 15);
  }

  #showPopupForm() {
    popupWrapper.classList.remove('hidden');
    setTimeout(
      () =>
        document.querySelector(`.delete--popup`).classList.add('popup--active'),
      10
    );
  }

  #hidePopupForm() {
    this.globalEvent = null;
    document.querySelector(`.delete--popup`).classList.remove('popup--active');
    setTimeout(() => popupWrapper.classList.add('hidden'), 200);
  }

  //////////////////////////
  // Map Functions
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
      // `https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png`,
      `https://tiles.stadiamaps.com/tiles/alidade_smooth${
        darkThemeMq.matches ? '_dark' : ''
      }/{z}/{x}/{y}{r}.png`,
      // 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        minZoom: 4,
        maxZoom: 18,
      }
    ).addTo(this.#map);

    L.marker(coords, { icon: currentPosMarker }).addTo(this.#map);
    this.#map.on('click', this.#showForm.bind(this));
    this.#workouts.forEach(el => this.#renderWorkoutMarker(el));
  }

  //////////////////////////
  // Form Functions
  #showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  #hideForm(flag) {
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    if (inputType.value === 'cycling') this.#toggleElevationField();
    inputType.value = 'running';

    if (flag) form.style.display = 'none';
    form.classList.add('hidden');

    setTimeout(() => (form.style.display = 'grid'), 100);
  }

  #toggleElevationField() {
    inputCadence.parentElement.classList.toggle('form__row--hidden');
    inputElevation.parentElement.classList.toggle('form__row--hidden');
  }

  //////////////////////////
  // Workout Functions
  #newWorkout(e) {
    e.preventDefault();
    // function helpers
    const checkForNumber = (...arr) => arr.every(el => Number.isFinite(el));
    const checkForPositiveNumber = (...arr) => arr.every(el => el > 0);

    let workout;
    const { lat, lng } = this.#mapEvent.latlng;
    const coords = [lat, lng];
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    if (type === 'running') {
      const cadence = +inputCadence.value;
      console.log();
      if (
        !checkForNumber(distance, duration, cadence) ||
        !checkForPositiveNumber(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Running(coords, distance, duration, cadence);
    }

    if (type === 'cycling') {
      const elevationGain = +inputElevation.value;
      if (
        !checkForNumber(distance, duration, elevationGain) ||
        !checkForPositiveNumber(distance, duration)
      )
        return alert('Inputs have to be positive numbers! Except "Elev Gain"');

      workout = new Cycling(coords, distance, duration, elevationGain);
    }
    this.#saveWorkout(workout);
    this.#renderWorkoutMarker(workout);
    this.#renderWorkout(workout);
    this.#hideForm(true);
  }
  #renderWorkoutMarker(workout) {
    L.marker(workout.coords, { icon: workout.markerType })
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }
  #renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <span class="workout__title">
      <h2>${workout.description}</h2>
      <span class="workout__features">
        <span class="icon__edit"
        ><ion-icon class="workout__edit" name="pencil"></ion-icon
        ></span>
        <span class="icon__delete"
        ><ion-icon class="workout__delete" name="trash"></ion-icon
        ></span>
      </span>
    </span>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>`;

    if (workout.type === 'running') {
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
    </li>`;
    }

    if (workout.type === 'cycling') {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
      `;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  #saveWorkout(workout) {
    this.#workouts.push(workout);
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  #loadWorkouts() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;
    let workout;
    data.forEach(
      function (el) {
        if (el.type === 'running') {
          // prettier-ignore
          workout = new Running(el.coords, el.distance, el.duration, el.cadence);
        }
        if (el.type === 'cycling') {
          // prettier-ignore
          workout = new Cycling(el.coords, el.distance, el.duration, el.elevationGain);
        }
        workout._changeIdAndDate(el.id, el.date);
        this.#workouts.push(workout);
      }.bind(this)
    );
    this.#workouts.forEach(el => this.#renderWorkout(el));
  }
  #removeWorkout(e) {
    // Initialize nedded variables
    const workout = this.#workouts.find(
      el => el.id === e.target.closest('.workout').dataset.id
    );
    const data = JSON.parse(localStorage.getItem('workouts'));
    const DOM = document.querySelectorAll(`.workout`);
    const index = data.findIndex(el => el.id === workout.id);

    // Remove workout from DOM, localStorage and #workouts array
    const HTMLElement = DOM[this.#workouts.length - index - 1];

    // Styles for delete animation
    HTMLElement.style.marginBottom = `-${HTMLElement.offsetHeight}px`;
    HTMLElement.classList.add('workout__delete');
    setTimeout(() => {
      HTMLElement.remove();
    }, 300);

    this.#workouts.splice(index, 1);
    data.splice(index, 1);

    // Change local Storage
    localStorage.setItem('workouts', JSON.stringify(data));

    // Remove marker
    const latlng = {
      lat: workout.coords[0],
      lng: workout.coords[1],
    };
    this.#map.eachLayer(
      function (layer) {
        if (JSON.stringify({ ...layer._latlng }) === JSON.stringify(latlng)) {
          this.#map.removeLayer(layer);
        }
      }.bind(this)
    );
  }
}

const app = new App();
// localStorage.clear();
