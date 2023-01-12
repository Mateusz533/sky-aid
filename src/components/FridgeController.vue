<template>
	<div class="test-class" v-if="false">
		<ul>
			<li>blokowanie drzwi (info czy otwarte czy nie)</li>
			<li>układ chłodzenia (temperatura zadana, chłodzenie lub nie)</li>
			<li>układ pomiaru temperatury (wykres zmian temperatury)</li>
			<li>układ pomiaru drgań (wykres zmian drgań)</li>
			<li>układ odczytu karty (raportowanie kiedy karta jest wykryta i czy poprawnie)</li>
			<li>układ GPS (wyświetlanie lokalizacji na mapie lub błędu połączenia)</li>
		</ul>
	</div>
	<header>
		<h1>SkyAid – aktywna medyczna lodówka transportowa dla dronów</h1>
	</header>
	<div class="main">
		<div class="top-block">
			<div class="left-side">
				<div class="temperature-controller">
					<p>Temperatura zadana</p>
					<input type="number" name="temperature-value" id="" min="-4" max="36" step="0.1"
						v-model="set_temperature">
				</div>
				<div class="wibration-controller">
					<p>Dopuszczalny poziom drgań</p>
					<input type="number" name="temperature-value" id="" min="0" max="100" step="1"
						v-model="max_wibration_level">
				</div>
				<div class="google-map">
					<iframe
						src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14237.334158585627!2d20.9938014096638!3d52.20378425810866!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x471eccced03dfec1%3A0x4255c2c01fd7ceb5!2sWydzia%C5%82%20Mechatroniki%20Politechniki%20Warszawskiej!5e0!3m2!1spl!2spl!4v1673479422229!5m2!1spl!2spl"
						width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy"
						referrerpolicy="no-referrer-when-downgrade"></iframe>
				</div>
			</div>
			<div class="right-side">
				<div class="temperature-plot">
					<Scatter :data="chartConfig.data" :options="chartConfig.options" />
				</div>
				<div class="wibration-plot">
					<Scatter :data="chartConfig.data" :options="chartConfig.options" />
				</div>
			</div>
		</div>
		<div class="bot-block">
			<div class="messages">
				<ul>
					<li v-for:="m in messages">
						{{ m }}
					</li>
				</ul>
				<!-- <plaintext>{{ messages }}</plaintext> -->
			</div>
		</div>
	</div>
	<footer>
		<p>Site designed by eng. Mateusz Frejlich</p>
	</footer>
</template>

<script>
import {
	Chart as ChartJS,
	LinearScale,
	PointElement,
	LineElement,
	Tooltip,
	Legend
} from 'chart.js'
import { Scatter } from 'vue-chartjs'
import * as chartConfig from './chartConfig.js'

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend)

// import {Chart} from './Chart.vue'
export default {
	name: 'FridgeController',
	components: {
		Scatter
	},
	// components: {
	// 	Chart
	// },
	data() {
		return {
			chartConfig,
			set_temperature: 0,
			real_temperatur: undefined,
			max_wibration_level: 50,
			wibration_level: undefined,
			messages: ["Włączono urządzenie",
				"Wyłączono urządzenie",
				"Poprawny odczyt karty. Drzwi otwarte.",
				"Błędny odczyt karty!",
				"Utracono sygnał GPS!",
				"Przywrócono sygnał GPS.",
				"Podróż rozpoczęta.",
				"Podróż zakończona.",
				"Przekroczono bezpieczny poziom drgań!",
				"Temperatura wzrosła znacznie powyżej zadanej wartości!",
				"Temperatura spadła znacznie poniżej zadanej wartości!",
			]
		}
	}
}
</script>

<style>
.test-class {
	padding: 5% 20%;
	text-align: left;
}

:root {
	--primary-color: #d0d8dd;
	--secondary-color: #00a000;
}

header {
	margin: 0;
	padding: 1% 5%;
	background-color: var(--primary-color);
	color: var(--secondary-color);
}

.main {
	display: block;
	height: auto;
}

.top-block {
	display: block;
}

.left-side {
	display: inline-block;
	vertical-align: middle;
	margin: 0;
	padding: 1%;
	width: 30%;
	height: 100%;
}

.temperature-controller {
	width: 100%;
}

.wibration-controller {
	width: 100%;
}

.google-map {
	padding: 5px;
	width: 100%;
	height: 325px;
}

.right-side {
	display: inline-block;
	vertical-align: middle;
	margin: 0;
	padding: 1%;
	height: 100%;
	width: 60%;
}

.temperature-plot,
.wibration-plot {
	display: block;
	min-height: 220px;
	max-height: 220px;
	height: 100%;
}

.bot-block {
	display: block;
	padding: 1%;
}

.messages {
	text-align: left;
	border: 0.2em;
	border-style: solid;
	border-color: black;
	padding: 0.5em;
	max-height: 70px;
	overflow: auto;
}

.messages plaintext {
	font-family: Verdana, Geneva, Tahoma, sans-serif;
	margin: 0;
	min-height: 70px;
	max-height: 70px;
	overflow: auto;
	font-size: 0.9em;
}

.messages ul {
	font-family: Verdana, Geneva, Tahoma, sans-serif;
	margin: 0;
	padding: 0;
	font-size: 0.9em;
	overflow: auto;
	list-style: none;
}

footer {
	margin: 0;
	padding: 0.4em 5%;
	background-color: var(--primary-color);
	color: var(--secondary-color);
	text-align: right;
}
</style>