document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;
            const data = d3.csvParse(text);
            let actions = data.map(d => d.Action);
            actions = actions.filter(action => action != "");
            console.log("Read " + actions.length + " actions");
            // cols_to_remove = ['Action', 'Code', 'Time (tens of minutes)', 'Drank water (ml)', 'Drank soda (ml)', 'Drank beer (ml)',
            //       'Drank wine (ml)', 'Drank liquor (ml)', 'Lunch outside?', 'Dinner outside?', 'Had pizza (dinner)?',
            //       'Shower?', 'Poop?', 'Emotion intensity description', 'Emotion intensity value']
            data.forEach(d => {
                delete d["Action"];
                delete d["Code"];
            });
            tensOfMinutes = getTens(data, actions);
            delete tensOfMinutes["undefined"];
            console.log(tensOfMinutes);
            items = Object.entries(tensOfMinutes);
            // Sort in descending order by value
            items.sort((a, b) => b[1] - a[1]);
            console.log(items);
            totalTime = 0;
            for (const [_, value] of items) {
                totalTime += value;
            }
            percentages = items;
            for(i = 0, length = percentages.length; i < length; i++){
                percentages[i][1] = percentages[i][1] / totalTime * 100;
            }
            drawChart(percentages);
        };
        reader.readAsText(file);
    }
});

function getTens(data, actions) {
    times = ["0.00","0.10","0.20","0.30","0.40","0.50","1.00","1.10","1.20","1.30","1.40","1.50",
    "2.00","2.10","2.20","2.30","2.40","2.50","3.00","3.10","3.20","3.30","3.40","3.50","4.00","4.10",
    "4.20","4.30","4.40","4.50","5.00","5.10","5.20","5.30","5.40","5.50","6.00","6.10","6.20","6.30",
    "6.40","6.50","7.00","7.10","7.20","7.30","7.40","7.50","8.00","8.10","8.20","8.30","8.40","8.50",
    "9.00","9.10","9.20","9.30","9.40","9.50","10.00","10.10","10.20","10.30","10.40","10.50","11.00",
    "11.10","11.20","11.30","11.40","11.50","12.00","12.10","12.20","12.30","12.40","12.50","13.00",
    "13.10","13.20","13.30","13.40","13.50","14.00","14.10","14.20","14.30","14.40","14.50","15.00",
    "15.10","15.20","15.30","15.40","15.50","16.00","16.10","16.20","16.30","16.40","16.50","17.00",
    "17.10","17.20","17.30","17.40","17.50","18.00","18.10","18.20","18.30","18.40","18.50","19.00",
    "19.10","19.20","19.30","19.40","19.50","20.00","20.10","20.20","20.30","20.40","20.50","21.00",
    "21.10","21.20","21.30","21.40","21.50","22.00","22.10","22.20","22.30","22.40","22.50","23.00",
    "23.10","23.20","23.30","23.40","23.50"]

    tens = {}

    actions.forEach(a => {
        tens[a] = 0;
    })

    data.forEach(d => {
        for (const [key, value] of Object.entries(d)) {
            if (times.includes(key)) {
                values = value.split();
                values.forEach(v => {
                    tens[actions[v - 1]] += 1;
                });
            }
        }
    });

    return tens;
}

function drawChart(data) {
    d3.select("#chart").select("svg").remove();

    const svg = d3.select("#chart").append("svg")
        .attr("width", "100%")
        .attr("height", "500px");

    const margin = { top: 20, right: 20, bottom: 30, left: 100 },
        width = svg.node().getBoundingClientRect().width - margin.left - margin.right,
        height = svg.node().getBoundingClientRect().height - margin.top - margin.bottom;

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().range([0, width]);
    const y = d3.scaleBand().rangeRound([0, height]).padding(0.1);

    x.domain([0, d3.max(data, d => d[1])]);
    y.domain(data.map(d => d[0]));

    g.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5).tickSize(-height).tickFormat(d3.format("d")));

    g.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y));

    g.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("y", d => y(d[0]))
        .attr("height", y.bandwidth())
        .attr("x", 0)
        .attr("width", d => x(d[1]))
        .attr("fill", "steelblue");

    g.append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x)
        .ticks(10)
        .tickSize(-height)
        .tickFormat("")
    );
}