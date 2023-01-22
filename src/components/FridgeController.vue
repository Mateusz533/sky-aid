<template>
	<header>
		<h1>SkyAid – aktywna medyczna lodówka transportowa dla dronów</h1>
	</header>
	<div class="main">
		<div class="top-block">
			<div class="left-side">
				<div class="temperature-controller">
					<label>Zadana temperatura wnętrza [&#8451;]</label>
					<input type="number" name="temperature-value" id="" min="-4" max="36" step="0.1"
						v-model="set_temperature" @focusout="setTemperature()">
				</div>
				<div class="temperature-controller">
					<label>Maksymalna odchyłka temperatury [&#8451;]</label>
					<input type="number" name="temperature-deviation" id="" min="0" max="10" step="0.05"
						v-model="max_temperature_deviation">
				</div>
				<div class="wibration-controller">
					<label>Dopuszczalny poziom drgań [%]</label>
					<input type="number" name="wibration-value" id="" min="0" max="100" step="1"
						v-model="max_wibration_level">
				</div>
				<div class="google-map">
					<canvas id="flight-map" style="background-color:rgb(187, 226, 198)" />
					<!-- <iframe
						src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14237.334158585627!2d20.9938014096638!3d52.20378425810866!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x471eccced03dfec1%3A0x4255c2c01fd7ceb5!2sWydzia%C5%82%20Mechatroniki%20Politechniki%20Warszawskiej!5e0!3m2!1spl!2spl!4v1673479422229!5m2!1spl!2spl"
						width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy"
						referrerpolicy="no-referrer-when-downgrade"></iframe> -->
				</div>
			</div>
			<div class="right-side">
				<div class="temperature-plot">
					<canvas id="temp-plot" />
				</div>
				<div class="wibration-plot">
					<canvas id="wibr-plot" />
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

<script>
import * as scatterChartConfig from './scatterChartConfig.js'
import { shallowRef } from '@vue/runtime-dom'
import {
	Chart,
	LinearScale,
	PointElement,
	LineElement,
	Tooltip,
	ScatterController,
} from 'chart.js'

Chart.register(
	LinearScale,
	PointElement,
	LineElement,
	Tooltip,
	ScatterController,
)

export default {
	name: 'FridgeController',
	props: {
		message: { msg: String, date: String },
		real_temperature: { x: Number, y: Number },
		wibration_level: { x: Number, y: Number },
		location: { x: Number, y: Number },
		target_location: { x: Number, y: Number },
	},
	emits: {
		settemperature: null,
	},
	data() {
		return {
			temp_chart: null,
			wibr_chart: null,
			map_chart: null,
			set_temperature: 0,
			max_temperature_deviation: 0,
			max_wibration_level: 50,
			temp_data: shallowRef({ datasets: Array({ data: [] }) }),
			wibr_data: shallowRef({ datasets: Array({ data: [] }) }),
			map_data: shallowRef({ datasets: Array({ data: [] }) }),
			messages: Array({ msg: String(), date: String() }),
		}
	},
	methods: {
		setTemperature() {
			this.$emit('settemperature', this.set_temperature);
		},
		reRenderChart(chart, data) {
			const ctx = chart.canvas;
			const options = JSON.parse(JSON.stringify(chart.options));
			chart.destroy();
			chart = null;
			return new Chart(ctx, {
				type: 'scatter',
				data: data,
				options: options
			});
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
	},
	watch: {
		message(msg) {
			this.messages = [msg].concat(this.messages);
		},
		real_temperature(temp) {
			// console.log("Czas: " + temp.x + ", temp: " + temp.y);
			this.temp_chart.data.datasets[0].data.push(temp);
			this.temp_chart.data.datasets[1].data = [{
				x: 0, y: this.set_temperature - this.max_temperature_deviation
			},
			{
				x: temp.x, y: this.set_temperature - this.max_temperature_deviation
			}];
			this.temp_chart.data.datasets[2].data = [{
				x: 0, y: this.set_temperature + this.max_temperature_deviation
			},
			{
				x: temp.x, y: this.set_temperature + this.max_temperature_deviation
			}];
			this.temp_chart = this.reRenderChart(this.temp_chart, this.temp_data);

			if (this.max_temperature_deviation > 0 && temp.y > this.set_temperature + this.max_temperature_deviation)
				this.messages = [{ msg: "Temperatura wzrosła znacznie powyżej zakresu tolerancji!", date: this.getFormattedDate() }].concat(this.messages);

			if (this.max_temperature_deviation > 0 && temp.y < this.set_temperature - this.max_temperature_deviation)
				this.messages = [{ msg: "Temperatura spadła znacznie poniżej zakresu tolerancji!", date: this.getFormattedDate() }].concat(this.messages);
		},
		wibration_level(wibr) {
			// console.log("Czas: " + wibr.x + ", wibr: " + wibr.y);
			this.wibr_chart.data.datasets[0].data.push(wibr);
			this.wibr_chart.data.datasets[1].data = [{ x: 0, y: this.max_wibration_level }, { x: wibr.x, y: this.max_wibration_level }];
			this.wibr_chart = this.reRenderChart(this.wibr_chart, this.wibr_data);
			if (wibr.y > this.max_wibration_level)
				this.messages = [{ msg: "Przekroczono bezpieczny poziom drgań!", date: this.getFormattedDate() }].concat(this.messages);
		},
		location(loc) {
			// console.log("Szerokość: " + loc.y + ", długość: " + loc.x);
			this.map_chart.data.datasets[0].data = [loc];
			this.map_chart.data.datasets[1].data[1] = loc;
			this.map_chart.data.datasets[2].data[1] = loc;
			this.map_chart = this.reRenderChart(this.map_chart, this.map_data);
		},
		target_location(target_loc) {
			// console.log("Szerokość: " + loc.y + ", długość: " + loc.x);
			let start_loc = this.map_chart.data.datasets[1].data[0];
			this.map_chart.data.datasets[1].data = [target_loc, start_loc];
			this.map_chart.data.datasets[2].data = [start_loc, start_loc];
			let max_scope = Math.max(Math.abs(start_loc.x - target_loc.x), Math.abs(start_loc.y - target_loc.y));
			let limits = {
				x_min: (start_loc.x + target_loc.x) / 2 - 0.75 * max_scope,
				x_max: (start_loc.x + target_loc.x) / 2 + 0.75 * max_scope,
				y_min: (start_loc.y + target_loc.y) / 2 - 0.75 * max_scope,
				y_max: (start_loc.y + target_loc.y) / 2 + 0.75 * max_scope,
			};
			this.map_chart.options.scales.x.min = limits.x_min;
			this.map_chart.options.scales.x.max = limits.x_max;
			this.map_chart.options.scales.y.min = limits.y_min;
			this.map_chart.options.scales.y.max = limits.y_max;
			this.map_chart.options.scales.xAxes.min = limits.x_min;
			this.map_chart.options.scales.xAxes.max = limits.x_max;
			this.map_chart.options.scales.yAxes.min = limits.y_min;
			this.map_chart.options.scales.yAxes.max = limits.y_max;
			this.map_chart.options.scales.x.ticks.stepSize = max_scope / 2;
			this.map_chart.options.scales.y.ticks.stepSize = max_scope / 2;
			this.map_chart.options.scales.xAxes.ticks.stepSize = max_scope / 2;
			this.map_chart.options.scales.yAxes.ticks.stepSize = max_scope / 2;
			this.map_chart = this.reRenderChart(this.map_chart, this.map_data);
		},
	},
	mounted() {
		const ctx_t = document.getElementById("temp-plot");
		let options = JSON.parse(JSON.stringify(scatterChartConfig.options));
		options.scales.y.suggestedMin = -10;
		options.scales.y.suggestedMax = 40;
		options.scales.y.title.text = "Temperatura [\u00B0C]";
		this.temp_chart = new Chart(ctx_t, {
			type: 'scatter',
			data: this.temp_data,
			options: options
		});

		const ctx_w = document.getElementById("wibr-plot");
		options = JSON.parse(JSON.stringify(scatterChartConfig.options));
		options.scales.y.suggestedMin = 0;
		options.scales.y.suggestedMax = 100;
		options.scales.y.title.text = "Poziom wibracji [%]";
		this.wibr_chart = new Chart(ctx_w, {
			type: 'scatter',
			data: this.wibr_data,
			options: options
		});

		let dataset = {
			elements: {
				line: {
					borderWidth: 0.5,
					borderDash: [10, 10],
				},
				point: {
					radius: 0,
				}
			},
			data: Array(Number),
		};
		this.temp_data.datasets.push(dataset);
		this.temp_data.datasets.push(JSON.parse(JSON.stringify(dataset)));
		this.wibr_data.datasets.push(JSON.parse(JSON.stringify(dataset)));

		const ctx_m = document.getElementById("flight-map");
		this.map_data = {
			datasets: [
				{
					data: [
						{
							x: 19,
							y: 52,
						},
					],
					elements: {
						point: {
							radius: 10,
							borderWidth: 2,
						},
						line: {
							display: false,
						}
					},
				},
				{
					data: [
						{
							x: 19,
							y: 52,
						},
						{
							x: 19,
							y: 52,
						}
					],
				},
				{
					data: [
						{
							x: 19,
							y: 52,
						},
						{
							x: 19,
							y: 52,
						}
					],
					elements: {
						line: {
							backgroundColor: '#777777',
							borderColor: '#777777',
						},
						point: {
							backgroundColor: '#777777',
						}
					},
				},
			],
		};
		this.map_chart = new Chart(ctx_m, {
			type: 'scatter',
			data: this.map_data,
			options: {
				responsive: true,
				maintainAspectRatio: false,
				layout: {
					padding: 5
				},
				scales: {
					x: {
						display: true,
						suggestedMin: 18.99,
						suggestedMax: 19.01,
						border: {
							width: 0,
						},
						ticks: {
							stepSize: 0.01,
						},
						grid: {
							// tickLength: 5,
							tickWidth: 1,
							lineWidth: 0,
						},
					},
					xAxes: {
						display: true,
						suggestedMin: 18.99,
						suggestedMax: 19.01,
						position: 'top',
						border: {
							width: 0,
						},
						ticks: {
							stepSize: 0.01,
						},
					},
					y: {
						display: true,
						suggestedMin: 51.99,
						suggestedMax: 52.01,
						border: {
							width: 0,
						},
						ticks: {
							stepSize: 0.01,
						},
						grid: {
							// tickLength: 5,
							tickWidth: 1,
							lineWidth: 0,
						},
					},
					yAxes: {
						display: true,
						suggestedMin: 51.99,
						suggestedMax: 52.01,
						position: 'right',
						border: {
							width: 0,
						},
						ticks: {
							stepSize: 0.01,
						},
					},
				},
				plugins: {
					legend: {
						display: false
					}
				},
				animation: false,
				showLine: true,
				elements: {
					line: {
						tension: 0,
						borderWidth: 3,
						borderDash: [10, 10],
						backgroundColor: '#0000FF',
						borderColor: '#0000FF',
					},
					point: {
						radius: 5,
						backgroundColor: '#0000FF',
						borderColor: '#FFFFFF',
						borderWidth: 0,
					}
				},
			}
		});
	},
	beforeDestroy() {
		if (this.temp_chart)
			this.temp_chart.destroy();
		if (this.wibr_chart)
			this.wibr_chart.destroy();
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
	width: 100%;
}

div.top-block {
	margin-inline: 2%;
	display: flex;
	flex-wrap: wrap;
	/* align-items: stretch; */
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

div.right-side {
	display: inline-block;
	flex-flow: column;
	vertical-align: middle;
	/* justify-content: space-around; */
	/* align-items: stretch; */
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
	/* display: block; */
	/* flex-grow: 10; */
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