/**
 * Class Deck
 */
Deck = function(id, index) {
	this.id = id;
	this.source = 0;
	this.buffer = 0;
	this.request = 0;
	this.currentTrackData = 0;
	this.currentPlayPosition = 0;
	this.baseTempo = 0;
	this.tempo = 0;
	this.otherDeck = 0;
	this.playbackRate = 1;
	this.index = index;
	this.nudgeTime = 0;
	this.paused = true;
	this.playbackRateChanges = [];
	this.beatTime = 0;

	this.gainNode = context.createGainNode();
	this.gainNode.gain.value = 1;
    
    this.convolver = context.createConvolver();
    this.convolverWet = context.createGainNode();
    this.convolverWet.gain.value = 0.0;

	this.lowFilter = context.createLowPass2Filter();
	this.lowFilter.cutoff.value = context.sampleRate * 0.5;
	this.lowFilter.resonance.value = 5.0;

	this.highFilter = context.createHighPass2Filter();
	this.highFilter.cutoff.value = 0.0;
	this.highFilter.resonance.value = 5.0;

	this.xFaderGain = context.createGainNode();

    this.gainNode.connect(this.convolver);
	this.gainNode.connect(this.lowFilter);
    this.convolver.connect(this.convolverWet);
    this.convolverWet.connect(this.lowFilter);
    
	this.lowFilter.connect(this.highFilter);
	this.highFilter.connect(this.xFaderGain);
	this.xFaderGain.connect(context.destination);

	this.cuePoints = [];
	this.cuePoints[0] = 0;

	if(id == "deck1") {
		this.fullWaveformElem = $(".fullWaveform1");
		this.playheadElem = $(".playhead1");
		this.deckStatusElem = $(".deckStatus1");

	} else if(id == "deck2") {
		this.fullWaveformElem = $(".fullWaveform2");
		this.playheadElem = $(".playhead2");
		this.deckStatusElem = $(".deckStatus2");
	}
}

Deck.prototype.setReverbLevel = function(val) {
	this.convolverWet.gain.value = val;
}

Deck.prototype.loading = function() {
	if(this.request){
		//this.request.onprogress();
		
	}
}

Deck.prototype.triggerLoad = function(trackData) {
	this.currentTrackData = trackData;
	this.baseTempo = this.currentTrackData.bpm;
	this.setTempo(this.currentTrackData.bpm);

	var self = this;
	scHandler.getMediaLink(trackData, function(url) {
		self.load(url)
	});

	this.updateUI();
}

Deck.prototype.load = function(url) {
	this.url = url;
	var self = this;

	var proxyUrl = "./php/proxy.php?url=" + url + "&mode=native";

	this.deckStatusElem.text('Loading track...');

	//setup full track waveform image
	this.fullWaveformElem.css("background-color", "#333");
	this.fullWaveformElem.css("background-image", "url(" + this.currentTrackData.waveform_url + ")");
	this.fullWaveformElem.width(0);

	// Load asynchronously
	var request = new XMLHttpRequest();
	request.open("GET", proxyUrl, true);
	request.responseType = "arraybuffer";

	this.request && this.request.abort();
	this.request = request;

	request.onprogress = function(ev) {
		self.fullWaveformElem.width(((ev.loaded / ev.total) * 100) + '%');
		//self.deckStatusElem.text('Loading track: ' + ((ev.loaded / ev.total) * 100).toFixed(0) + '%');
	};

	request.onload = function() {		
		if(request.readyState != 4){
			self.request = 0;
			return;
		}
				
		self.request = 0;
		self.fullWaveformElem.width('100%');
		self.deckStatusElem.text('Decoding...');

		context.decodeAudioData(request.response, function(buffer) {
			self.buffer = buffer;
			self.loaded();
		});
	}

	request.onerror = function() {
		alert("error.");
	}

	request.send();
}

Deck.prototype.detectTempo = function() {
	var self = this;
	var fftSize = 1024;
	var fft = new FFT(fftSize, this.buffer.sampleRate);
	var tempoDetector = new BeatDetektor(85, 169);

	var channel = this.buffer.getChannelData(0);
	var remaining = channel.length;
	var pos = 0;
	var busy = false;

	var processor = setInterval(function() {
		if(!busy) {
			busy = true;

			var data = channel.subarray(pos, pos + fftSize);
			fft.forward(data);
			var spectrum = fft.spectrum;
			tempoDetector.process(pos / self.buffer.sampleRate, spectrum);
			pos += fftSize;
			remaining -= fftSize;

			self.deckStatusElem.text('Detecting tempo: ' + (pos / channel.length) * 100 + '%');

			if(remaining < fftSize) {
				self.baseTempo = tempoDetector.win_bpm_int / 10.0;
				self.setTempo(self.baseTempo);

				scHandler.addBpm(self.currentTrackData.id, self.baseTempo);

				for(var i in scHandler.searchResults) {
					if(scHandler.searchResults[i].id == self.currentTrackData.id) {
						scHandler.searchResults[i].bpm = bpm;
					}
				}

				self.deckStatusElem.text('Finished detecting tempo.');

				clearInterval(processor);
			}
			busy = false;
		}
	}, 1);
}
//when track loaded and decoded
Deck.prototype.loaded = function() {
	this.deckStatusElem.text('Decoding finished.');

	this.pause();
	this.skipToTime(0);

	this.setCuePoint(0, 0);

	if(!this.tempo) {
		this.deckStatusElem.text('Detecting tempo: 0%');

		this.detectTempo();
	}
}
//get current playback position
Deck.prototype.getCurrentPlayPosition = function() {
	if(!this.paused) {
		var d = 0;
		var now = context.currentTime;
		var t1, t2, v;
		for(var i = 0; i < this.playbackRateChanges.length; i++) {
			if(i == this.playbackRateChanges.length - 1)
				t2 = now;
			else
				t2 = this.playbackRateChanges[i + 1].t;
			t1 = this.playbackRateChanges[i].t;
			v = this.playbackRateChanges[i].v;
			d += (t2 - t1) * v;
		}

		this.currentPlayPosition = d;
		return this.currentPlayPosition;
	} else
		return this.currentPlayPosition;
}

