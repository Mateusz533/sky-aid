<script>
import axios from "axios";

export default {
  name: "TestSimulator",
  data() {
    return {
      isSwitchedOn: false,
      isSignalGPS: true,
      timer: null,
      regulator: null,
      flight: null,
      dataGetter: null,
      targetLatitude: 52,
      targetLongitude: 19,
      latitude: 52,
      longitude: 19,
      targetTemperature: 0,
      realTemperature: 20,
      wibrationLevel: 0,
      temperatureOscillationsAmplitude: 0,
      wibrationLevelOscillationsAmplitude: 0,
      messageRate: 1000, // [ms]
      regulationTime: 10000,
      flightTime: 60, // [messageRate]
    };
  },
  methods: {
    async getFromServer(name) {
      try {
        const res = await axios.get(`http://localhost:3000/input/${name}`);
        return res.data;
        // console.log(res.data);
      } catch (error) {
        // console.log(error);
      }
    },
    async updateServer(name, value) {
      try {
        const res = await axios.patch(
          `http://localhost:3000/output/${name}`,
          value
        );
        // console.log(res.data);
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
          msg: "Wyłączono urządzenie.",
          date: this.getFormattedDate(),
        },
        location: { x: NaN, y: NaN },
      });

      this.isSwitchedOn = false;
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      if (this.regulator) clearInterval(this.regulator);
      this.regulator = null;
      if (this.flight) clearInterval(this.flight);
      this.flight = null;
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

      if (this.flight) clearInterval(this.flight);
      let secs = 0;
      this.flight = setInterval(() => {
        secs++;
        if (secs < this.flightTime) {
          this.longitude +=
            (this.targetLongitude - this.longitude) / (this.flightTime - secs);
          this.latitude +=
            (this.targetLatitude - this.latitude) / (this.flightTime - secs);
        } else {
          this.longitude = this.targetLongitude;
          this.latitude = this.targetLatitude;
          this.stopFlight();
        }
      }, this.messageRate);

      await this.updateServer("", {
        target_loc: {
          x: this.targetLongitude,
          y: this.targetLatitude,
        },
        msg: {
          msg: "Podróż rozpoczęta.",
          date: this.getFormattedDate(),
        },
      });
    },
    async stopFlight() {
      if (!this.isSwitchedOn) return;
      if (this.flight) clearInterval(this.flight);
      this.flight = null;
      this.sendMessage("Podróż zakończona.");
    },
    async sendMessage(text) {
      await this.updateServer("", {
        msg: {
          msg: text,
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
      if (!this.timer) {
        this.timer = setInterval(async () => {
          this.sendData(startTime);
        }, this.messageRate);
      }
    },
    async stopPublishing() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
        await this.updateServer("", { location: { x: NaN, y: NaN } });
      }
    },
    async sendData(startTime) {
      const currentTime = new Date();
      const secs = Math.floor(currentTime.getTime() / 1000) - startTime;
      let randCosDist = (Math.asin(2 * Math.random() - 1) * 2) / Math.PI;
      const temp =
        parseFloat(this.realTemperature) +
        parseFloat(this.temperatureOscillationsAmplitude) * randCosDist;
      randCosDist = (Math.asin(2 * Math.random() - 1) * 2) / Math.PI;
      const wibr =
        parseFloat(this.wibrationLevel) +
        parseFloat(this.wibrationLevelOscillationsAmplitude) * randCosDist;
      const location = this.isSignalGPS
        ? { x: this.longitude, y: this.latitude }
        : { x: NaN, y: NaN };

      await this.updateServer("", {
        temperature: { x: secs, y: temp },
        wibration: { x: secs, y: wibr },
        location: location,
      });
    },
  },
  mounted() {
    this.updateServer("", {
      msg: {
        msg: "",
        date: "",
      },
      temperature: { x: NaN, y: NaN },
      wibration: { x: NaN, y: NaN },
      location: { x: NaN, y: NaN },
      target_loc: { x: NaN, y: NaN },
    });

    if (!this.dataGetter) {
      this.dataGetter = setInterval(async () => {
        const data = await this.getFromServer("");
        this.targetTemperature = parseFloat(data.settemperature.value);
        if (!this.isSwitchedOn || this.regulator) return;

        this.regulator = setInterval(() => {
          this.realTemperature = parseFloat(this.realTemperature);
          if (!isNaN(this.targetTemperature))
            this.realTemperature +=
              (this.messageRate / this.regulationTime) *
              (this.targetTemperature - this.realTemperature);
        }, this.messageRate);
      }, this.messageRate);
    }
  },
  beforeDestroy() {
    if (this.timer) clearInterval(this.timer);
    if (this.regulator) clearInterval(this.regulator);
    if (this.flight) clearInterval(this.flight);
    if (this.dataGetter) clearInterval(this.dataGetter);
  },
};
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
          v-model="realTemperature"
        />
      </li>
      <li>
        <label>Poziom wibracji</label>
        <input
          type="range"
          min="0.0"
          max="100.0"
          step="1.0"
          v-model="wibrationLevel"
        />
      </li>
      <li>
        <label>Amplituda wahań temperatury</label>
        <input
          type="range"
          min="0.0"
          max="5.0"
          step="0.1"
          v-model="temperatureOscillationsAmplitude"
        />
      </li>
      <li>
        <label>Amplituda wahań poziomu wibracji</label>
        <input
          type="range"
          min="0.0"
          max="20.0"
          step="0.1"
          v-model="wibrationLevelOscillationsAmplitude"
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
          v-model="targetLatitude"
        />
      </li>
      <li class="bot">
        <label>Długość</label>
        <input
          type="number"
          min="14"
          max="24"
          step="0.00001"
          v-model="targetLongitude"
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
