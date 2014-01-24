window.setTimeout(function() {
	var actions = {
		left : null,
		right : null,
		up : null,
		down : null
	};

	for (var action in actions) {
		(function() {
			var laction = action;
			document.getElementById(action).onclick = function() {
				var request = new XMLHttpRequest();
				request.open("get", "../control/" + laction, false);
				request.send();
				return false;
			};
		}());
	}
}, 1000);
