$(document).ready(function() {
	$.get("/map", function(data) {
		console.log(data);
	})
});