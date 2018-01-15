angular.module('dashboardApp').controller('chainsController', function($scope, $http) {
	$scope.dataList = [];
	$scope.dataTable = [];
	$scope.Total = null;
	//$scope.extra = null;
	$scope.isLoading = false;
	$scope.svgShow = false;
	$scope.tableShow = false;
	$scope.jsonError = '';
	$scope.buttons = [{
		text: 'Generate Last',
		url: 'https://dm.fly7.ru/manbtc/hs/chains/last/' + getDate() + '?n=5'
	},{
		text: '2017-12-18',
		url: 'https://dm.fly7.ru/manbtc/hs/chains/data/20171201?n=0&m=100',
		total: 'https://dm.fly7.ru/manbtc/hs/chains/total/20171218'
	},{
		text: '2017-12-17',
		url: 'https://dm.fly7.ru/manbtc/hs/chains/data/20171217?n=0&m=100',
		total: 'https://dm.fly7.ru/manbtc/hs/chains/total/20171217'
	},{
		text: '2017-12-16',
		url: 'https://dm.fly7.ru/manbtc/hs/chains/data/20171216?n=0&m=100',
		total: 'https://dm.fly7.ru/manbtc/hs/chains/total/20171216'
	},{
		text: '2017-12-15',
		url: 'https://dm.fly7.ru/manbtc/hs/chains/data/20171215?n=0&m=100',
		total: 'https://dm.fly7.ru/manbtc/hs/chains/total/20171215'
	},{
		text: '2017-12-14',
		url: 'https://dm.fly7.ru/manbtc/hs/chains/data/20171214?n=0&m=100',
		total: 'https://dm.fly7.ru/manbtc/hs/chains/total/20171214'
	},{
		text: '2017-12-13',
		url: 'https://dm.fly7.ru/manbtc/hs/chains/data/20171213?n=0&m=100',
		total: 'https://dm.fly7.ru/manbtc/hs/chains/total/20171213'
	},{
		text: '2017-12-12',
		url: 'https://dm.fly7.ru/manbtc/hs/chains/data/20171212?n=0&m=100',
		total: 'https://dm.fly7.ru/manbtc/hs/chains/total/20171212'
	},{
		text: '2017-12-11',
		url: 'https://dm.fly7.ru/manbtc/hs/chains/data/20171211?n=0&m=100',
		total: 'https://dm.fly7.ru/manbtc/hs/chains/total/20171211'
	},{
		text: '2017-12-10',
		url: 'https://dm.fly7.ru/manbtc/hs/chains/data/20171210?n=0&m=100',
		total: 'https://dm.fly7.ru/manbtc/hs/chains/total/20171210'
	},{
		text: '2017-12-09',
		url: 'https://dm.fly7.ru/manbtc/hs/chains/data/20171209?n=0&m=100',
		total: 'https://dm.fly7.ru/manbtc/hs/chains/total/20171209'
	},{
		text: '2017-12-08',
		url: 'https://dm.fly7.ru/manbtc/hs/chains/data/20171208?n=0&m=100',
		total: 'https://dm.fly7.ru/manbtc/hs/chains/total/20171208'
	},{
		text: '2017-12-07',
		url: 'https://dm.fly7.ru/manbtc/hs/chains/data/20171207?n=0&m=100',
		total: 'https://dm.fly7.ru/manbtc/hs/chains/total/20171207'
	},{
		text: '2017-12-06',
		url: 'https://dm.fly7.ru/manbtc/hs/chains/data/20171206?n=0&m=100',
		total: 'https://dm.fly7.ru/manbtc/hs/chains/total/20171206'
	},{
		text: '2017-12-05',
		url: 'https://dm.fly7.ru/manbtc/hs/chains/data/20171205?n=0&m=100',
		total: 'https://dm.fly7.ru/manbtc/hs/chains/total/20171205'
	},{
		text: '2017-12-04',
		url: 'https://dm.fly7.ru/manbtc/hs/chains/data/20171204?n=0&m=100',
		total: 'https://dm.fly7.ru/manbtc/hs/chains/total/20171204'
	},{
		text: '2017-12-03',
		url: 'https://dm.fly7.ru/manbtc/hs/chains/data/20171203?n=0&m=100',
		total: 'https://dm.fly7.ru/manbtc/hs/chains/total/20171203'
	},{
		text: '2017-12-02',
		url: 'https://dm.fly7.ru/manbtc/hs/chains/data/20171202?n=0&m=100',
		total: 'https://dm.fly7.ru/manbtc/hs/chains/total/20171202'
	},{
		text: '2017-12-01',
		url: 'https://dm.fly7.ru/manbtc/hs/chains/data/20171201?n=0&m=100',
		total: 'https://dm.fly7.ru/manbtc/hs/chains/total/20171201'
	},{
		text: '2017-11-30',
		url: 'https://dm.fly7.ru/manbtc/hs/chains/data/20171130?n=0&m=100',
		total: 'https://dm.fly7.ru/manbtc/hs/chains/total/20171130'
	},{
		text: '2017-11-29',
		url: 'https://dm.fly7.ru/manbtc/hs/chains/data/20171129?n=0&m=100',
		total: 'https://dm.fly7.ru/manbtc/hs/chains/total/20171129'
	},{
		text: '2017-11-28',
		url: 'https://dm.fly7.ru/manbtc/hs/chains/data/20171128?n=0&m=100',
		total: 'https://dm.fly7.ru/manbtc/hs/chains/total/20171128'
	},{
		text: '2017-11-27',
		url: 'https://dm.fly7.ru/manbtc/hs/chains/data/20171127?n=100',
		total: 'https://dm.fly7.ru/manbtc/hs/chains/total/20171127'
	}];



	function getDate() {
		var date = new Date(),
			str = [
				date.getUTCFullYear(),
				date.getUTCMonth() + 1,
				date.getUTCDate()
			].map(item => {
				return item < 10 ? `0${item}` : item;
			}).join('');

		return str;
	}


	// $scope.renderScheme = function(item) {
	// 	if (item.length == 0) {
	// 		showErrorMessage('Data is empty.');
	// 		return;
	// 	}
	// 	if (item.length > 6) {
	// 		showErrorMessage('Maximum chain link count is 6.');
	// 		return;
	// 	}
	//
	// 	$scope.extra = item;
	// 	$scope.data = item.Orders;
	// };

	$scope.onClickScheme = function() {
		console.log('clicked on:', this);
		// let src = $scope.data[index];
		// $scope.$apply(() => {
		// 	$scope.click.content = src.Content && src.Content[name] ? src.Content[name] : '<p>content not found</p>';
		// });
	};

	// getData();
	// setTimeout(getData, 30000);

	$scope.getData = function(item) {
		console.log('try to get url:', item);
		$scope.isLoading = true;
		if (item.text == 'Generate Last') {
			console.log('start last');
			$scope.svgShow = true;
			$http.get(item.url)
				.then(response => {
					console.log('Chains response:', response);
					$scope.dataList = response.data;
					$scope.isLoading = false;
				});
		} else {
			console.log('not last');
			$scope.tableShow = false;
			$http.get(item.total)
				.then(response => {
					console.log('Chains total response:', response);
					$scope.Total = response.data;
					$http.get(item.url)
						.then(response => {
							$scope.tableShow = true;
							console.log('Chains response:', response);

							$scope.dataTable = response.data.reverse();
							$scope.isLoading = false;
						});
				});
		}
	}

	function toNumber(str) {
		return parseFloat(str.split(',').join('.'));
	}

	function showErrorMessage(message) {
		$scope.jsonError = message;
		setTimeout(() => {
			$scope.$apply(() => {
				$scope.jsonError = '';
			});
		}, 2000);
	}
});

