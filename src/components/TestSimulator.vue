<template>
	<div class="test-box">
		<button @click="switchOn()">Włącz urządzenie</button>
		<button @click="switchOff()">Wyłącz urządzenie</button>
		<button @click="putRightCard()">Przyłóż właściwą kartę</button>
		<button @click="putWrongCard()">Przyłóż niewłaściwą kartę</button>
		<button @click="startFlight()">Rozpocznij lot</button>
		<button @click="endFlight()">Zakończ lot</button>
		<button @click="lostGPS()">Przerwij sygnał GPS</button>
		<button @click="restoreGPS()">Przywróć sygnał GPS</button>
		<button @click="startPublishing()">Zacznij mierzyć</button>
		<button @click="stopPublishing()">Przestań mierzyć</button>
	</div>
	<div class="test-box">
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
	},
	data() {
		return {
			timer: null,
			regulator: null,
			real_temperature: 0,
			wibration_level: 0,
			temperature_oscillations_amplitude: 0,
			wibration_level_oscillations_amplitude: 0,
			message_rate: 1000,	// [ms]
			regulation_time: 10000,
		}
	},
	watch: {
		set_temperature(temp) {
			if (this.regulator)
				clearInterval(this.regulator);
			this.regulator = setInterval(() => {
				this.real_temperature = parseFloat(this.real_temperature);
				this.real_temperature += this.message_rate / this.regulation_time * (parseFloat(this.set_temperature) - this.real_temperature);
			}, this.message_rate)
			console.log("Temperature set to: " + temp);
		}
	},
	methods: {
		switchOn() {
			this.$emit('msg', { msg: "Włączono urządzenie.", date: this.getFormattedDate() });
		},
		switchOff() {
			this.$emit('msg', { msg: "Wyłączono urządzenie.", date: this.getFormattedDate() });
		},
		putRightCard() {
			this.$emit('msg', { msg: "Poprawny odczyt karty. Drzwi otwarte.", date: this.getFormattedDate() });
		},
		putWrongCard() {
			this.$emit('msg', { msg: "Błędny odczyt karty!", date: this.getFormattedDate() });
		},
		startFlight() {
			this.$emit('msg', { msg: "Podróż rozpoczęta.", date: this.getFormattedDate() });
		},
		endFlight() {
			this.$emit('msg', { msg: "Podróż zakończona.", date: this.getFormattedDate() });
		},
		lostGPS() {
			this.$emit('msg', { msg: "Utracono sygnał GPS!", date: this.getFormattedDate() });
		},
		restoreGPS() {
			this.$emit('msg', { msg: "Przywrócono sygnał GPS.", date: this.getFormattedDate() });
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
			// ROZPOCZECIE, nie kontynuacja nowego watku
			const start_time = Math.floor(new Date().getTime() / 1000);
			if (!this.timer) {
				this.timer = setInterval(() => {
					let current_time = new Date();
					let secs = Math.floor(current_time.getTime() / 1000) - start_time;
					let rand_cos_dist = Math.asin(2 * Math.random() - 1) * 2 / Math.PI;
					let temp = parseFloat(this.real_temperature) + parseFloat(this.temperature_oscillations_amplitude) * rand_cos_dist;
					rand_cos_dist = Math.asin(2 * Math.random() - 1) * 2 / Math.PI;
					let wibr = parseFloat(this.wibration_level) + parseFloat(this.wibration_level_oscillations_amplitude) * rand_cos_dist;
					// zapisanie temperatury i wibracji
					this.$emit('temperature', { x: secs, y: temp });
					this.$emit('wibration', { x: secs, y: wibr });
					this.$emit('location', { x: 50.000001, y: 20.000001 });
				}, this.message_rate)
			}
		},
		stopPublishing() {
			if (this.timer)
				clearInterval(this.timer);
			this.timer = null
		},
	},
	beforeDestroy() {
		if (this.timer)
			clearInterval(this.timer);
		if (this.regulator)
			clearInterval(this.regulator);
	},
}
</script>

<style>
div.test-box {
	padding: 1em;
	display: flex;
	place-content: space-between;
	flex-wrap: wrap;
}

div.test-box button {
	padding: 1em;
	width: 180px;
	cursor: pointer;
}

div.test-box ul {
	list-style: none;
	display: flex;
	flex-flow: column;
}

div.test-box ul li {
	height: 3em;
	padding: 0.5em;
	display: flex;
	place-content: space-between;
	text-align: left;
}

div.test-box ul li input {
	margin-left: 30px;
}
</style>