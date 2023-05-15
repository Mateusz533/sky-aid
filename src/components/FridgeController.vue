<script setup lang="ts">
import { ref, shallowRef, onMounted, onBeforeMount } from "vue";

import * as scatterChartConfig from "./scatterChartConfig";
import { Scatter } from "vue-chartjs";
import {
  Chart,
  ChartData,
  ChartOptions,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from "chart.js";
Chart.register(LinearScale, PointElement, LineElement, Tooltip);

import { Loader } from "@googlemaps/js-api-loader";
const GOOGLE_MAPS_API_KEY = "AIzaSyAnbN24W9SsTUdMxjnwaVP0Htn8OZe4RqE";

import axios from "axios";
const SERVER_ADDRESS = "http://localhost:3000";

const dataGetter = ref(null as number | null);
const isConnected = ref(false);

async function getFromServer(name: string) {
  try {
    const res = await axios.get(`${SERVER_ADDRESS}/output/${name}`);
    if (!isConnected.value) {
      isConnected.value = true;
      addMessage("Połączono z serwerem.");
    }
    return res.data;
  } catch (error) {
    if (isConnected.value) {
      isConnected.value = false;
      addMessage("Utracono połączenie z serwerem!");
    }
    return null;
  }
}
async function updateServer(name: string, value: Object) {
  try {
    await axios.patch(`${SERVER_ADDRESS}/input/${name}`, value);
    if (!isConnected.value) {
      isConnected.value = true;
      addMessage("Połączono z serwerem.");
    }
  } catch (error) {
    if (isConnected.value) {
      isConnected.value = false;
      addMessage("Utracono połączenie z serwerem!");
    }
  }
}

/*Temperature*/
const temperatureChart = shallowRef({
  data: {} as ChartData<"scatter">,
  options: {} as ChartOptions<"scatter">,
});
const temperatureChartKey = ref(0);
const targetTemperature = ref(0);
const maxTemperatureDeviation = ref(0);

async function setTargetTemperature() {
  await updateServer("", {
    setTemperature: {
      value: targetTemperature.value,
    },
  });
}
function setRealTemperature(temperature: { time: number; value: number }) {
  const minTemp = targetTemperature.value - maxTemperatureDeviation.value;
  const maxTemp = targetTemperature.value + maxTemperatureDeviation.value;
  if (temperature.time < 1) {
    temperatureChart.value.data.datasets[0].data = [
      { x: temperature.time, y: temperature.value },
    ];
    temperatureChart.value.data.datasets[1].data = [{ x: 0, y: minTemp }];
    temperatureChart.value.data.datasets[2].data = [{ x: 0, y: maxTemp }];
  } else {
    temperatureChart.value.data.datasets[0].data.push({
      x: temperature.time,
      y: temperature.value,
    });
    temperatureChart.value.data.datasets[1].data = [
      { x: 0, y: minTemp },
      { x: temperature.time, y: minTemp },
    ];
    temperatureChart.value.data.datasets[2].data = [
      { x: 0, y: maxTemp },
      { x: temperature.time, y: maxTemp },
    ];
  }
  temperatureChartKey.value++;

  if (maxTemperatureDeviation.value <= 0) return;
  if (temperature.value > maxTemp)
    addMessage("Temperatura wzrosła powyżej zakresu tolerancji!");
  if (temperature.value < minTemp)
    addMessage("Temperatura spadła poniżej zakresu tolerancji!");
}

/*Wibrations*/
const wibrationChart = shallowRef({
  data: {} as ChartData<"scatter">,
  options: {} as ChartOptions<"scatter">,
});
const wibrationChartKey = ref(0);
const maxWibrationLevel = ref(50);

function setWibrationLevel(wibration: { time: number; value: number }) {
  if (wibration.time < 1) {
    wibrationChart.value.data.datasets[0].data = [
      { x: wibration.time, y: wibration.value },
    ];
    wibrationChart.value.data.datasets[1].data = [
      { x: 0, y: maxWibrationLevel.value },
    ];
  } else {
    wibrationChart.value.data.datasets[0].data.push({
      x: wibration.time,
      y: wibration.value,
    });
    wibrationChart.value.data.datasets[1].data = [
      { x: 0, y: maxWibrationLevel.value },
      { x: wibration.time, y: maxWibrationLevel.value },
    ];
  }
  wibrationChartKey.value++;

  if (wibration.value > maxWibrationLevel.value)
    addMessage("Przekroczono bezpieczny poziom drgań!");
}

/*Map*/
const map = ref(null as google.maps.Map | null);
const paths = ref({
  startLine: null as google.maps.Polyline | null,
  endLine: null as google.maps.Polyline | null,
  startPoint: null as google.maps.Polyline | null,
  endPoint: null as google.maps.Polyline | null,
  currentPointBackground: null as google.maps.Polyline | null,
  currentPointBorder: null as google.maps.Polyline | null,
});
const targetLocation = ref({ lat: Number(), lng: Number() });

function setCurrentLocation(currentLocation: { lat: number; lng: number }) {
  const lostConnection =
    isNaN(currentLocation.lat) ||
    currentLocation.lat === null ||
    isNaN(currentLocation.lng) ||
    currentLocation.lng === null;

  if (lostConnection) {
    paths.value.currentPointBackground?.setOptions({
      strokeColor: "#777777",
    });
  } else {
    const startLocation = paths.value.startPoint
      ?.getPath()
      .getAt(0) as google.maps.LatLng;
    const endLocation = paths.value.endPoint
      ?.getPath()
      .getAt(0) as google.maps.LatLng;
    paths.value.currentPointBorder?.setPath([currentLocation, currentLocation]);
    paths.value.currentPointBackground?.setPath([
      currentLocation,
      currentLocation,
    ]);
    paths.value.startLine?.setPath([startLocation, currentLocation]);
    paths.value.endLine?.setPath([endLocation, currentLocation]);
    paths.value.currentPointBackground?.setOptions({
      strokeColor: "#0000FF",
    });
  }
}
function setTargetLocation(newtargetLocation: { lat: number; lng: number }) {
  if (
    targetLocation.value.lat === newtargetLocation.lat &&
    targetLocation.value.lng === newtargetLocation.lng
  )
    return;

  targetLocation.value = newtargetLocation;
  const currentLocation = paths.value.currentPointBackground
    ?.getPath()
    .getAt(0) as google.maps.LatLng;
  const startLocation = currentLocation;
  paths.value.startLine?.setPath([startLocation, currentLocation]);
  paths.value.endLine?.setPath([newtargetLocation, currentLocation]);
  paths.value.startPoint?.setPath([startLocation, startLocation]);
  paths.value.endPoint?.setPath([newtargetLocation, newtargetLocation]);
  map.value?.setCenter({
    lat: (startLocation.lat() + newtargetLocation.lat) / 2,
    lng: (startLocation.lng() + newtargetLocation.lng) / 2,
  });
  const scope = Math.max(
    Math.abs(startLocation.lat() - newtargetLocation.lat),
    Math.abs(startLocation.lng() - newtargetLocation.lng)
  );
  map.value?.setZoom(7.8 - 1.45 * Math.log(scope));
}

/*Messages*/
const messages = ref(Array({ text: String(), date: String() }));
const messageRate = 1000; // [ms]

function addMessage(text: string, date?: string) {
  messages.value.unshift({
    text: text,
    date: date ? date : getFormattedDate(),
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

onMounted(async () => {
  updateServer("", { setTemperature: { value: null } });
  if (!dataGetter.value) {
    dataGetter.value = setInterval(async () => {
      const data = await getFromServer("");
      if (data === null) return;
      const temperature = data.temperature;
      const wibration = data.wibration;
      const currentLocation = data.currentLocation;
      const targetLocation = data.targetLocation;
      const msg = data.msg;
      if (temperature.time !== null && temperature.value !== null)
        setRealTemperature(temperature);
      if (wibration.time !== null && wibration.value !== null)
        setWibrationLevel(wibration);
      setCurrentLocation(currentLocation);
      if (targetLocation.lat !== null && targetLocation.lng !== null)
        setTargetLocation(targetLocation);
      if (
        messages.value.length === 0 ||
        (msg.text !== messages.value[0].text &&
          msg.date >= messages.value[0].date)
      )
        addMessage(msg.text, msg.date);
    }, messageRate);
  }

  const loader = new Loader({ apiKey: GOOGLE_MAPS_API_KEY });
  await loader.load();
  const position = { lat: 52.203, lng: 21.001 };
  map.value = new google.maps.Map(
    document.getElementById("mapDiv") as HTMLElement,
    {
      center: position,
      zoom: 16,
    }
  );

  const lineOptions = {
    map: map.value,
    strokeOpacity: 0,
    icons: [
      {
        icon: {
          path: "M 0,-1 0,1",
          strokeOpacity: 1,
          scale: 4,
        },
        offset: "0",
        repeat: "20px",
      },
    ],
  };
  const grey = "#777777";
  const blue = "#0000FF";
  const white = "#FFFFFF";
  paths.value.startLine = new google.maps.Polyline({
    path: [position, position],
    strokeColor: grey,
    ...lineOptions,
  });
  paths.value.endLine = new google.maps.Polyline({
    path: [position, position],
    strokeColor: blue,
    ...lineOptions,
  });
  paths.value.startPoint = new google.maps.Polyline({
    map: map.value,
    path: [position, position],
    strokeColor: grey,
    strokeWeight: 10,
  });
  paths.value.endPoint = new google.maps.Polyline({
    map: map.value,
    path: [position, position],
    strokeColor: blue,
    strokeWeight: 10,
  });
  paths.value.currentPointBorder = new google.maps.Polyline({
    map: map.value,
    path: [position, position],
    strokeColor: white,
    strokeWeight: 22,
  });
  paths.value.currentPointBackground = new google.maps.Polyline({
    map: map.value,
    path: [position, position],
    strokeColor: blue,
    strokeWeight: 18,
  });
});
onBeforeMount(() => {
  const temperatureData = {
    datasets: [
      { data: [] },
      JSON.parse(JSON.stringify(scatterChartConfig.dataset)),
      JSON.parse(JSON.stringify(scatterChartConfig.dataset)),
    ],
  };
  let tempOptions = JSON.parse(JSON.stringify(scatterChartConfig.options));
  tempOptions.scales.y.suggestedMin = -10;
  tempOptions.scales.y.suggestedMax = 40;
  tempOptions.scales.y.title.text = "Temperatura [\u00B0C]";
  temperatureChart.value = {
    data: temperatureData,
    options: tempOptions,
  };

  const wibrationData = {
    datasets: [
      { data: [] },
      JSON.parse(JSON.stringify(scatterChartConfig.dataset)),
    ],
  };
  let wibrationOptions = JSON.parse(JSON.stringify(scatterChartConfig.options));
  wibrationOptions.scales.y.suggestedMin = 0;
  wibrationOptions.scales.y.suggestedMax = 100;
  wibrationOptions.scales.y.title.text = "Poziom wibracji [%]";
  wibrationChart.value = {
    data: wibrationData,
    options: wibrationOptions,
  };
});
</script>

<template>
  <header>
    <h1>SkyAid – aktywna medyczna lodówka transportowa dla dronów</h1>
  </header>
  <div class="main">
    <div class="top-block">
      <div class="left-side">
        <div class="temperature-controller">
          <label>Zadana temperatura wnętrza [&#8451;]</label>
          <input
            type="number"
            name="temperature-value"
            id="temperature-value"
            min="-4"
            max="36"
            step="0.1"
            v-model="targetTemperature"
            @focusout="setTargetTemperature()"
          />
        </div>
        <div class="temperature-controller">
          <label>Maksymalna odchyłka temperatury [&#8451;]</label>
          <input
            type="number"
            name="temperature-deviation"
            id="temperature-deviation"
            min="0"
            max="10"
            step="0.05"
            v-model="maxTemperatureDeviation"
          />
        </div>
        <div class="wibration-controller">
          <label>Dopuszczalny poziom drgań [%]</label>
          <input
            type="number"
            name="wibration-value"
            id="wibration-value"
            min="0"
            max="100"
            step="1"
            v-model="maxWibrationLevel"
          />
        </div>
        <div class="google-map">
          <div id="mapDiv" style="width: 100%; height: 100%"></div>
        </div>
      </div>
      <div class="right-side">
        <div class="temperature-plot">
          <Scatter
            :key="temperatureChartKey"
            :data="temperatureChart.data"
            :options="temperatureChart.options"
          />
        </div>
        <div class="wibration-plot">
          <Scatter
            :key="wibrationChartKey"
            :data="wibrationChart.data"
            :options="wibrationChart.options"
          />
        </div>
      </div>
    </div>
    <div class="bot-block">
      <div class="message-box">
        <ul>
          <li v-for:="message in messages">
            <label>{{ message.text }}</label>
            <label>{{ message.date }}</label>
          </li>
        </ul>
      </div>
    </div>
  </div>
  <footer>
    <p>Site designed by eng. Mateusz Frejlich</p>
  </footer>
</template>

<style scoped>
header {
  margin: 0;
  padding: 1% 5%;
  background-color: var(--primary-color);
  color: var(--secondary-color);
}

div.main {
  display: block;
  height: auto;
  width: 100%;
}

div.top-block {
  margin-inline: 2%;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-evenly;
  width: auto;
}

div.left-side {
  display: inline-block;
  vertical-align: middle;
  margin: 0;
  padding: 1% 2%;
  min-width: 400px;
  max-width: 500px;
  width: 30%;
  height: 100%;
  flex-grow: 1;
}

div.temperature-controller,
div.wibration-controller {
  padding: 5px 0px;
  display: flex;
  place-content: space-between;
}

div.temperature-controller input,
div.wibration-controller input {
  padding: 2px;
  margin: 0 0 0 15px;
  border-width: 2px;
  height: 14px;
  min-width: 50px;
  max-width: 70px;
}

div.google-map {
  padding: 15px 0px;
  width: 100%;
  height: 350px;
}

div.google-map canvas {
  border-radius: 15px;
}

div.right-side {
  display: inline-block;
  flex-flow: column;
  vertical-align: middle;
  margin: 0;
  padding: 1% 2%;
  height: 100%;
  min-width: 400px;
  max-width: 90%;
  width: 50%;
  flex-grow: 1;
}

div.temperature-plot,
div.wibration-plot {
  padding: 5px 0px;
  min-height: 230px;
  max-height: 230px;
  height: 100%;
  min-width: 400px;
  max-width: none;
}

div.bot-block {
  display: block;
  padding: 1%;
}

div.message-box {
  text-align: left;
  border: 0.2em;
  border-style: solid;
  border-color: black;
  padding: 0.5em;
  min-height: 70px;
  max-height: 70px;
  overflow: auto;
}

div.message-box ul {
  font-family: Verdana, Geneva, Tahoma, sans-serif;
  margin: 0;
  padding: 0;
  font-size: 0.9em;
  overflow: auto;
  list-style: none;
}

div.message-box ul li {
  display: flex;
  place-content: space-between;
}

footer {
  margin: 0;
  padding: 0.4em 5%;
  background-color: var(--primary-color);
  color: var(--secondary-color);
  text-align: right;
}
</style>
