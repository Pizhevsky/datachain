var app = angular.module('resetApp', []);

app.controller('resetController', function($scope, $http) {
	$scope.resetDone = false;
	$scope.isEmailSending = false;
	$scope.errorMessage = '';
	$scope.formData = {};

	$scope.resetVerify = function() {
		var data = $scope.formData;

		if (!checkPassword(data.password)) {
			showErrorMessage(`Password isn't strong enough`);
			return false;
		}

		if (data.password != data.confirm) {
			showErrorMessage('Password mismatch');
			return false;
		}

		data.token = window.location.pathname.split('/').slice(-1)[0];
		$scope.isEmailSending = true;
		post('/confirmReset', data, res => {
			$scope.resetDone = true;
		});
	};

	function post(url, data, cb) {
		$http.post(url, data)
			.success(function(response) {
				if (response.success) {
					cb(response);
				} else {
					console.log('success error:', response);
					showErrorMessage(response.message);
				}
			})
			.error(function(response) {
				console.log('error:', response);
				showErrorMessage(response.message);
			});
	}

	function showErrorMessage(message) {
		$scope.errorMessage = message;
		setTimeout(() => {
			$scope.errorMessage = '';
			$scope.$apply();
		}, 3000);
	}

});

function checkPassword(password) {
	if (!password){
		return false;
	}
	var s_letters = "qwertyuiopasdfghjklzxcvbnm"; // Буквы в нижнем регистре
	var b_letters = "QWERTYUIOPLKJHGFDSAZXCVBNM"; // Буквы в верхнем регистре
	var digits = "0123456789"; // Цифры
	var specials = "!@#$%^&*()_-+=\|/.,:;[]{}"; // Спецсимволы
	var is_s = false; // Есть ли в пароле буквы в нижнем регистре
	var is_b = false; // Есть ли в пароле буквы в верхнем регистре
	var is_d = false; // Есть ли в пароле цифры
	var is_sp = false; // Есть ли в пароле спецсимволы
	for (var i = 0; i < password.length; i++) {
		if (!is_s && s_letters.indexOf(password[i]) != -1) is_s = true;
		else if (!is_b && b_letters.indexOf(password[i]) != -1) is_b = true;
		else if (!is_d && digits.indexOf(password[i]) != -1) is_d = true;
		else if (!is_sp && specials.indexOf(password[i]) != -1) is_sp = true;
	}
	console.log(password, password.length, is_s, is_b, is_d, is_sp);
	return password.length >= 8 && is_s && is_b && is_d && is_sp;
}
