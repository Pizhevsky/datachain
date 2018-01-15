angular.module('dashboardApp').controller('pagesController', function($scope, Starter) {
	$(document).ready(() => {
		console.log('Loaded!!');
		
		$scope.$apply(() => {
			$scope.currentPage = 'profile';
		});
	});

	$scope.changePage = function(pageName) {
		$scope.currentPage = pageName;

		Object.keys(tickers).forEach(key => {
			let timer = tickers[key];
			clearInterval(timer);
			timer = null;
		});
	};
});