angular.module('dashboardApp').directive('drawChain', function() {
	return {
		restrict: 'E',
		scope: {
			data: '=schemeData',
			extra: '='
		},
		link: function (scope, element, attrs) {
			let style = {
				text12: {
					'font-family': 'Arial',
					'font-size': '12px'
				},
				text14: {
					'font-family': 'Arial',
					'font-size': '14px'
				},
				text22: {
					'font-family': 'Arial',
					'font-size': '22px',
					'font-weight': 'bold'
				},
				textBg: {
					'fill': '#fff',
					'stroke': '#fff'
				},
				thickness: {
					'stroke': '#000',
					'stroke-width': '1.5',
					'stroke-opacity': '1',
					'stroke-linejoin': 'round'
				},
				circleBtn: {
					'fill': 'rgba(0,0,0,0)',
					'cursor': 'pointer'
				},
				rectBtn: {
					'fill': 'rgba(0,0,0,0)',
					'stroke-opacity': '0',
					'cursor': 'pointer'
				}
			};
			let r = 40; // circle radius
			let ap = 10; // arrow padding
			let al = 100; // arrow length
			let ep = 20; // exchange padding
			let tl = 60; // text length
			let chainWidth = al + 2*ap + 2*r; // between centers of circles
			let width = 1520;
			let height = 230;
			let paper;

			scope.$watch('data', function(value) {
				console.log('watch chain data:', value);
				if (value && value.length) {
					let padding = r + 40; //(width - (chainWidth * value.length + 2*r)) / 2 + 40;

					element[0].innerHTML = '';

					paper = Raphael(element[0], width, height);
					paper.canvas.style.backgroundColor = '#fff';
					paper.canvas.style.border = '1px solid #dcdcdc';
					paper.canvas.style.shapeRendering = 'geometricprecision';
					//paper.canvas.style.transform = 'scale(0.5, 0.5) translate(-750px, -160px)';

					console.log('extra:', scope.extra);
					// paper.text(padding + 20, height/2 - r - 40, 'BTC In: ' + scope.extra.BTCin).attr(style.text22);
					// paper.text(value.length * chainWidth + padding, height/2 + r + 45, 'BTC Out: ' + scope.extra.BTCout).attr(style.text22);

					for (let i = 0; i < value.length; i++) {
						drawChain(i * chainWidth + padding, height/2 - 20, value[i], i);
					}

					paper.path(`
						M${padding - r} ${height/2 - 20}
						L${padding - r - 20} ${height/2 - 20}
						L${padding - r - 20} ${height/2 + 2*ep + 30}
						L${value.length * chainWidth + padding + r + 20} ${height/2 + 2*ep + 30}
						L${value.length * chainWidth + padding + r + 20} ${height/2 - 20}
						L${value.length * chainWidth + padding + r} ${height/2 - 20}
					`).attr(style.thickness).attr('arrow-end', 'block-wide-long');

					//paper.text((value.length * chainWidth)/2, height/2 + 2*ep + 45, scope.extra.Date + ': ' + scope.extra.Profit + '%').attr(style.text22);
					paper.text(padding + 30, height/2 + 2*ep + 45, 'BTC In: ' + scope.extra.BTCin).attr(style.text22);
					paper.text(value.length * chainWidth + padding - 35, height/2 + r + 45, 'BTC Out: ' + scope.extra.BTCout).attr(style.text22);
					paper.text(padding + 40, height/2 - r - 40, scope.extra.Date).attr(style.text22);
					paper.text(padding + (value.length * chainWidth)/2, height/2 + 2*ep + 45, 'Profit: ' + scope.extra.Profit + '%').attr(style.text22);
				}
			});

			function drawChain(x, y, data, i) {

				if (i == 0) {
					drawCircle(x, y, i, data, 'Currency1');
				}
				drawCircle(x + chainWidth, y, i, data, 'Currency2');

				// arrow with price
				paper.path(`
					M${x+r+ap} ${y}
					L${x+r+ap+al} ${y}
				`).attr(style.thickness).attr('arrow-end', 'block-wide-long');

				paper.rect(x+r+ap+al/2-tl/2, y-10, tl-4, 20).attr(style.textBg);
				paper.text(x+r+ap+al/2-2, y, data.Price).attr(style.text12);

				drawRectBtn(x+r+ap+al/2-tl/2, y-10 , i);

				// exchange line with name
				let d = i % 2 ? -1 : 1;
				paper.path(`
					M${x} ${y+d*r}
					L${x} ${y+d*(r+ep)}
					L${x+2*r+2*ap+al} ${y+d*(r+ep)}
					L${x+2*r+2*ap+al} ${y+d*r}
				`).attr(style.thickness);

				paper.text(x+r+ap+al/2, y+d*(r+ep+10), data.Exchange).attr(style.text14);

				drawRectBtn(x+r+ap+al/2-tl/2, y+d*(r+ep+10)-10, i);
			}

			function drawCircle(x, y, i, data, name) {
				paper.circle(x, y, r).attr(style.thickness);
				paper.text(x, y, data[name]).attr(style.text14);
				paper.circle(x, y, r)
					.attr(style.circleBtn)
					.data('link', i)
					.data('name', name);
					//.click(clickHandler);
			}

			function drawRectBtn(x, y, i) {
				paper.rect(x, y, tl-4, 20).attr(style.rectBtn)
					.data('link', i)
					.data('name', 'Exchange');
					//.click(clickHandler);
			}

			// function clickHandler() {
			// 	let index = this.data('link'),
			// 		name = this.data('name');
			// 	scope.triggerSchemeClick(index, name);
			// }
		}
	};
});