var app = angular.module('loginApp', []);

app.controller('loginController', function($scope, $timeout, $http) {
	$scope.view = 'login';
	$scope.isEmailSending = false;
	$scope.resetAnswer = '';
	$scope.errorMessage = '';
	$scope.formData = {};
	$scope.blockTimeLeft = '2:00:00';

	if (window.location.search && window.location.search.length == 65) {
		$scope.view = 'signup';
	}

	$scope.setView = function(view) {
		$scope.view = view;
	};

	$scope.signUp = function() {
		var data = $scope.formData;

		data['g-recaptcha-response'] = $('#g-recaptcha-response').val();

		if (!checkEmail(data.email)) {
			showErrorMessage(`Wrong email`);
			return false;
		}

		if (!checkPassword(data.password)) {
			showErrorMessage(`Password isn't strong enough`);
			return false;
		}

		if (data.password != data.confirm) {
			showErrorMessage('Password mismatch');
			return false;
		}

		if (window.location.search) {
			data.referalGuid = window.location.search.slice(1);
		}

		$scope.isEmailSending = true;
		post('/signup', data, res => {
			$scope.isEmailSending = false;
			$scope.resetAnswer = res.message;
			$scope.view = 'emailSended';
		});
	};

	$scope.signIn = function() {
		post('/signin', $scope.formData, res => {
			if (res.need2FA) {
				$scope.view = '2FA';
			} else {
				window.location = '/dashboard';
			}
		});
	};
	
	$scope.check2FA = function() {
		post('/checkSecret2FA', $scope.formData, res => {
			window.location = '/dashboard';
		});
	};

	$scope.resetPassword = function() {
		$scope.isEmailSending = true;
		post('/resetPassword', $scope.formData, res => {
			$scope.isEmailSending = false;
			$scope.resetAnswer = res.message;
			$scope.view = 'emailSended';
		});
	};

	function startTimer(seconds) {
		let timer;
		function convert(time){
			if(time > 0) {
				let h = parseInt(time / 3600),
					m = parseInt((time - h*3600) / 60),
					s = time - h*3600 - m*60;
				$timeout(function () {
					$scope.blockTimeLeft = (h<10?'0'+h:h)+':'+(m<10?'0'+m:m)+':'+(s<10?'0'+s:s);
				}, 0);
			} else {
				clearInterval(timer);
				$timeout(function () {
					$scope.view = 'unlock';
				}, 0);
			}
		}
		convert(seconds);
		timer = setInterval(() => { convert(--seconds); }, 1000);
	}

	function post(url, data, cb) {
		$http.post(url, data)
			.success(function(response) {
				if (response.success) {
					cb(response);
				} else {
					$scope.isEmailSending = false;
					console.log('response error:', response);
					if (response.logout) {
						window.location = '/';
					} else {
						if (response.block) {
							startTimer(parseInt(response.blockTimeLeft/1000));
							$scope.view = 'blocked';
						} else {
							showErrorMessage(response.message);
						}
					}
				}
			})
			.error(function(response) {
				$scope.isEmailSending = false;
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

function checkEmail(email) {
	return email.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
}

function checkPassword(password) {
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
