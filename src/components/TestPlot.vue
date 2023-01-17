<template>
    <div style="height: 300px">
        <canvas id="my-plot" />
        <!-- <Scatter id="my-plot" :data="scatterChartConfig.data" :options="scatterChartConfig.options" /> -->
        <!-- <Line :data="lineChartConfig.data" :options="lineChartConfig.options" /> -->
        <button @click="testFun()">Zmień</button>
    </div>
</template>

<script>
import { Scatter } from 'vue-chartjs'
//import * as scatterChartConfig from './scatterChartConfig.js'

import {
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Chart,
} from 'chart.js'
import { Chart as ChartJS } from 'chart.js'
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
)

export default {
    name: 'TestPlot',
    components: {
        Scatter,
    },
    data() {
        return {
            chart: null,
            scatterChartConfig: {
                data: {
                    datasets: [
                        {
                            label: "Temperatura [st. C]",
                            fill: false,
                            borderColor: "#f87979",
                            backgroundColor: "#f87979",
                            data: [
                                {
                                    x: 0,
                                    y: 4,
                                },
                                {
                                    x: 1,
                                    y: 1,
                                },
                                {
                                    x: 2,
                                    y: 0,
                                },
                                {
                                    x: 3,
                                    y: 1,
                                },
                                {
                                    x: 4,
                                    y: 4,
                                },
                            ],
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            display: true,
                            title: {
                                display: true,
                                text: "Czas [s]",
                            }
                        },
                        y: {
                            display: true,
                            title: {
                                display: true,
                                text: "Temperatura [st. C]",
                            }
                        },
                    },
                    legend: {
                        display: false
                    },
                }

            }
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
            console.log(this.chart.data.datasets[0].data);
            console.log(this.chart);
            this.chart.update();
            //this.chart.render();
            //document.getElementById("my-plot").get.update();
        }
    },
    mounted() {
        const ctx = document.getElementById("my-plot");
        //this.scatterChartConfig = scatterChartConfig,
        this.chart = new Chart(ctx, {
            type: 'scatter',
            data: this.scatterChartConfig.data,
            options: this.scatterChartConfig.options
        });
    },
    beforeDestroy() {
        if (this.chart)
            this.chart.destroy();
    }
}
</script>

<style>

</style>