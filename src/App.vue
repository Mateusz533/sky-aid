<template>
	<FridgeController :message="this.message" :real_temperature="this.real_temperature"
		:wibration_level="this.wibration_level" :location="this.location" :target_location="this.target_location"
		@settemperature="setTemperature($event)" />
	<TestSimulator @msg="getMessage($event)" @temperature="getTemperature($event)" @wibration="getWibration($event)"
		@location="getLocation($event)" @target_loc="getTargetLocation($event)"
		:set_temperature="this.set_temperature" />
</template>

<script>
import FridgeController from './components/FridgeController.vue'
import TestSimulator from './components/TestSimulator.vue'

export default {
	name: 'App',
	components: {
		FridgeController,
		TestSimulator
	},
	methods: {
		getMessage(msg) {
			this.message = msg;
		},
		getTemperature(temp) {
			this.real_temperature = temp;
		},
		getWibration(wibr) {
			this.wibration_level = wibr;
		},
		getLocation(loc) {
			this.location = loc;
		},
		getTargetLocation(loc) {
			this.target_location = loc;
		},
		setTemperature(temp) {
			this.set_temperature = temp;
		},
	},
	data() {
		return {
			message: { msg: String, date: String },
			real_temperature: { x: Number, y: Number },
			wibration_level: { x: Number, y: Number },
			location: { x: Number, y: Number },
			target_location: { x: Number, y: Number },
			set_temperature: Number,
		}
	}
}
</script>

<style>
#app {
	font-family: Avenir, Helvetica, Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	text-align: center;
	color: #2c3e50;
	margin-top: 0;
	height: 100%;
}

body {
	margin: 0;
}
</style>
