<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

import axios from "axios";
const SERVER_ADDRESS = process.env.VUE_APP_SERVER_ADDRESS;

const dataGetter = ref(null as number | null);

async function getFromServer(name: string) {
  try {
    const res = await axios.get(`${SERVER_ADDRESS}/input/${name}`);
    return res.data;
  } catch (error) {
    return null;
  }
}
async function updateServer(name: string, value: Object) {
  try {
    await axios.patch(`${SERVER_ADDRESS}/output/${name}`, value);
  } catch (error) {
    // console.log(error);
  }
}

/*Switching device*/
const isSwitchedOn = ref(false);

function switchOn() {
  if (isSwitchedOn.value) return;
  sendMessage("Włączono urządzenie.");
  isSwitchedOn.value = true;
}
async function switchOff() {
  if (!isSwitchedOn.value) return;

  await updateServer("", {
    msg: {
      text: "Wyłączono urządzenie.",
      date: getFormattedDate(),
    },
    currentLocation: { lat: NaN, lng: NaN },
  });

  isSwitchedOn.value = false;
  if (messageInterval.value) clearInterval(messageInterval.value);
  messageInterval.value = null;
  if (temperatureRegulator.value) clearInterval(temperatureRegulator.value);
  temperatureRegulator.value = null;
  if (flightInterval.value) clearInterval(flightInterval.value);
  flightInterval.value = null;
  if (dataGetter.value) clearInterval(dataGetter.value);
  dataGetter.value = null;
}

function putRightCard() {
  if (!isSwitchedOn.value) return;
  sendMessage("Poprawny odczyt karty. Drzwi otwarte.");
}
function putWrongCard() {
  if (!isSwitchedOn.value) return;
  sendMessage("Błędny odczyt karty!");
}

/*Flight*/
const flightInterval = ref(null as number | null);
const flightTime = 60; // [messageRate]
const targetPosition = ref({
  lat: 52.2,
  lng: 21,
});
const currentPosition = ref({
  lat: 52.203,
  lng: 21.001,
});

async function startFlight() {
  if (!isSwitchedOn.value) return;

  if (flightInterval.value) clearInterval(flightInterval.value);
  let secs = 0;
  flightInterval.value = setInterval(() => {
    secs++;
    if (secs < flightTime) {
      currentPosition.value.lat +=
        (targetPosition.value.lat - currentPosition.value.lat) /
        (flightTime - secs);
      currentPosition.value.lng +=
        (targetPosition.value.lng - currentPosition.value.lng) /
        (flightTime - secs);
    } else {
      currentPosition.value = { ...targetPosition.value };
      stopFlight();
    }
  }, messageRate);

  await updateServer("", {
    targetLocation: targetPosition.value,
    msg: {
      text: "Podróż rozpoczęta.",
      date: getFormattedDate(),
    },
  });
}
async function stopFlight() {
  if (!isSwitchedOn.value) return;
  if (flightInterval.value) clearInterval(flightInterval.value);
  flightInterval.value = null;
  sendMessage("Podróż zakończona.");
}

/*GPS*/
const isSignalGPS = ref(true);

function loseSignalGPS() {
  if (!isSwitchedOn.value || !isSignalGPS.value) return;
  sendMessage("Utracono sygnał GPS!");
  isSignalGPS.value = false;
}
function restoreSignalGPS() {
  if (!isSwitchedOn.value || isSignalGPS.value) return;
  sendMessage("Przywrócono sygnał GPS.");
  isSignalGPS.value = true;
}

/*Data transmition*/
const temperatureRegulator = ref(null as number | null);
const regulationTime = 10000;
const targetTemperature = ref(0);
const realTemperature = ref(20);
const temperatureOscillationsAmplitude = ref(0);
const wibrationLevel = ref(0);
const wibrationLevelOscillationsAmplitude = ref(0);

function startPublishing() {
  if (!isSwitchedOn.value) return;

  const startTime = Math.floor(new Date().getTime() / 1000);
  sendData(startTime);
  if (!messageInterval.value) {
    messageInterval.value = setInterval(async () => {
      sendData(startTime);
    }, messageRate);
  }
}
async function stopPublishing() {
  if (messageInterval.value) {
    clearInterval(messageInterval.value);
    messageInterval.value = null;
    await updateServer("", {
      currentLocation: { lat: NaN, lng: NaN },
    });
  }
}
async function sendData(startTime: number) {
  const currentTime = new Date().getTime() / 1000;
  const secs = Math.floor(currentTime) - startTime;
  const randCosDist1 = (Math.asin(2 * Math.random() - 1) * 2) / Math.PI;
  const temperature =
    realTemperature.value +
    temperatureOscillationsAmplitude.value * randCosDist1;
  const randCosDist2 = (Math.asin(2 * Math.random() - 1) * 2) / Math.PI;
  const wibration =
    wibrationLevel.value +
    wibrationLevelOscillationsAmplitude.value * randCosDist2;
  const currentLocation = isSignalGPS.value
    ? currentPosition.value
    : { lat: NaN, lng: NaN };

  await updateServer("", {
    temperature: { time: secs, value: temperature },
    wibration: { time: secs, value: wibration },
    currentLocation: currentLocation,
  });
}

