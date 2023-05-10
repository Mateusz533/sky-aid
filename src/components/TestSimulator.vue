<script lang="ts">
import { defineComponent } from "vue";
import axios from "axios";

export default defineComponent({
  name: "TestSimulator",
  data() {
    return {
      isSwitchedOn: false,
      dataGetter: null as number | null,
      messageInterval: null as number | null,
      messageRate: 1000, // [ms]
      temperatureRegulator: null as number | null,
      regulationTime: 10000,
      targetTemperature: 0,
      realTemperature: 20,
      temperatureOscillationsAmplitude: 0,
      wibrationLevel: 0,
      wibrationLevelOscillationsAmplitude: 0,
      isSignalGPS: true,
      flightInterval: null as number | null,
      flightTime: 60, // [messageRate]
      targetPosition: {
        lat: 52.2,
        lng: 21,
      },
      currentPosition: {
        lat: 52.203,
        lng: 21.001,
      },
    };
  },
  methods: {
    async getFromServer(name: string) {
      try {
        const res = await axios.get(`http://localhost:3000/input/${name}`);
        return res.data;
      } catch (error) {
        return null;
      }
    },
    async updateServer(name: string, value: Object) {
      try {
        await axios.patch(`http://localhost:3000/output/${name}`, value);
      } catch (error) {
        // console.log(error);
      }
    },
    switchOn() {
      if (this.isSwitchedOn) return;
      this.sendMessage("Włączono urządzenie.");
      this.isSwitchedOn = true;
    },
    async switchOff() {
      if (!this.isSwitchedOn) return;

      await this.updateServer("", {
        msg: {
          text: "Wyłączono urządzenie.",
          date: this.getFormattedDate(),
        },
        currentLocation: { lat: NaN, lng: NaN },
      });

      this.isSwitchedOn = false;
      if (this.messageInterval) clearInterval(this.messageInterval);
      this.messageInterval = null;
      if (this.temperatureRegulator) clearInterval(this.temperatureRegulator);
      this.temperatureRegulator = null;
      if (this.flightInterval) clearInterval(this.flightInterval);
      this.flightInterval = null;
      if (this.dataGetter) clearInterval(this.dataGetter);
      this.dataGetter = null;
    },
    putRightCard() {
      if (!this.isSwitchedOn) return;
      this.sendMessage("Poprawny odczyt karty. Drzwi otwarte.");
    },
    putWrongCard() {
      if (!this.isSwitchedOn) return;
      this.sendMessage("Błędny odczyt karty!");
    },
    loseSignalGPS() {
      if (!this.isSwitchedOn) return;
      this.sendMessage("Utracono sygnał GPS!");
      this.isSignalGPS = false;
    },
    restoreSignalGPS() {
      if (!this.isSwitchedOn) return;
      this.sendMessage("Przywrócono sygnał GPS.");
      this.isSignalGPS = true;
    },
    async startFlight() {
      if (!this.isSwitchedOn) return;

      if (this.flightInterval) clearInterval(this.flightInterval);
      let secs = 0;
      this.flightInterval = setInterval(() => {
        secs++;
        if (secs < this.flightTime) {
          this.currentPosition.lat +=
            (this.targetPosition.lat - this.currentPosition.lat) /
            (this.flightTime - secs);
          this.currentPosition.lng +=
            (this.targetPosition.lng - this.currentPosition.lng) /
            (this.flightTime - secs);
        } else {
          this.currentPosition = { ...this.targetPosition };
          this.stopFlight();
        }
      }, this.messageRate);

      await this.updateServer("", {
        targetLocation: this.targetPosition,
        msg: {
          text: "Podróż rozpoczęta.",
          date: this.getFormattedDate(),
        },
      });
    },
    async stopFlight() {
      if (!this.isSwitchedOn) return;
      if (this.flightInterval) clearInterval(this.flightInterval);
      this.flightInterval = null;
      this.sendMessage("Podróż zakończona.");
    },
    async sendMessage(text: string) {
      await this.updateServer("", {
        msg: {
          text: text,
          date: this.getFormattedDate(),
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
    startPublishing() {
      if (!this.isSwitchedOn) return;

      const startTime = Math.floor(new Date().getTime() / 1000);
      this.sendData(startTime);
      if (!this.messageInterval) {
        this.messageInterval = setInterval(async () => {
          this.sendData(startTime);
        }, this.messageRate);
      }
    },
    async stopPublishing() {
      if (this.messageInterval) {
        clearInterval(this.messageInterval);
        this.messageInterval = null;
        await this.updateServer("", {
          currentLocation: { lat: NaN, lng: NaN },
        });
      }
    },
    async sendData(startTime: number) {
      const currentTime = new Date().getTime() / 1000;
      const secs = Math.floor(currentTime) - startTime;
      const randCosDist1 = (Math.asin(2 * Math.random() - 1) * 2) / Math.PI;
      const temperature =
        this.realTemperature +
        this.temperatureOscillationsAmplitude * randCosDist1;
      const randCosDist2 = (Math.asin(2 * Math.random() - 1) * 2) / Math.PI;
      const wibration =
        this.wibrationLevel +
        this.wibrationLevelOscillationsAmplitude * randCosDist2;
      const currentLocation = this.isSignalGPS
        ? this.currentPosition
        : { lat: NaN, lng: NaN };

      await this.updateServer("", {
        temperature: { time: secs, value: temperature },
        wibration: { time: secs, value: wibration },
        currentLocation: currentLocation,
      });
    },
  },
  mounted() {
    this.updateServer("", {
      msg: {
        text: "",
        date: "",
      },
      temperature: { time: NaN, value: NaN },
      wibration: { time: NaN, value: NaN },
      currentLocation: { lat: NaN, lng: NaN },
      targetLocation: { lat: NaN, lng: NaN },
    });

    if (!this.dataGetter) {
      this.dataGetter = setInterval(async () => {
        const data = await this.getFromServer("");
        if (data === null) return;
        this.targetTemperature = parseFloat(data.setTemperature.value);
        if (!this.isSwitchedOn || this.temperatureRegulator) return;

        this.temperatureRegulator = setInterval(() => {
          if (!isNaN(this.targetTemperature))
            this.realTemperature +=
              (this.messageRate / this.regulationTime) *
              (this.targetTemperature - this.realTemperature);
        }, this.messageRate);
      }, this.messageRate);
    }
  },
  beforeDestroy() {
    if (this.messageInterval) clearInterval(this.messageInterval);
    if (this.temperatureRegulator) clearInterval(this.temperatureRegulator);
    if (this.flightInterval) clearInterval(this.flightInterval);
    if (this.dataGetter) clearInterval(this.dataGetter);
  },
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
