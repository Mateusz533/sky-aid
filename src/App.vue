<template>
	<FridgeController />
	<TestSimulator />
</template>

<script>
import FridgeController from './components/FridgeController.vue'
import TestSimulator from './components/TestSimulator.vue'

export default {
	name: 'App',
	components: {
		FridgeController,
		TestSimulator
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