/*Messages*/
const messageInterval = ref(null as number | null);
const messageRate = 1000; // [ms]

async function sendMessage(text: string) {
  await updateServer("", {
    msg: {
      text: text,
      date: getFormattedDate(),
    },
  });
}
function getFormattedDate() {
  const currentTime = new Date();
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const seconds = currentTime.getSeconds();
  let date = "";
  if (hours < 10) date += "0";
  if (hours == 1) date += "0:";
  else date += hours.toString() + ":";
  if (minutes < 10) date += "0";
  if (minutes == 1) date += "0:";
  else date += minutes.toString() + ":";
  if (seconds < 10) date += "0";
  if (seconds == 1) date += "0";
  else date += seconds.toString();

  return date;
}

onMounted(() => {
  updateServer("", {
    msg: {
      text: "",
      date: "",
    },
    temperature: { time: NaN, value: NaN },
    wibration: { time: NaN, value: NaN },
    currentLocation: { lat: NaN, lng: NaN },
    targetLocation: { lat: NaN, lng: NaN },
  });

  if (!dataGetter.value) {
    dataGetter.value = setInterval(async () => {
      const data = await getFromServer("");
      if (data === null) return;
      targetTemperature.value = parseFloat(data.setTemperature.value);
      if (!isSwitchedOn.value || temperatureRegulator.value) return;

      temperatureRegulator.value = setInterval(() => {
        if (!isNaN(targetTemperature.value))
          realTemperature.value +=
            (messageRate / regulationTime) *
            (targetTemperature.value - realTemperature.value);
      }, messageRate);
    }, messageRate);
  }
});
onBeforeUnmount(() => {
  if (messageInterval.value) clearInterval(messageInterval.value);
  if (temperatureRegulator.value) clearInterval(temperatureRegulator.value);
  if (flightInterval.value) clearInterval(flightInterval.value);
  if (dataGetter.value) clearInterval(dataGetter.value);
});
</script>

<template>
  <div class="button-box">
    <button @click="switchOn()">Włącz urządzenie</button>
    <button @click="switchOff()">Wyłącz urządzenie</button>
    <button @click="putRightCard()">Przyłóż właściwą kartę</button>
    <button @click="putWrongCard()">Przyłóż niewłaściwą kartę</button>
    <button @click="startFlight()">Rozpocznij lot</button>
    <button @click="stopFlight()">Zakończ lot</button>
    <button @click="loseSignalGPS()">Przerwij sygnał GPS</button>
    <button @click="restoreSignalGPS()">Przywróć sygnał GPS</button>
    <button @click="startPublishing()">Rozpocznij transmsję</button>
    <button @click="stopPublishing()">Zakończ transmisję</button>
  </div>
  <div class="settings-box">
    <ul>
      <li>
        <label>Temperatura</label>
        <input
          type="range"
          min="-10.0"
          max="40.0"
          step="0.1"
          v-model.number="realTemperature"
        />
      </li>
      <li>
        <label>Poziom wibracji</label>
        <input
          type="range"
          min="0.0"
          max="100.0"
          step="1.0"
          v-model.number="wibrationLevel"
        />
      </li>
      <li>
        <label>Amplituda wahań temperatury</label>
        <input
          type="range"
          min="0.0"
          max="5.0"
          step="0.1"
          v-model.number="temperatureOscillationsAmplitude"
        />
      </li>
      <li>
        <label>Amplituda wahań poziomu wibracji</label>
        <input
          type="range"
          min="0.0"
          max="20.0"
          step="0.1"
          v-model.number="wibrationLevelOscillationsAmplitude"
        />
      </li>
    </ul>
  </div>
  <div class="settings-box">
    <ul>
      <li class="bot">
        <label>Szerokość</label>
        <input
          type="number"
          min="49"
          max="55"
          step="0.00001"
          v-model="targetPosition.lat"
        />
      </li>
      <li class="bot">
        <label>Długość</label>
        <input
          type="number"
          min="14"
          max="24"
          step="0.00001"
          v-model="targetPosition.lng"
        />
      </li>
    </ul>
  </div>
</template>

<style scoped>
div.button-box {
  padding: 1em;
  display: flex;
  place-content: space-between;
  flex-wrap: wrap;
}

div.button-box button {
  padding: 1em;
  width: 180px;
  cursor: pointer;
}

div.settings-box {
  padding: 1em;
  display: flex;
  justify-content: space-evenly;
}

div.settings-box ul {
  list-style: none;
  display: flex;
  flex-flow: column;
}

div.settings-box ul li {
  min-height: 3em;
  max-height: 6em;
  padding: 0.5em;
  display: flex;
  place-content: space-between;
}

div.settings-box ul li.bot {
  min-height: 1em;
  max-height: 6em;
  padding: 0.2em;
  display: flex;
  place-content: space-between;
}

div.settings-box ul li label {
  padding: 15px 0;
}

div.settings-box ul li.bot label {
  padding: 0;
}

div.settings-box ul li input {
  margin-left: 30px;
  cursor: pointer;
}
</style>
