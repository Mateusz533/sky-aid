export const dataset = {
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
			title: {
				display: true,
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
	},
};
