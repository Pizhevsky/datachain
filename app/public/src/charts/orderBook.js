const draw = (unsortedData, target, d3 = window.d3) => {
	const margin = { top: 20, right: 20, bottom: 30, left: 40 };
	const width = target.node().clientWidth - margin.left - margin.right;
	const height = target.node().clientHeight - margin.top - 2*margin.bottom;
	const x = d3.scaleLinear().range([0, width]);
	const y = d3.scaleLinear().range([height, 0]);

	let yMin = 0;
	const data = (function (bids, asks) {
		let maxBid = parseFloat(bids.slice(0,1)[0].price);
		let spread = parseFloat(asks.slice(0,1)[0].price) - maxBid;
		let middle = maxBid + spread / 2;
		let step = Math.min(10, spread);
		let max = 0;

		function summarize(array, type) {
			let isBid = type == 'bid',
				stepPrice = isBid ? 1000000 : 0,
				sign = isBid ? -1 : 1,
				result = [],
				total = 0;

			array.forEach(item => {
				total += parseFloat(item.amount);
				if (isBid && item.price < stepPrice || !isBid && item.price > stepPrice) {
					stepPrice = parseFloat(item.price) + sign * step;
					result.push({
						price: parseFloat(item.price),
						amount: item.amount,
						total,
						type
					});
				} else {
					result[result.length - 1].amount += parseFloat(item.amount);
				}
			});
			max = Math.max(total, max);

			return result;
		}

		let bidsResult = summarize(bids, 'bid').reverse();
		let asksResult = summarize(asks, 'ask');

		yMin = -5*max/height;
		bidsResult.push({
			price: middle,
			amount: spread,
			total: max,
			type: 'spread'
		});

		return bidsResult.concat(asksResult);

	})(unsortedData.bids, unsortedData.asks);

	console.log(yMin, 'draw data:', data);

	// x.domain([
	// 	d3.min(data, d => d.price),
	// 	d3.max(data, d => d.price) + 1,
	// ]);
	x.domain(d3.extent(data, d => d.price));
	y.domain([yMin, d3.max(data, d => d.total)]);

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
			return x(d.price); // + c;
		})
		.attr('y', d => y(d.total))
		.attr('width', (d, i) => {
			//return width/data.length - 5;
			// is there a next element and do they have the same type:
			// fill until the next order
			if(d.type == 'spread') {
				return 5;
			}
			if (data[i + 1] && data[i + 1].type === d.type) {
				return x(data[i + 1].price) - x(d.price) + 2;
				// is there a next element and they don't have the same type:
				// market price valley
			} else if (data[i + 1]) {
				return (x.range()[1] - x.range()[0]) / data.length + 2;
			}
			// this is the last element: fill until the end of the graph
			return x.range()[1] - x(d.price) + 2;
		})
		.attr('height', d => height - y(d.total))
		.on('mouseover', (d) => {
			tooltip.transition()
				.duration(500)
				.style('opacity', 1);


			let html = '<table>';
			if (d.type == 'spread') {
				html += `<tr><td>Spread: ${(d.price - d.amount / 2).toFixed(2)} - ${(d.price + d.amount / 2).toFixed(2)}</td></tr>`;
			} else {
				d.price = parseFloat(d.price).toFixed(2);
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
