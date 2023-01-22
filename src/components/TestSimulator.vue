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
				<input type="range" min="-10.0" max="40.0" step="0.1" v-model="this.real_temperature">
			</li>
			<li>
				<label>Poziom wibracji</label>
				<input type="range" min="0.0" max="100.0" step="1.0" v-model="this.wibration_level">
			</li>
			<li>
				<label>Amplituda wahań temperatury</label>
				<input type="range" min="0.0" max="5.0" step="0.1" v-model="this.temperature_oscillations_amplitude">
			</li>
			<li>
				<label>Amplituda wahań poziomu wibracji</label>
				<input type="range" min="0.0" max="20.0" step="0.1"
					v-model="this.wibration_level_oscillations_amplitude">
			</li>
		</ul>
	</div>
	<div class="settings-box">
		<ul>
			<li class="bot">
				<label>Szerokość</label>
				<input type="number" min="49" max="55" step="0.00001" v-model="this.target_latitude">
			</li>
			<li class="bot">
				<label>Długość</label>
				<input type="number" min="14" max="24" step="0.00001" v-model="this.target_longitude">
			</li>
		</ul>
	</div>
</template>

<script>

export default {
	name: 'TestSimulator',
	props: {
		set_temperature: Number,
	},
	emits: {
		msg: null,
		temperature: null,
		wibration: null,
		location: null,
		target_loc: null,
	},
	data() {
		return {
			is_switched_on: false,
			is_signal_GPS: true,
			timer: null,
			regulator: null,
			flight: null,
			target_latitude: 52,
			target_longitude: 19,
			latitude: 52,
			longitude: 19,
			real_temperature: 20,
			wibration_level: 0,
			temperature_oscillations_amplitude: 0,
			wibration_level_oscillations_amplitude: 0,
			message_rate: 1000,	// [ms]
			regulation_time: 10000,
			flight_time: 60 	// [message_rate]
		}
	},
	watch: {
		set_temperature(temp) {
			if (!this.is_switched_on)
				return;
			if (this.regulator)
				clearInterval(this.regulator);
			this.regulator = setInterval(() => {
				this.real_temperature = parseFloat(this.real_temperature);
				this.real_temperature += this.message_rate / this.regulation_time * (parseFloat(temp) - this.real_temperature);
			}, this.message_rate)
			// console.log("Temperature set to: " + temp);
		}
	},
	methods: {
		switchOn() {
			this.$emit('msg', { msg: 'Włączono urządzenie.', date: this.getFormattedDate() });
			this.is_switched_on = true;
		},
		switchOff() {
			if (!this.is_switched_on)
				return;
			this.$emit('msg', { msg: 'Wyłączono urządzenie.', date: this.getFormattedDate() });
			this.$emit('location', { x: NaN, y: NaN });
			this.is_switched_on = false;
			if (this.timer)
				clearInterval(this.timer);
			this.timer = null;
			if (this.regulator)
				clearInterval(this.regulator);
			this.regulator = null;
			if (this.flight)
				clearInterval(this.flight);
			this.flight = null;
		},
		putRightCard() {
			if (!this.is_switched_on)
				return;
			this.$emit('msg', { msg: 'Poprawny odczyt karty. Drzwi otwarte.', date: this.getFormattedDate() });
		},
		putWrongCard() {
			if (!this.is_switched_on)
				return;
			this.$emit('msg', { msg: 'Błędny odczyt karty!', date: this.getFormattedDate() });
		},
		loseSignalGPS() {
			if (!this.is_switched_on)
				return;
			this.$emit('msg', { msg: 'Utracono sygnał GPS!', date: this.getFormattedDate() });
			this.is_signal_GPS = false;
		},
		restoreSignalGPS() {
			if (!this.is_switched_on)
				return;
			this.$emit('msg', { msg: 'Przywrócono sygnał GPS.', date: this.getFormattedDate() });
			this.is_signal_GPS = true;
		},
		startFlight() {
			if (!this.is_switched_on)
				return;
			if (this.flight)
				clearInterval(this.flight);
			let secs = 0;
			this.flight = setInterval(() => {
				secs++;
				if (secs < this.flight_time) {
					this.longitude += (this.target_longitude - this.longitude) / (this.flight_time - secs);
					this.latitude += (this.target_latitude - this.latitude) / (this.flight_time - secs);
				}
				else {
					this.longitude = this.target_longitude;
					this.latitude = this.target_latitude;
					this.stopFlight();
				}
			}, this.message_rate);
			this.$emit('target_loc', { x: this.target_longitude, y: this.target_latitude });
			this.$emit('msg', { msg: 'Podróż rozpoczęta.', date: this.getFormattedDate() });
		},
		stopFlight() {
			if (!this.is_switched_on)
				return;
			if (this.flight)
				clearInterval(this.flight);
			this.flight = null;
			this.$emit('msg', { msg: 'Podróż zakończona.', date: this.getFormattedDate() });
		},
		getFormattedDate() {
			let current_time = new Date();
			let date = "";
			let hours = current_time.getHours();
			let minutes = current_time.getMinutes();
			let seconds = current_time.getSeconds();
			if (hours < 10)
				date += "0";
			if (hours == 1)
				date += "0:";
			else
				date += hours.toString() + ":";
			if (minutes < 10)
				date += "0";
			if (minutes == 1)
				date += "0:";
			else
				date += minutes.toString() + ":";
			if (seconds < 10)
				date += "0";
			if (seconds == 1)
				date += "0";
			else
				date += seconds.toString();
			return date;
		},
		startPublishing() {
			if (!this.is_switched_on)
				return;
			const start_time = Math.floor(new Date().getTime() / 1000);
			this.sendMessages(start_time);
			if (!this.timer) {
				this.timer = setInterval(() => {
					this.sendMessages(start_time);
				}, this.message_rate)
			}
		},
		stopPublishing() {
			if (this.timer) {
				clearInterval(this.timer);
				this.timer = null;
				this.$emit('location', { x: NaN, y: NaN });
			}
		},
		sendMessages(start_time) {
			let current_time = new Date();
			let secs = Math.floor(current_time.getTime() / 1000) - start_time;
			let rand_cos_dist = Math.asin(2 * Math.random() - 1) * 2 / Math.PI;
			let temp = parseFloat(this.real_temperature) + parseFloat(this.temperature_oscillations_amplitude) * rand_cos_dist;
			rand_cos_dist = Math.asin(2 * Math.random() - 1) * 2 / Math.PI;
			let wibr = parseFloat(this.wibration_level) + parseFloat(this.wibration_level_oscillations_amplitude) * rand_cos_dist;
			// zapisanie temperatury i wibracji
			this.$emit('temperature', { x: secs, y: temp });
			this.$emit('wibration', { x: secs, y: wibr });
			if (this.is_signal_GPS)
				this.$emit('location', { x: this.longitude, y: this.latitude });
			else
				this.$emit('location', { x: NaN, y: NaN });
		},
	},
	beforeDestroy() {
		if (this.timer)
			clearInterval(this.timer);
		if (this.regulator)
			clearInterval(this.regulator);
		if (this.flight)
			clearInterval(this.flight);
	},
}
</script>

<style>
/* All styles included in file './assets/global.css' */
</style>