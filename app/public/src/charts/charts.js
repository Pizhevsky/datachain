$(document).ready(() => {
	var margin = {top: 20, right: 20, bottom: 30, left: 50},
		width = 960 - margin.left - margin.right,
		height = 500 - margin.top - margin.bottom;

	var formatTime = d3.timeFormat("%H-%M-%S");

	var parseDate = d3.timeParse("%Q");

	var parseIntradayDate = d3.timeParse("%Y%m%d%H%M%Z");

	var zoom = d3.zoom().on("zoom", zoomed);

	var x = techan.scale.financetime().range([0, width]);

	var y = d3.scaleLinear().range([height, 0]);

	var yVolume = d3.scaleLinear().range([y(0), y(0.2)]);

	var ohlc = techan.plot.ohlc().xScale(x).yScale(y);

	var sma0 = techan.plot.sma().xScale(x).yScale(y);

	var sma0Calculator = techan.indicator.sma().period(10);

	var sma1 = techan.plot.sma().xScale(x).yScale(y);

	var sma1Calculator = techan.indicator.sma().period(20);

	var volume = techan.plot.volume()
		.accessor(ohlc.accessor())   // Set the accessor to a ohlc accessor so we get highlighted bars
		.xScale(x)
		.yScale(yVolume);

	var xAxis = d3.axisBottom(x);

	var yAxis = d3.axisLeft(y);

	var volumeAxis = d3.axisRight(yVolume)
		.ticks(3)
		.tickFormat(d3.format(",.3s"));

	var timeAnnotation = techan.plot.axisannotation()
		.axis(xAxis)
		.orient('bottom')
		.format(d3.timeFormat('%Y-%m-%d'))
		.width(65)
		.translate([0, height]);

	var ohlcAnnotation = techan.plot.axisannotation()
		.axis(yAxis)
		.orient('left')
		.format(d3.format(',.2f'));

	var volumeAnnotation = techan.plot.axisannotation()
		.axis(volumeAxis)
		.orient('right')
		.width(35);

	var crosshair = techan.plot.crosshair()
		.xScale(x)
		.yScale(y)
		.xAnnotation(timeAnnotation)
		.yAnnotation([ohlcAnnotation, volumeAnnotation])
		.on("move", move);

	var svg = d3.select("#container").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom);

	console.log('svg:', d3.select("#container"));

	var defs = svg.append("defs");

	defs.append("clipPath")
		.attr("id", "ohlcClip")
		.append("rect")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", width)
		.attr("height", height);

	svg = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var ohlcSelection = svg.append("g")
		.attr("class", "ohlc")
		.attr("transform", "translate(0,0)");

	ohlcSelection.append("g")
		.attr("class", "volume")
		.attr("clip-path", "url(#ohlcClip)");

	ohlcSelection.append("g")
		.attr("class", "candlestick")
		.attr("clip-path", "url(#ohlcClip)");

	ohlcSelection.append("g")
		.attr("class", "indicator sma ma-0")
		.attr("clip-path", "url(#ohlcClip)");

	ohlcSelection.append("g")
		.attr("class", "indicator sma ma-1")
		.attr("clip-path", "url(#ohlcClip)");

	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")");

	svg.append("g")
		.attr("class", "y axis")
		.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", 6)
		.attr("dy", ".71em")
		.style("text-anchor", "end")
		.text("Price ($)");

	svg.append("g")
		.attr("class", "volume axis");

	svg.append('g')
		.attr("class", "crosshair ohlc");

	var coordsText = svg.append('text')
		.style("text-anchor", "end")
		.attr("class", "coords")
		.attr("x", width - 5)
		.attr("y", 15);

	var feed;

	setTimeout(getData, 10000);
	function getData () {
		$.ajax('https://api.bitfinex.com/v2/candles/trade:1h:tBTCUSD/hist').done(response => {
			let data = response.map(item => {
					return {
						Date: item[0],
						Open: item[1],
						High: item[3],
						Low: item[4],
						Close: item[2],
						Volume: item[5]
					};
			});
			console.log('get data:', data);

			draw(data);
		});
	}

	function draw(csv) {
		var accessor = ohlc.accessor();
		console.log('draw');
		feed = csv.map(function(d) {
			//let dateFormat = formatTime(new Date(d.Date));
			return {
				date: parseIntradayDate(d.Date),
				open: +d.Open,
				high: +d.High,
				low: +d.Low,
				close: +d.Close,
				volume: +d.Volume
			};
		}).sort(function(a, b) { return d3.ascending(accessor.d(a), accessor.d(b)); });

		// Start off an initial set of data
		console.log('draw data:', feed);
		redraw(); //.slice(0, 30));
	};

	function redraw() {
		var accessor = ohlc.accessor();
		//console.log('redraw data:', data);
		x.domain(feed.map(accessor.d));
		// Show only 150 points on the plot
		x.zoomable().domain([0, feed.length]);

		// Update y scale min max, only on viewable zoomable.domain()
		y.domain(techan.scale.plot.ohlc(feed).domain());
		yVolume.domain(techan.scale.plot.volume(feed).domain());

		// Setup a transition for all that support
		svg
		//          .transition() // Disable transition for now, each is only for transitions
		.each(function() {
			var selection = d3.select(this);
			selection.select('g.x.axis').call(xAxisTechanIntraday); // .call(xAxis);
			selection.select('g.y.axis').call(yAxis);
			selection.select("g.volume.axis").call(volumeAxis);

			selection.select("g.candlestick").datum(feed).call(ohlc);
			selection.select("g.sma.ma-0").datum(sma0Calculator(feed)).call(sma0);
			selection.select("g.sma.ma-1").datum(sma1Calculator(feed)).call(sma1);
			selection.select("g.volume").datum(feed).call(volume);

			svg.select("g.crosshair.ohlc").call(crosshair);
		});
	}

	function zoomed() {
		var transform = d3.event.transform;
		techanIntradayTime.zoomable().domain(transform.rescaleX(techanIntradayTimeInit).domain());

		xAxisIntraday.scale(transform.rescaleX(xIntraday));

		var rescaledY = transform.rescaleY(y);
		yAxis.scale(rescaledY);
		candlestick.yScale(rescaledY);

		// Emulates D3 behaviour, required for financetime due to secondary zoomable scale
		x.zoomable().domain(transform.rescaleX(zoomableInit).domain());

		redraw();
    }

	function move(coords) {
		coordsText.text(
			timeAnnotation.format()(coords.x) + ", " + ohlcAnnotation.format()(coords.y)
		);
	}

});