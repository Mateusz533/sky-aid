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
	</div>
</template>

<script>

export default {
	name: 'FridgeController',
	data() {
		return {
			timer: null,
			set_temperature: 0,
			real_temperatur: undefined,
			max_wibration_level: 50,
			wibration_level: undefined,
			message: [],
		}
	},
	methods: {
		switchOn() {
			let msg = "Włączono urządzenie.\t" + this.getFormattedDate();
			console.log(msg);
			this.message.push(msg);
		},
		switchOff() {
			let msg = "Wyłączono urządzenie.\t" + this.getFormattedDate();
			console.log(msg);
			this.message.push(msg);
		},
		putRightCard() {
			let msg = "Poprawny odczyt karty. Drzwi otwarte.\t" + this.getFormattedDate();
			console.log(msg);
			this.message.push(msg);
		},
		putWrongCard() {
			let msg = "Błędny odczyt karty!\t" + this.getFormattedDate();
			console.log(msg);
			this.message.push(msg);
		},
		startFlight() {
			let msg = "Podróż rozpoczęta.\t" + this.getFormattedDate();
			console.log(msg);
			this.message.push(msg);
		},
		endFlight() {
			let msg = "Podróż zakończona.\t" + this.getFormattedDate();
			console.log(msg);
			this.message.push(msg);
		},
		lostGPS() {
			let msg = "Utracono sygnał GPS!\t" + this.getFormattedDate();
			console.log(msg);
			this.message.push(msg);
		},
		restoreGPS() {
			let msg = "Przywrócono sygnał GPS.\t" + this.getFormattedDate();
			console.log(msg);
			this.message.push(msg);
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
			this.timer = setInterval(() => {
				let current_time = new Date();
				let secs = Math.floor(current_time.getTime() / 1000);
				// zapisanie temperatury i wibracji
			}, this.message_rate)
		},
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