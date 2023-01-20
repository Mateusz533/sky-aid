// export const data = {
// 	datasets: [
// 		{
// 			fill: false,
// 			// borderColor: "#f87979",
// 			// backgroundColor: "#f87979",
// 			data: [
// 				{
// 					x: 0,
// 					y: 0,
// 				},
// 			],
// 		},
// 	],
// };

export const options = {
	responsive: true,
	maintainAspectRatio: false,
	scales: {
		x: {
			display: true,
			beginAtZero: true,
			title: {
				display: true,
				text: "Czas [s]",
			}
		},
		y: {
			display: true,
			// suggestedMin: -10,
			// suggestedMax: 40,
			title: {
				display: true,
				// text: "Temperatura [\u00B0C]",
			}
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
		point: {
			radius: 1,
			backgroundColor: '#FF0000',
			borderColor: '#FF0000',
		},
		line: {
			tension: 0,
			backgroundColor: '#FF0000',
			borderColor: '#FF0000',
		}
	}
};
