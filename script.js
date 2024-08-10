let startDate = null;
let endDate = null;
let lastDate = null;
let fullData = null;
let actions = null;
let filteredData = null;

const times = ["0.00","0.10","0.20","0.30","0.40","0.50","1.00","1.10","1.20","1.30","1.40","1.50",
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

function readInput(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;
            fullData = d3.csvParse(text);
            actions = fullData.map(d => d.Action);
            actions = actions.filter(action => action != "");
            console.log("Read " + actions.length + " actions");
            fullData.forEach(d => {
                delete d["Action"];
                delete d["Code"];
            });

            fullData = fullData.filter(row => {
                ok = true;
                for (i = 0; i < times.length; i++) {
                    if (row[times[i]] == null || row[times[i]] == "") ok = false;
                    if (!ok) break;
                }
                return ok;
            });
            filteredData = fullData;
            console.log(filteredData);
            lastDate = new Date(filteredData[filteredData.length - 1]['Date']);
            console.log("Read data about " + filteredData.length + " days");
        }
        reader.readAsText(file);

        document.getElementById('filter').disabled = false;
        document.getElementById('buildCharts').disabled = false;
    }
}

function getTens(data, actions) {
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

function calculateSpearmanRho(x, y) {
    const n = x.length;
    if (n !== y.length) {
        throw new Error("Arrays must have the same length");
    }

    // Rank the arrays
    const rankX = rankData(x);
    const rankY = rankData(y);

    // Calculate the differences and square them
    let sumDiffSquared = 0;
    for (let i = 0; i < n; i++) {
        const diff = rankX[i] - rankY[i];
        sumDiffSquared += diff * diff;
    }

    // Calculate Spearman's Rho
    const rho = 1 - (6 * sumDiffSquared) / (n * (n * n - 1));
    return rho;
}

function rankData(arr) {
    const sorted = arr.slice().sort((a, b) => a - b);
    const ranks = arr.map(v => sorted.indexOf(v) + 1);
    return ranks;
}

function getEmotions(data, actions) {
    const emotionStats = {
        Happiness: { sum: 0, count: 0, mean: 0, correlations: {} },
        Sadness: { sum: 0, count: 0, mean: 0, correlations: {} },
        Anger: { sum: 0, count: 0, mean: 0, correlations: {} },
        Numbness: { sum: 0, count: 0, mean: 0, correlations: {} }
    };

    actions.forEach(action => {
        ['Happiness', 'Sadness', 'Anger', 'Numbness'].forEach(emotion => {
            emotionStats[emotion].correlations[action] = [];
        });
    });

    // ... (data collection part remains the same)

    // Calculate mean and Spearman's Rho correlations
    for (let emotion in emotionStats) {
        emotionStats[emotion].mean = emotionStats[emotion].sum / emotionStats[emotion].count;
        
        for (let action in emotionStats[emotion].correlations) {
            const correlationData = emotionStats[emotion].correlations[action];
            if (correlationData.length > 1) {
                const emotionValues = correlationData.map(d => d.emotion);
                const activityValues = correlationData.map(d => d.activity);
                emotionStats[emotion].correlations[action] = calculateSpearmanRho(emotionValues, activityValues);
            } else {
                emotionStats[emotion].correlations[action] = 0; // Not enough data for correlation
            }
        }

        const sortedCorrelations = Object.entries(emotionStats[emotion].correlations)
            .sort((a, b) => b[1] - a[1]);
        
        emotionStats[emotion].topPositive = sortedCorrelations.slice(0, 5);
        emotionStats[emotion].topNegative = sortedCorrelations.slice(-5).reverse();
    }

    return emotionStats;
}

function drawActivityChart(data, containerId) {
    console.log(data);

    d3.select(`#${containerId}`).select("svg").remove();

    const svg = d3.select(`#${containerId}`).append("svg")
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

document.getElementById('startDate').addEventListener('change', function(_) {
    startDate = new Date(document.getElementById('startDate').value);
    console.log("Start date changed");
});
document.getElementById('endDate').addEventListener('change', function(_) {
    endDate = new Date(document.getElementById('endDate').value);
    console.log("End date changed");
});

document.getElementById('fileInput').addEventListener('change', function(event) {
    readInput(event);
});

document.getElementById('filter').addEventListener('click', function(_) {
    filteredData = fullData.filter(d => {
        const date = new Date(d.Date);
        v = date >= startDate && date <= endDate;
        return v;
    });
    lastDate = new Date(filteredData[filteredData.length - 1]['Date']);
    console.log("Filtered data now contains " + filteredData.length + " elements");
});

document.getElementById('buildCharts').addEventListener('click', function(_) {
    document.getElementById("fullChart").classList.remove('hidden');
    document.getElementById("lastMonthChart").classList.remove('hidden');
    document.getElementById("lastWeekChart").classList.remove('hidden');

    lastMonthStartDate = new Date(lastDate);
    lastWeekStartDate = new Date(lastDate);

    lastMonthStartDate.setDate(lastMonthStartDate.getDate() - 30);
    lastWeekStartDate.setDate(lastWeekStartDate.getDate() - 6);
    
    lastMonthData = filteredData.filter(d => {
        const date = new Date(d.Date);
        return date >= lastMonthStartDate && date <= lastDate;
    });
    lastWeekData = filteredData.filter(d => {
        const date = new Date(d.Date);
        return date >= lastWeekStartDate && date <= lastDate;
    });

    fullDataTensOfMinutes = getTens(filteredData, actions);
    lastMonthTensOfMinutes = getTens(lastMonthData, actions);
    lastWeekTensOfMinutes = getTens(lastWeekData, actions);

    delete fullDataTensOfMinutes["undefined"];
    delete lastMonthTensOfMinutes["undefined"];
    delete lastWeekTensOfMinutes["undefined"];

    fullDataTensOfMinutes = Object.entries(fullDataTensOfMinutes);
    lastMonthTensOfMinutes = Object.entries(lastMonthTensOfMinutes);
    lastWeekTensOfMinutes = Object.entries(lastWeekTensOfMinutes);
    
    fullDataTensOfMinutes.sort((a, b) => b[1] - a[1]);
    lastMonthTensOfMinutes.sort((a, b) => b[1] - a[1]);
    lastWeekTensOfMinutes.sort((a, b) => b[1] - a[1]);

    fullDataTotalTime = 0;
    lastMonthTotalTime = 0;
    lastWeekTotalTime = 0;

    for (const [_, value] of fullDataTensOfMinutes) {
        fullDataTotalTime += value;
    }
    for (const [_, value] of lastMonthTensOfMinutes) {
        lastMonthTotalTime += value;
    }
    for (const [_, value] of lastWeekTensOfMinutes) {
        lastWeekTotalTime += value;
    }
    
    for(i = 0, length = fullDataTensOfMinutes.length; i < length; i++){
        fullDataTensOfMinutes[i][1] = fullDataTensOfMinutes[i][1] / fullDataTotalTime * 100;
    }
    for(i = 0, length = lastMonthTensOfMinutes.length; i < length; i++){
        lastMonthTensOfMinutes[i][1] = lastMonthTensOfMinutes[i][1] / lastMonthTotalTime * 100;
    }
    for(i = 0, length = lastWeekTensOfMinutes.length; i < length; i++){
        lastWeekTensOfMinutes[i][1] = lastWeekTensOfMinutes[i][1] / lastWeekTotalTime * 100;
    }

    // document.getElementById('lastMonthChart').style.display = 'block';
    // document.getElementById('lastWeekChart').style.display = 'block';
    
    drawActivityChart(fullDataTensOfMinutes, "fullChart");
    drawActivityChart(lastMonthTensOfMinutes, "lastMonthChart");
    drawActivityChart(lastWeekTensOfMinutes, "lastWeekChart");
    
    fullDataEmotions = getEmotions(filteredData, actions);
    lastMonthEmotions = getEmotions(lastMonthData, actions);
    lastWeekEmotions = getEmotions(lastWeekData, actions);

    displayEmotionInsights(fullDataEmotions, "fullChart");
    displayEmotionInsights(lastMonthEmotions, "lastMonthChart");
    displayEmotionInsights(lastWeekEmotions, "lastWeekChart");
});

function displayEmotionInsights(emotions, containerId) {
    const container = document.getElementById(containerId);
    const insightsDiv = document.createElement('div');
    insightsDiv.className = 'emotion-insights';
    
    for (const [emotion, stats] of Object.entries(emotions)) {
        const emotionDiv = document.createElement('div');
        emotionDiv.className = 'emotion-card';
        
        let positiveCorrelations = stats.topPositive.map(([activity, correlation]) => 
            `<li>${activity}: ${correlation.toFixed(2)}</li>`).join('');
        let negativeCorrelations = stats.topNegative.map(([activity, correlation]) => 
            `<li>${activity}: ${correlation.toFixed(2)}</li>`).join('');

        emotionDiv.innerHTML = `
            <h3>${emotion}</h3>
            <p>Mean: ${stats.mean.toFixed(2)}</p>
            <h4>Top 5 Positive Correlations:</h4>
            <ol>${positiveCorrelations}</ol>
            <h4>Top 5 Negative Correlations:</h4>
            <ol>${negativeCorrelations}</ol>
        `;
        insightsDiv.appendChild(emotionDiv);
    }
    
    container.appendChild(insightsDiv);
}