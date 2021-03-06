$(document).ready(() => {
	var margin = {top: 20, right: 20, bottom: 30, left: 50},
            width = 960 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;

    var parseDate = d3.timeParse("%d-%b-%y%Z");

    var parseIntradayDate = d3.timeParse("%Y%m%d%H%M%Z");

	var parseMilliseconds = d3.timeParse("%Q");

    var zoomTechan = d3.zoom()
            .on("zoom", zoomed);

    // var x = d3.scaleTime()
    //         .range([0, width]);
    //
    // var xUtc = d3.scaleUtc()
    //         .range([0, width]);
    //
    // var xIntraday = d3.scaleTime()
    //         .range([0, width]);
    //
    // var xIntradayUtc = d3.scaleUtc()
    //         .range([0, width]);
    //
    // var techanTime = techan.scale.financetime()
    //         .range([0, width]);
    //
    // var techanTimeNonClamped = techan.scale.financetime()
    //         .range([0, width]);
    //
    // var techanTimeUtcNonClamped = techan.scale.financetime.utc()
    //         .range([0, width]);

    var techanIntradayTime = techan.scale.financetime()
            .range([0, width]);

    // var techanIntradayTimeNonClamped = techan.scale.financetime()
    //         .range([0, width]);
    //
    // var techanIntradayUtcTimeNonClamped = techan.scale.financetime.utc()
    //         .range([0, width]);

    var techanTimeInit,
        techanTimeNonClampedInit,
        techanTimeUtcNonClampedInit,
        techanIntradayTimeInit,
        techanIntradayTimeNonClampedInit,
        techanIntradayUtcTimeNonClampedInit;
    //
    // var xAxis = d3.axisBottom(x);
    //
    // var xAxisUtc = d3.axisBottom(xUtc);
    //
    // var xAxisIntraday = d3.axisBottom(xIntraday);
    //
    // var xAxisIntradayUtc = d3.axisBottom(xIntradayUtc);
    //
    // var xAxisTechan = d3.axisBottom(techanTime);
    //
    // var xAxisTechanNonClamped = d3.axisBottom(techanTimeNonClamped);
    //
    // var xAxisTechanUtcNonClamped = d3.axisBottom(techanTimeUtcNonClamped);

    var xAxisTechanIntraday = d3.axisBottom(techanIntradayTime);

    // var xAxisTechanIntradayNonClamped = d3.axisBottom(techanIntradayTimeNonClamped);
    //
    // var xAxisTechanIntradayUtcNonClamped = d3.axisBottom(techanIntradayUtcTimeNonClamped);

    var svg = d3.select("#charts_time_axis").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("text")
            .attr("transform", "translate(0," + height*0.05 + ")")
            .attr("y", -6)
            .text("TechanJS Finance Time Intraday (clamped zoom)");

    svg.append("g")
            .attr("class", "x axis techan intraday clamped")
            .attr("transform", "translate(0," + height*0.05 + ")");

    // svg.append("text")
    //         .attr("transform", "translate(0," + height*0.15 + ")")
    //         .attr("y", -6)
    //         .text("TechanJS Finance Time Intraday (non clamped zoom)");
    //
    // svg.append("g")
    //         .attr("class", "x axis techan intraday nonclamped")
    //         .attr("transform", "translate(0," + height*0.15 + ")");
    //
    // svg.append("text")
    //         .attr("transform", "translate(0," + height*0.25 + ")")
    //         .attr("y", -6)
    //         .text("TechanJS Finance Time Intraday UTC (non clamped zoom)");
    //
    // svg.append("g")
    //         .attr("class", "x axis techan intraday-utc nonclamped")
    //         .attr("transform", "translate(0," + height*0.25 + ")");
    //
    // svg.append("text")
    //         .attr("transform", "translate(0," + height*0.35 + ")")
    //         .attr("y", -6)
    //         .text("D3 Time Intraday");
    //
    // svg.append("g")
    //         .attr("class", "x axis d3 intraday")
    //         .attr("transform", "translate(0," + height*0.35 + ")");
    //
    // svg.append("text")
    //         .attr("transform", "translate(0," + height*0.45 + ")")
    //         .attr("y", -6)
    //         .text("D3 Time Intraday UTC");
    //
    // svg.append("g")
    //         .attr("class", "x axis d3 intraday-utc")
    //         .attr("transform", "translate(0," + height*0.45 + ")");
    //
    // svg.append("g")
    //         .attr("class", "x axis techan daily clamped")
    //         .attr("transform", "translate(0," + height*0.6 + ")");
    //
    // svg.append("text")
    //         .attr("transform", "translate(0," + height*0.6 + ")")
    //         .attr("y", -6)
    //         .text("TechanJS Finance Time Daily (clamped zoom)");
    //
    // svg.append("g")
    //         .attr("class", "x axis techan daily nonclamped")
    //         .attr("transform", "translate(0," + height*0.7 + ")");
    //
    // svg.append("text")
    //         .attr("transform", "translate(0," + height*0.7 + ")")
    //         .attr("y", -6)
    //         .text("TechanJS Finance Time Daily (non clamped zoom)");
    //
    // svg.append("g")
    //         .attr("class", "x axis techan daily-utc nonclamped")
    //         .attr("transform", "translate(0," + height*0.8 + ")");
    //
    // svg.append("text")
    //         .attr("transform", "translate(0," + height*0.8 + ")")
    //         .attr("y", -6)
    //         .text("TechanJS Finance Time Daily UTC (non clamped zoom)");
    //
    // svg.append("g")
    //         .attr("class", "x axis d3 daily")
    //         .attr("transform", "translate(0," + height*0.9 + ")");
    //
    // svg.append("text")
    //         .attr("transform", "translate(0," + height*0.9 + ")")
    //         .attr("y", -6)
    //         .text("D3 Time Daily");
    //
    // svg.append("g")
    //         .attr("class", "x axis d3 daily-utc")
    //         .attr("transform", "translate(0," + height + ")");
    //
    // svg.append("text")
    //         .attr("transform", "translate(0," + height + ")")
    //         .attr("y", -6)
    //         .text("D3 Time Daily UTC");

    svg.append("rect")
            .attr("class", "pane")
            .attr("width", width)
            .attr("height", height)
            .call(zoomTechan);
 // $.ajax('https://api.bitfinex.com/v1/pubticker/btcusd').done(response => {
	// console.log(response);
 // });
    $.ajax('https://api.bitfinex.com/v2/candles/trade:1m:tBTCUSD/hist').done(response => {
		var accessor = techan.accessor.ohlc();
		console.log('response:',response);
		data = response.map(item => {
			return {
				date: parseMilliseconds(item[0]),
				open: +item[1],
				high: +item[3],
				low: +item[4],
				close: +item[2],
				volume: +item[5]
			};
		}).sort(function(a, b) { return d3.ascending(accessor.d(a), accessor.d(b)); });

		console.log('data:', data);

        // var accessor = techan.accessor.ohlc();
        //
        // data = data.map(function(d) {
        //     return {
        //         date: parseIntradayDate(d.Date+"+0000"), // Force 0 timezone offset. Time rendered should always be between 9pm-3am.
        //         open: +d.Open,
        //         high: +d.High,
        //         low: +d.Low,
        //         close: +d.Close
        //     };
        // }).sort(function(a, b) { return d3.ascending(accessor.d(a), accessor.d(b)); });

        // xIntraday.domain(d3.extent(data.map(accessor.d)));
        // xIntradayUtc.domain(d3.extent(data.map(accessor.d)));
        techanIntradayTimeInit = techanIntradayTime.domain(data.map(accessor.d)).zoomable().copy();
        // techanIntradayTimeNonClampedInit = techanIntradayTimeNonClamped.domain(data.map(accessor.d)).zoomable().clamp(false).copy();
        // techanIntradayUtcTimeNonClampedInit = techanIntradayUtcTimeNonClamped.domain(data.map(accessor.d)).zoomable().clamp(false).copy();
        draw(); // Could this ever clash with the other data load?
    });

    function zoomed() {
        var transform = d3.event.transform;
        // techanTime.zoomable().domain(transform.rescaleX(techanTimeInit).domain());
        // techanTimeNonClamped.zoomable().domain(transform.rescaleX(techanTimeNonClampedInit).domain());
        // techanTimeUtcNonClamped.zoomable().domain(transform.rescaleX(techanTimeUtcNonClampedInit).domain());
        techanIntradayTime.zoomable().domain(transform.rescaleX(techanIntradayTimeInit).domain());
        // techanIntradayTimeNonClamped.zoomable().domain(transform.rescaleX(techanIntradayTimeNonClampedInit).domain());
        // techanIntradayUtcTimeNonClamped.zoomable().domain(transform.rescaleX(techanIntradayUtcTimeNonClampedInit).domain());

        // xAxis.scale(transform.rescaleX(x));
        // xAxisUtc.scale(transform.rescaleX(xUtc));
        // xAxisIntraday.scale(transform.rescaleX(xIntraday));
        // xAxisIntradayUtc.scale(transform.rescaleX(xIntradayUtc));

        draw();
    }

    function draw() {
        // svg.select("g.x.axis.d3.daily").call(xAxis);
        // svg.select("g.x.axis.d3.daily-utc").call(xAxisUtc);
        // svg.select("g.x.axis.techan.daily.clamped").call(xAxisTechan);
        // svg.select("g.x.axis.techan.daily.nonclamped").call(xAxisTechanNonClamped);
        // svg.select("g.x.axis.techan.daily-utc.nonclamped").call(xAxisTechanUtcNonClamped);
        // svg.select("g.x.axis.d3.intraday").call(xAxisIntraday);
        // svg.select("g.x.axis.d3.intraday-utc").call(xAxisIntradayUtc);
        svg.select("g.x.axis.techan.intraday.clamped").call(xAxisTechanIntraday);
        // svg.select("g.x.axis.techan.intraday.nonclamped").call(xAxisTechanIntradayNonClamped);
        // svg.select("g.x.axis.techan.intraday-utc.nonclamped").call(xAxisTechanIntradayUtcNonClamped);
    }
});