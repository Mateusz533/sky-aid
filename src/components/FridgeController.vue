<template>
	<!-- - blokowanie drzwi (info czy otwarte czy nie)
	- układ chłodzenia (temperatura zadana, chłodzenie lub nie)
	- układ pomiaru temperatury (wykres zmian temperatury)
	- układ pomiaru drgań (wykres zmian drgań)
	- układ odczytu karty (raportowanie kiedy karta jest wykryta i czy poprawnie)
	- układ GPS (wyświetlanie lokalizacji na mapie lub błędu połączenia) -->
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
					<input type="number" name="wibration-value" id="" min="0" max="100" step="1"
						v-model="max_wibration_level" @change="testFun()">
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
					<!-- <TestPlot /> -->
					<canvas ref="myPlot" id="my-plot" :key="componentKey" />
					<!-- <Scatter id="my-plot" :data="scatterChartConfig.data" :options="scatterChartConfig.options" /> -->
					<!-- <Line :data="lineChartConfig.data" :options="lineChartConfig.options" /> -->
				</div>
				<div class="wibration-plot">
					<!-- <Scatter :data="scatterChartConfig.data" :options="scatterChartConfig.options" /> -->
					<!-- <Line :data="lineChartConfig.data" :options="lineChartConfig.options" /> -->
				</div>
			</div>
		</div>
		<div class="bot-block">
			<div class="message-box">
				<ul>
					<li v-for:="message in messages">
						{{ message }}
					</li>
				</ul>
			</div>
		</div>
	</div>
	<footer>
		<p>Site designed by eng. Mateusz Frejlich</p>
	</footer>
</template>

<script>
import { ref } from 'vue';
const componentKey = ref(0);

const forceRerender = () => {
  componentKey.value += 1;
};
import { Scatter, Line } from 'vue-chartjs'
import * as scatterChartConfig from './scatterChartConfig.js'
import * as lineChartConfig from './lineChartConfig.js'

import {
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	Chart,
	ScatterController,
} from 'chart.js'
// Scatter
import { Chart as ChartJS } from 'chart.js'
// ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend)
// Line
ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	ScatterController
)
import TestPlot from './TestPlot.vue';
import { render } from '@vue/runtime-dom'
export default {
	name: 'FridgeController',
	props: {
		message: String(),
		real_temperature: undefined,
		wibration_level: undefined,
	},
	components: {
		Scatter,
		Line,
		TestPlot
	},
	data() {
		return {
			chart: null,
			set_temperature: 0,
			max_wibration_level: 50,
			//temp: shallowRef([{x: 0, y: 2}]),
			messages: Array(String()),
			/*messages: ["Przekroczono bezpieczny poziom drgań!",
				"Temperatura wzrosła znacznie powyżej zadanej wartości!",
				"Temperatura spadła znacznie poniżej zadanej wartości!",
			]*/
		}
	},
	methods: {
		testFun() {
			let v = 0;
			++v;
			//this.scatterChartConfig.data.datasets[0].data.push({ x: v, y: 3 });
			//this.chart.data.datasets[0].data.push({ x: v, y: 3 });
			this.chart.data.datasets[0].data[0].y = 0;
			//console.log(document.getElementById("my-plot"));
			//console.log(this.temp);
			//this.temp.push({x: v, y: 2});
			console.log(this.chart.data.datasets[0].data);
			console.log(this.chart);
			forceRerender();
			//render(document.getElementById("my-plot"));
			//this.chart.reset();
			//this.chart.resize();
			//this.chart.update();
			//this.chart.render();
		}
	},
	watch: {
		message(msg) {
			this.messages = [msg].concat(this.messages);
		},
		real_temperature(temp) {
			console.log("Czas: " + temp.x + ", temp: " + temp.y);
			this.chart.data.datasets[0].data.push(temp);
			// this.chart.data.datasets[0].data = [temp];
			// this.chart.update();
			// this.chart.render();
			// aktualizacja wykresu
		},
		wibration_level(wibr) {
			console.log("Czas: " + wibr.x + ", wibr: " + wibr.y);
		}
	},
	mounted() {
		const ctx = document.getElementById("my-plot");
		this.chart = new Chart(ctx, {
			type: 'scatter',
			data: {
				datasets: [
					{
						label: "Temperatura [st. C]",
						fill: false,
						borderColor: "#f87979",
						backgroundColor: "#f87979",
						data: [{x: 0, y: 1}]
					},
				],
			},
			options: scatterChartConfig.options
		});
	},
	beforeDestroy() {
		if (this.chart)
			this.chart.destroy();
	}
}
</script>

<style>
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

div.main {
	display: block;
	height: auto;
}

div.top-block {
	display: block;
}

div.left-side {
	display: inline-block;
	vertical-align: middle;
	margin: 0;
	padding: 1%;
	width: 30%;
	height: 100%;
}

div.temperature-controller {
	width: 100%;
}

div.wibration-controller {
	width: 100%;
}

div.google-map {
	padding: 5px;
	width: 100%;
	height: 325px;
}

div.right-side {
	display: inline-block;
	vertical-align: middle;
	margin: 0;
	padding: 1%;
	height: 100%;
	width: 60%;
}

div.temperature-plot,
div.wibration-plot {
	display: block;
	min-height: 220px;
	max-height: 220px;
	height: 100%;
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
	max-height: 70px;
	overflow: auto;
}

div.message-box plaintext {
	font-family: Verdana, Geneva, Tahoma, sans-serif;
	margin: 0;
	min-height: 70px;
	max-height: 70px;
	overflow: auto;
	font-size: 0.9em;
}

div.message-box ul {
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