export const data = {
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
                    backgroundColor: '#777777',
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
export const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
        padding: 5,
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
};