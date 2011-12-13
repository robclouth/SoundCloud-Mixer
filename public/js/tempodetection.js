importScripts("beatdetektor.js");

self.onmessage = function(e) {
	var fftSize = 1024;
	var fft = new FFT(fftSize, 48000);

	var channel = e.data;
	var remaining = channel.length;
	var pos = 0;

	while(remaining >= fftSize) {
		var data = channel.subarray(pos, pos + fftSize);
		fft.forward(data);
		var spectrum = fft.spectrum;
		bd_med.process(pos / 48000, spectrum);
		pos += fftSize;
		remaining -= fftSize;
	}

	self.postMessage(bd_med.win_bpm_int_lo);
	//console.log((bd_med.win_bpm_int / 10.0) + " BPM / " + (bd_med.win_bpm_int_lo) + " BPM");
};
