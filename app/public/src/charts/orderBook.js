const draw = (unsortedData, target, d3 = window.d3) => {
	const margin = { top: 20, right: 20, bottom: 30, left: 40 };
	const width = target.node().clientWidth - margin.left - margin.right;
	const height = target.node().clientHeight - margin.top - 2*margin.bottom;
	const x = d3.scaleLinear().range([0, width]);
	const y = d3.scaleLinear().range([height, 0]);

	let yMin = 0;
	let fix = 2;
	const data = (function (bids, asks) {
		let maxBid = parseFloat(bids.slice(0,1)[0].price);
		let spread = parseFloat(asks.slice(0,1)[0].price) - maxBid;
		let middle = maxBid + spread / 2;
		let step = Math.min(10, spread);
		let max = 0;
		let priceMaxLength = 0;

		function summarize(array, type) {
			let isBid = type == 'bid',
				stepPrice = isBid ? 1000000 : 0,
				sign = isBid ? -1 : 1,
				result = [],
				totalAmount = 0,
				marketPrice = 0;

			array.forEach(item => {
				marketPrice += parseFloat(item.price) * item.amount;
				totalAmount += parseFloat(item.amount);
				if(parseFloat(item.price) <  2 * marketPrice / totalAmount) {
					if (isBid && item.price < stepPrice || !isBid && item.price > stepPrice) {
						stepPrice = parseFloat(item.price) + sign * step;
						result.push({
							orderPrice: parseFloat(item.price),
							orderAmount: item.amount,
							totalPrice: marketPrice / totalAmount,
							totalAmount: totalAmount,
							type
						});
					} else {
						result[result.length - 1].totalAmount += parseFloat(item.amount);
					}
					priceMaxLength = Math.max(priceMaxLength, item.price.toString().length - parseInt(item.price));
				}
			});
			max = Math.max(totalAmount, max);

			return result;
		}

		let bidsResult = summarize(bids, 'bid').reverse();
		let asksResult = summarize(asks, 'ask');

		yMin = -5*max/height;
		fix = spread > 10 ? 2 : priceMaxLength;

		bidsResult.push({
			orderPrice: middle,
			orderAmount: spread,
			totalAmount: max,
			type: 'spread'
		});

		return bidsResult.concat(asksResult);

	})(unsortedData.bids, unsortedData.asks);

	//console.log(yMin, 'draw data:', data);

	// x.domain([
	// 	d3.min(data, d => d.price),
	// 	d3.max(data, d => d.price) + 1,
	// ]);
	x.domain(d3.extent(data, d => d.orderPrice));
	y.domain([yMin, d3.max(data, d => d.totalAmount)]);

	$('svg').empty();
	const g = target.append('g')
		.attr('transform', `translate(${margin.left},${margin.top})`);
	
	g.append('g')
	 .attr('class', 'axis axis--x')
	 .attr('transform', `translate(0,${height})`)
	 .call(d3.axisBottom(x));

	g.append('g')
	 .attr('class', 'axis axis--y')
	 .call(d3.axisLeft(y));

	// Define the div for the tooltip
	const tooltip = d3.select('.tooltip').html('');

	g.selectAll('.bar')
		.data(data)
		.enter().append('rect')
		.attr('class', d => `bar ${d.type}`)
		.attr('x', d => {
			//let c = d.type == 'bid' ? -10 : 10;
			return x(d.orderPrice); // + c;
		})
		.attr('y', d => y(d.totalAmount))
		.attr('width', (d, i) => {
			//return width/data.length - 5;
			// is there a next element and do they have the same type:
			// fill until the next order
			if(d.type == 'spread') {
				return 5;
			}
			if (data[i + 1] && data[i + 1].type === d.type) {
				return x(data[i + 1].orderPrice) - x(d.orderPrice) + 2;
				// is there a next element and they don't have the same type:
				// market price valley
			} else if (data[i + 1]) {
				return (x.range()[1] - x.range()[0]) / data.length + 2;
			}
			// this is the last element: fill until the end of the graph
			return x.range()[1] - x(d.orderPrice) + 2;
		})
		.attr('height', d => height - y(d.totalAmount))
		.on('mouseover', (d) => {
			tooltip.transition()
				.duration(500)
				.style('opacity', 1);

			let html = '<table>';
			if (d.type == 'spread') {
				html += `<tr><td>Spread:</td></tr><tr><td>${(d.orderPrice - d.orderAmount / 2).toFixed(fix)} -</td></tr><tr><td>${(d.orderPrice + d.orderAmount / 2).toFixed(fix)}</td></tr>`;
			} else {
				d.orderPrice = parseFloat(d.orderPrice).toFixed(fix);
				d.totalPrice = parseFloat(d.totalPrice).toFixed(fix);
				Object.keys(d).forEach((key) => {
					html += `<tr><td><b>${key}</b></td><td>${d[key]}</td></tr>`;
				});
			}

			html += '</table>';

			tooltip.html(html);
		})
		.on('mouseout', () =>
			tooltip.transition().duration(500).style('opacity', 0),
		);
};
