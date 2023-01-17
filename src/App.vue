<template>
	<FridgeController :message="this.message" :real_temperature="this.real_temperature"
		:wibration_level="this.wibration_level" />
	<TestSimulator @msg="getMessage($event)" @temp="getTemperature($event)" @wibr="getWibration($event)" />
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
		}
	},
	data() {
		return {
			message: String,
			real_temperature: undefined,
			wibration_level: undefined,
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
	/*default: 60px*/
	height: 100%;
}

body {
	margin: 0;
}
</style>
