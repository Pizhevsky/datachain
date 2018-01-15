angular.module('dashboardApp').factory('AjaxService', function($http) {
	return {
		'get': function (url) {
			return $http({ method: 'GET', url })
			.then(
				function successCallback(response) {
					console.log('AjaxService GET done:', response);
				},
				function errorCallback(response) {
					console.error('AjaxService GET error:', response);
				}
			);
		},
		'post': function (url, data) {
			return $http.post(url, data)
			.then( response => {
				console.log('AjaxService POST done:', response);
			})
			.then( response => {
				console.log('AjaxService POST then:', response);
			}).finally( response => {
				console.log('AjaxService POST finally:', response);
			});
		}
	};
});