document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;
            const data = parseCSV(text);
            // createChart(data);
        };
        reader.readAsText(file);
    }
});

function parseCSV(text) {
    const rows = text.split('\n').map(row => row.split(','));
    const labels = rows[0];
    console.log(labels);
    // const data = rows.slice(1).map(row => row.map(Number));
    
    // return {
    //     labels: labels,
    //     datasets: [{
    //         label: 'Data Plot',
    //         data: data.map(row => row[1]), // Assuming the second column contains the data to plot
    //         borderColor: 'rgba(75, 192, 192, 1)',
    //         borderWidth: 1,
    //         fill: false
    //     }]
    // };
}

// function createChart(data) {
//     const ctx = document.getElementById('chart').getContext('2d');
//     new Chart(ctx, {
//         type: 'line',
//         data: {
//             labels: data.labels,
//             datasets: data.datasets
//         },
//         options: {
//             scales: {
//                 x: {
//                     beginAtZero: true
//                 },
//                 y: {
//                     beginAtZero: true
//                 }
//             }
//         }
//     });
// }
