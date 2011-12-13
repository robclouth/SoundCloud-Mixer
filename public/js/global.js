function roundNumber(rnum, rlength) { // Arguments: number to round, number of decimal places
	var newnumber = Math.round(rnum*Math.pow(10,rlength))/Math.pow(10,rlength);
	return parseFloat(newnumber); // Output the result to the form field (change for your purposes)
}

//string format function
String.prototype.format = function() {
	var args = arguments;
	return this.replace(/{(\d+)}/g, function(match, number) {
		return typeof args[number] != 'undefined' ? args[number] : match;
	});
};
//soundcloud vars
var scHandler;

//audio vars
var context;

var deck1 = 0;
var deck2 = 0;
var tempo = 120.0;

var waveformView;