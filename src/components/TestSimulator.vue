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
</template>

<script>

export default {
	name: 'TestSimulator',
	data() {
		return {
			timer: null,
			real_temperatur: undefined,
			wibration_level: undefined,
			message_rate: 1000,	// [ms]
		}
	},
	methods: {
		switchOn() {
			let message = "Włączono urządzenie.\t" + this.getFormattedDate();
			this.$emit('msg', message);
		},
		switchOff() {
			let message = "Wyłączono urządzenie.\t" + this.getFormattedDate();
			this.$emit('msg', message);
		},
		putRightCard() {
			let message = "Poprawny odczyt karty. Drzwi otwarte.\t" + this.getFormattedDate();
			this.$emit('msg', message);
		},
		putWrongCard() {
			let message = "Błędny odczyt karty!\t" + this.getFormattedDate();
			this.$emit('msg', message);
		},
		startFlight() {
			let message = "Podróż rozpoczęta.\t" + this.getFormattedDate();
			this.$emit('msg', message);
		},
		endFlight() {
			let message = "Podróż zakończona.\t" + this.getFormattedDate();
			this.$emit('msg', message);
		},
		lostGPS() {
			let message = "Utracono sygnał GPS!\t" + this.getFormattedDate();
			this.$emit('msg', message);
		},
		restoreGPS() {
			let message = "Przywrócono sygnał GPS.\t" + this.getFormattedDate();
			this.$emit('msg', message);
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
					// zapisanie temperatury i wibracji
					this.$emit('temp', { x: secs, y: 2 });
					this.$emit('wibr', { x: secs, y: 2 });
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
	},
}
</script>

<style>
.test-box {
	padding: 1em;
	display: flex;
	place-content: space-between;
	flex-wrap: wrap;
}

.test-box button {
	padding: 1em;
	width: 180px;
	cursor: pointer;
}
</style>