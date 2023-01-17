export const data = {
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
};

export const options = {
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
};
