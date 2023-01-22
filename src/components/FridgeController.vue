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
import * as mapChartConfig from './mapConfig.js'
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
			if (temp.x < 1) {
				this.temp_chart.data.datasets[0].data = [temp];
				this.temp_chart.data.datasets[1].data = [{ x: 0, y: this.set_temperature - this.max_temperature_deviation }];
				this.temp_chart.data.datasets[2].data = [{ x: 0, y: this.set_temperature + this.max_temperature_deviation }];
			}
			else {
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
			}
			this.temp_chart = this.reRenderChart(this.temp_chart, this.temp_data);

			if (this.max_temperature_deviation > 0 && temp.y > this.set_temperature + this.max_temperature_deviation)
				this.messages = [{ msg: "Temperatura wzrosła znacznie powyżej zakresu tolerancji!", date: this.getFormattedDate() }].concat(this.messages);

			if (this.max_temperature_deviation > 0 && temp.y < this.set_temperature - this.max_temperature_deviation)
				this.messages = [{ msg: "Temperatura spadła znacznie poniżej zakresu tolerancji!", date: this.getFormattedDate() }].concat(this.messages);
		},
		wibration_level(wibr) {
			// console.log("Czas: " + wibr.x + ", wibr: " + wibr.y);
			if (wibr.x < 1) {
				this.wibr_chart.data.datasets[0].data = [wibr];
				this.wibr_chart.data.datasets[1].data = [{ x: 0, y: this.max_wibration_level }];
			}
			else {
				this.wibr_chart.data.datasets[0].data.push(wibr);
				this.wibr_chart.data.datasets[1].data = [{ x: 0, y: this.max_wibration_level }, { x: wibr.x, y: this.max_wibration_level }];
			}
			this.wibr_chart = this.reRenderChart(this.wibr_chart, this.wibr_data);
			if (wibr.y > this.max_wibration_level)
				this.messages = [{ msg: "Przekroczono bezpieczny poziom drgań!", date: this.getFormattedDate() }].concat(this.messages);
		},
		location(loc) {
			// console.log("Szerokość: " + loc.y + ", długość: " + loc.x);
			if (isNaN(loc.x) || isNaN(loc.y)) {
				this.map_chart.data.datasets[0].elements.point.backgroundColor = '#777777';
			}
			else {
				this.map_chart.data.datasets[0].data = [loc];
				this.map_chart.data.datasets[1].data[1] = loc;
				this.map_chart.data.datasets[2].data[1] = loc;
				this.map_chart.data.datasets[0].elements.point.backgroundColor = '#0000FF';
			}
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

		this.temp_data.datasets.push(JSON.parse(JSON.stringify(scatterChartConfig.dataset)));
		this.temp_data.datasets.push(JSON.parse(JSON.stringify(scatterChartConfig.dataset)));
		this.wibr_data.datasets.push(JSON.parse(JSON.stringify(scatterChartConfig.dataset)));
		
		const ctx_m = document.getElementById("flight-map");
		options = JSON.parse(JSON.stringify(mapChartConfig.options));
		this.map_data = JSON.parse(JSON.stringify(mapChartConfig.data));
		this.map_chart = new Chart(ctx_m, {
			type: 'scatter',
			data: this.map_data,
			options: options
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
/* All styles included in file './assets/global.css' */
</style>