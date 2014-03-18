window.setTimeout(function() {
	document.getElementById('blackout').onclick = function() {
		var request = new XMLHttpRequest();
		request.open("get", "/blackout", false);
		request.send();
		return false();
	};
}, 1000);