Deck.prototype.setPlaybackRate = function(val) {
	if(!this.buffer)
		return;

	this.playbackRate = val;
	this.tempo = this.baseTempo * this.playbackRate;
	this.beatLength = 60 / this.baseTempo;

	if(this.source) {
		this.source.playbackRate.value = this.playbackRate;
		this.addPlaybackRateChange(context.currentTime, this.source.playbackRate.value);
	}
}

Deck.prototype.setTempo = function(tempo) {
	this.tempo = tempo;
	this.beatLength = 60 / this.baseTempo;

	this.setPlaybackRate(this.tempo / this.baseTempo);

	this.updateUI();
}

Deck.prototype.addPlaybackRateChange = function(t, v) {
	this.playbackRateChanges.push({
		t : t,
		v : v
	});
}

Deck.prototype.findNearestCue = function(location) {
	var found = 0;
	var cue;
	for(var i = 0; i < this.cuePoints.length; i++) {
		cue = this.cuePoints[i];
		if(cue <= location) {
			found = cue;
		} else {
			return found;
		}
	}

	return found;
}

Deck.prototype.getBeatOffset = function() {
	var playPos = this.getCurrentPlayPosition();
	var cue = this.findNearestCue(playPos);

	// Length of a beat in seconds
	var distance = playPos - cue;
	var nearestBeat = Math.floor(distance / this.beatLength) * this.beatLength;

	return (distance - nearestBeat) / this.beatLength;
}

Deck.prototype.sync = function() {
	this.setTempo(this.otherDeck.tempo);

	$('.deckTempo{0}.deckControlSlider'.format(this.index)).slider("value", Math.log(this.playbackRate) / Math.log(2) * 100);

	this.updateUI();

	var offset = this.getBeatOffset();
	var otherOffset = this.otherDeck.getBeatOffset();
	var difference = otherOffset - offset;

	// Length of a beat in seconds

	this.skipToTime(this.getCurrentPlayPosition() + difference * (60 / this.baseTempo));
}
//play deck
Deck.prototype.play = function() {
	if(!this.buffer)
		return;

	if(this.paused) {
		this.source = context.createBufferSource();
		this.source.buffer = this.buffer;
		this.source.connect(this.gainNode);
		this.source.playbackRate.value = this.playbackRate;
		this.source.noteGrainOn(0, this.currentPlayPosition, this.buffer.duration - this.currentPlayPosition - 0.1);
		//-0.1 for not playing bug

		this.playbackRateChanges = [];
		this.addPlaybackRateChange(context.currentTime - this.currentPlayPosition / this.playbackRate, this.source.playbackRate.value);
	}

	this.paused = false;
}
//pause deck
Deck.prototype.pause = function() {
	if(!this.buffer || !this.source)
		return;

	this.source.noteOff(0);
	this.currentPlayPosition = this.getCurrentPlayPosition();
	this.paused = true;
}
//stop deck
Deck.prototype.stop = function() {
	if(!this.buffer || !this.source)
		return;

	this.source.noteOff(0);
	this.currentPlayPosition = 0;
	this.paused = true;
}
//skip to point (seconds)
Deck.prototype.skipToTime = function(time) {
	if(!this.buffer)
		return;

	if(!this.paused) {
		this.pause();
		this.currentPlayPosition = time;
		this.play();
	} else
		this.currentPlayPosition = time;
}
//skips to the given cuepoint
Deck.prototype.skipToCuePoint = function(cueId) {
	if(!this.buffer)
		return;

	this.skipToTime(this.cuePoints[cueId]);
	this.play();
}
//when track loaded and decoded
Deck.prototype.setCuePoint = function(cueId, time) {
	if(!this.buffer)
		return;

	this.cuePoints[cueId] = time;
}

Deck.prototype.setGain = function(val) {
	this.gainNode.gain.value = val;
}

Deck.prototype.getFilterCutoff = function(sliderVal) {
	var value = sliderVal;
	var nyquist = context.sampleRate * 0.5;
	var noctaves = Math.log(nyquist / 40.0) / Math.LN2;
	var v2 = Math.pow(2.0, noctaves * (value - 1.0));
	var cutoff = v2 * nyquist;
	return cutoff;
}

Deck.prototype.setLowpassCutoff = function(val) {
	this.lowFilter.cutoff.value = this.getFilterCutoff(val);
}

Deck.prototype.setHighpassCutoff = function(val) {
	this.highFilter.cutoff.value = this.getFilterCutoff(val);
}

Deck.prototype.updateUI = function() {
	if(this.currentTrackData == 0)
		return;

	$('.artist{0}.trackInfo'.format(this.index)).text(this.currentTrackData.user.username);
	$('.title{0}.trackInfo'.format(this.index)).text(this.currentTrackData.title);

	var temp = "";
	if(this.baseTempo != 0) {
		temp += this.baseTempo;
	} else {
		temp += "Unknown";
	}
	temp += "/";
	if(this.tempo != 0) {
		temp += roundNumber(this.tempo, 1) + " (" + roundNumber(this.playbackRate, 3) + "x)";
	} else {
		temp += "Unknown";
	}
	$('.tempo{0}.trackInfo'.format(this.index)).text(temp);
}