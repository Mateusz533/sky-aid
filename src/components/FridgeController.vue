<script lang="ts">
import { defineComponent } from "vue";
import { shallowRef } from "@vue/runtime-dom";
import axios from "axios";

import * as scatterChartConfig from "./scatterChartConfig";
import * as mapChartConfig from "./mapConfig";
import { Scatter } from "vue-chartjs";
import {
  Chart,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  ChartData,
  ChartOptions,
} from "chart.js";

Chart.register(LinearScale, PointElement, LineElement, Tooltip);

export default defineComponent({
  name: "FridgeController",
  components: { Scatter },
  data() {
    return {
      dataGetter: null as null | number,
      tempChart: shallowRef({
        data: {} as ChartData<"scatter">,
        options: {} as ChartOptions<"scatter">,
      }),
      wibrChart: shallowRef({
        data: {} as ChartData<"scatter">,
        options: {} as ChartOptions<"scatter">,
      }),
      mapChart: shallowRef({
        data: {} as ChartData<"scatter"> | any,
        options: {} as ChartOptions<"scatter"> | any,
      }),
      tempChartKey: 0,
      wibrChartKey: 0,
      mapChartKey: 0,
      targetTemperature: 0,
      maxTemperatureDeviation: 0,
      maxWibrationLevel: 50,
      targetLoc: { x: Number(), y: Number() },
      messages: Array({ msg: String(), date: String() }),
      messageRate: 1000, // [ms]
    };
  },
  methods: {
    async getFromServer(name: string) {
      try {
        const res = await axios.get(`http://localhost:3000/output/${name}`);
        return res.data;
        // console.log(res.data);
      } catch (error) {
        console.log(error);
      }
    },
    async updateServer(name: string, value: Object) {
      try {
        const res = await axios.patch(
          `http://localhost:3000/input/${name}`,
          value
        );
        // console.log(res.data);
      } catch (error) {
        console.log(error);
      }
    },
    async setTemperature() {
      await this.updateServer("", {
        settemperature: {
          value: this.targetTemperature,
        },
      });
    },
    getFormattedDate() {
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
    },
    setRealTemperature(temp: { x: number; y: number }) {
      // console.log("Czas: " + temp.x + ", temp: " + temp.y);
      if (temp.x < 1) {
        this.tempChart.data.datasets[0].data = [temp];
        this.tempChart.data.datasets[1].data = [
          { x: 0, y: this.targetTemperature - this.maxTemperatureDeviation },
        ];
        this.tempChart.data.datasets[2].data = [
          { x: 0, y: this.targetTemperature + this.maxTemperatureDeviation },
        ];
      } else {
        this.tempChart.data.datasets[0].data.push(temp);
        this.tempChart.data.datasets[1].data = [
          {
            x: 0,
            y: this.targetTemperature - this.maxTemperatureDeviation,
          },
          {
            x: temp.x,
            y: this.targetTemperature - this.maxTemperatureDeviation,
          },
        ];
        this.tempChart.data.datasets[2].data = [
          {
            x: 0,
            y: this.targetTemperature + this.maxTemperatureDeviation,
          },
          {
            x: temp.x,
            y: this.targetTemperature + this.maxTemperatureDeviation,
          },
        ];
      }
      this.tempChartKey++;

      if (
        this.maxTemperatureDeviation > 0 &&
        temp.y > this.targetTemperature + this.maxTemperatureDeviation
      )
        this.messages.unshift({
          msg: "Temperatura wzrosła znacznie powyżej zakresu tolerancji!",
          date: this.getFormattedDate(),
        });

      if (
        this.maxTemperatureDeviation > 0 &&
        temp.y < this.targetTemperature - this.maxTemperatureDeviation
      )
        this.messages.unshift({
          msg: "Temperatura spadła znacznie poniżej zakresu tolerancji!",
          date: this.getFormattedDate(),
        });
    },
    setWibrationLevel(wibr: { x: number; y: number }) {
      // console.log("Czas: " + wibr.x + ", wibr: " + wibr.y);
      if (wibr.x < 1) {
        this.wibrChart.data.datasets[0].data = [wibr];
        this.wibrChart.data.datasets[1].data = [
          { x: 0, y: this.maxWibrationLevel },
        ];
      } else {
        this.wibrChart.data.datasets[0].data.push(wibr);
        this.wibrChart.data.datasets[1].data = [
          { x: 0, y: this.maxWibrationLevel },
          { x: wibr.x, y: this.maxWibrationLevel },
        ];
      }
      this.wibrChartKey++;

      if (wibr.y > this.maxWibrationLevel)
        this.messages.unshift({
          msg: "Przekroczono bezpieczny poziom drgań!",
          date: this.getFormattedDate(),
        });
    },
    setLocation(loc: { x: number; y: number }) {
      // console.log("Szerokość: " + loc.y + ", długość: " + loc.x);
      if (isNaN(loc.x) || loc.x === null || isNaN(loc.y) || loc.y === null) {
        this.mapChart.data.datasets[0].elements.point.backgroundColor =
          "#777777";
      } else {
        this.mapChart.data.datasets[0].data = [loc];
        this.mapChart.data.datasets[1].data[1] = loc;
        this.mapChart.data.datasets[2].data[1] = loc;
        this.mapChart.data.datasets[0].elements.point.backgroundColor =
          "#0000FF";
      }
      this.mapChartKey++;
    },
    setTargetLocation(targetLoc: { x: number; y: number }) {
      if (targetLoc.x === this.targetLoc.x && targetLoc.y === this.targetLoc.y)
        return;

      // console.log("Szerokość: " + target_loc.y + ", długość: " + target_loc.x);
      this.targetLoc = { x: targetLoc.x, y: targetLoc.y };
      const startLoc = this.mapChart.data.datasets[1].data[0] as {
        x: number;
        y: number;
      };
      this.mapChart.data.datasets[1].data = [targetLoc, startLoc];
      this.mapChart.data.datasets[2].data = [startLoc, startLoc];
      const maxScope = Math.max(
        Math.abs(startLoc.x - targetLoc.x),
        Math.abs(startLoc.y - targetLoc.y)
      );
      const limits = {
        x_min: (startLoc.x + targetLoc.x) / 2 - 0.75 * maxScope,
        x_max: (startLoc.x + targetLoc.x) / 2 + 0.75 * maxScope,
        y_min: (startLoc.y + targetLoc.y) / 2 - 0.75 * maxScope,
        y_max: (startLoc.y + targetLoc.y) / 2 + 0.75 * maxScope,
      };
      this.mapChart.options.scales.x.min = limits.x_min;
      this.mapChart.options.scales.x.max = limits.x_max;
      this.mapChart.options.scales.y.min = limits.y_min;
      this.mapChart.options.scales.y.max = limits.y_max;
      this.mapChart.options.scales.xAxes.min = limits.x_min;
      this.mapChart.options.scales.xAxes.max = limits.x_max;
      this.mapChart.options.scales.yAxes.min = limits.y_min;
      this.mapChart.options.scales.yAxes.max = limits.y_max;
      this.mapChart.options.scales.x.ticks.stepSize = maxScope / 2;
      this.mapChart.options.scales.y.ticks.stepSize = maxScope / 2;
      this.mapChart.options.scales.xAxes.ticks.stepSize = maxScope / 2;
      this.mapChart.options.scales.yAxes.ticks.stepSize = maxScope / 2;
      this.mapChartKey++;
    },
  },
  mounted() {
    this.updateServer("", { settemperature: { value: null } });
    if (!this.dataGetter) {
      this.dataGetter = setInterval(async () => {
        const data = await this.getFromServer("");
        const temp = data.temperature;
        const wibr = data.wibration;
        const loc = data.location;
        const target_loc = data.target_loc;
        const msg = data.msg;
        if (temp.x !== null && temp.y !== null) this.setRealTemperature(temp);
        if (wibr.x !== null && wibr.y !== null) this.setWibrationLevel(wibr);
        this.setLocation(loc);
        if (target_loc.x !== null && target_loc.y !== null)
          this.setTargetLocation(target_loc);
        if (
          this.messages.length === 0 ||
          (msg.msg !== this.messages[0].msg &&
            msg.date >= this.messages[0].date)
        )
          this.messages.unshift(msg);
      }, this.messageRate);
    }
  },
  beforeMount() {
    const tempData = {
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
    this.tempChart = {
      data: tempData,
      options: tempOptions,
    };

    const wibrData = {
      datasets: [
        { data: [] },
        JSON.parse(JSON.stringify(scatterChartConfig.dataset)),
      ],
    };
    let wibrOptions = JSON.parse(JSON.stringify(scatterChartConfig.options));
    wibrOptions.scales.y.suggestedMin = 0;
    wibrOptions.scales.y.suggestedMax = 100;
    wibrOptions.scales.y.title.text = "Poziom wibracji [%]";
    this.wibrChart = {
      data: wibrData,
      options: wibrOptions,
    };

    const mapOptions = JSON.parse(JSON.stringify(mapChartConfig.options));
    const mapData = JSON.parse(JSON.stringify(mapChartConfig.data));
    this.mapChart = {
      data: mapData,
      options: mapOptions,
    };
  },
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
            @focusout="setTemperature()"
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
          <Scatter
            style="background-color: rgb(187, 226, 198)"
            :key="mapChartKey"
            :data="mapChart.data"
            :options="(mapChart.options as ChartOptions<'scatter'>)"
          />
        </div>
      </div>
      <div class="right-side">
        <div class="temperature-plot">
          <Scatter
            :key="tempChartKey"
            :data="tempChart.data"
            :options="tempChart.options"
          />
        </div>
        <div class="wibration-plot">
          <Scatter
            :key="wibrChartKey"
            :data="wibrChart.data"
            :options="wibrChart.options"
          />
        </div>
      </div>
    </div>
    <div class="bot-block">
      <div class="message-box">
        <ul>
          <li v-for:="message in messages">
            <label>{{ message.msg }}</label>
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
