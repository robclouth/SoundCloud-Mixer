(function($) {

	var midiMap = {
		1 : function(val) {
			deck1.setLowpassCutoff(val / 128);
			$(".lpCutSlider1").slider("value", (val / 128) * 100);
		},
		2 : function(val) {
			deck1.setHighpassCutoff(val / 128);
			$(".hpCutSlider1").slider("value", (val / 128) * 100);
		},
		3 : function(val) {
			deck1.setReverbLevel(val / 128);
			$(".reverbSlider1").slider("value", (val / 128) * 100);
		},
		4 : function(val) {
			deck2.setLowpassCutoff(val / 128);
			$(".lpCutSlider2").slider("value", (val / 128) * 100);
		},
		5 : function(val) {
			deck2.setHighpassCutoff(val / 128);
			$(".hpCutSlider2").slider("value", (val / 128) * 100);
		},
		6 : function(val) {
			deck2.setReverbLevel(val / 128);
			$(".reverbSlider2").slider("value", (val / 128) * 100);
		},
		81 : function(val) {
			setCrossFader(val / 128);
			$(".crossFader").slider("value", (val / 128) * 100);
		},
		82 : function(val) {
			deck1.setGain(val / 128);
			$(".deckVolume1").slider("value", (val / 128) * 100);
		},
		83 : function(val) {
			deck2.setGain(val / 128);
			$(".deckVolume2").slider("value", (val / 128) * 100);
		}
	}
	/*
	 * Audio setup and methods
	 */
	function initAudio() {
		// Initialize audio
		context = new webkitAudioContext();

		// Start out with cross-fader at center position (equal-power crossfader)
		deck1 = new Deck("deck1", 1, scHandler);
		deck2 = new Deck("deck2", 2, scHandler);

		setCrossFader(0.5);

		deck1.otherDeck = deck2;
		deck2.otherDeck = deck1;

		var request = new XMLHttpRequest();
		request.open("GET", "impulse/waldsassennarrow.wav", true);
		request.responseType = "arraybuffer";

		var self = this;
		request.onload = function() {
			if(request.readyState != 4)
				return;

			context.decodeAudioData(request.response, function(buffer) {
				deck1.convolver.buffer = buffer;
				deck2.convolver.buffer = buffer;
			});
		}

		request.onerror = function() {
			alert("error.");
		}

		request.send();
	}

	function setCrossFader(val) {
		var gain1 = 0.5 * (1.0 + Math.cos(val * Math.PI));
		var gain2 = 0.5 * (1.0 + Math.cos((1.0 - val) * Math.PI));

		deck1.xFaderGain.gain.value = gain1;
		deck2.xFaderGain.gain.value = gain2;
	}

	function resizeUI() {

	}

	function initMidi() {
		midiBridge.init(function(midiEvent) {
			if(midiMap[midiEvent.data1])
				midiMap[midiEvent.data1](midiEvent.data2);
		});
	}


	$(window).load(function() {
		scHandler = new SoundCloudHandler();

		initAudio();
		initMidi();
		waveformView = new WaveformView();

		//setup events
		$(window).resize(function() {
			resizeUI();
		});

		$("input[name=searchButton]").click(function() {
			scHandler.search();
		});
		//deck controls
		$(".playButton1").mousedown(function() {
			deck1.play();
		});

		$(".playButton2").mousedown(function() {
			deck2.play();
		});

		$(".pauseButton1").mousedown(function() {
			deck1.pause();
		});

		$(".pauseButton2").mousedown(function() {
			deck2.pause();
		});

		$(".stopButton1").mousedown(function() {
			deck1.stop();
		});

		$(".stopButton2").mousedown(function() {
			deck2.stop();
		});

		$(".cueButton1").mousedown(function() {
			deck1.skipToCuePoint(0);
		});

		$(".cueButton2").mousedown(function() {
			deck2.skipToCuePoint(0);
		});
		$(".syncButton1").mousedown(function() {
			deck1.sync();
		});

		$(".syncButton2").mousedown(function() {
			deck2.sync();
		});

		$("button").button();
		$("input").button();

		//click and skipping for full waveforms
		$(".fullWaveform1").mousedown(function(e) {
			dragSkip(deck1, this, e);
		});

		$(".fullWaveform2").mousedown(function(e) {
			dragSkip(deck2, this, e);
		});
		function dragSkip(deck, elem, e) {
			e.preventDefault();
			var self = elem;
			var pos = (e.pageX - $(self).offset().left) / $(self).width();

			var playOnRelease = false;
			if(!deck.paused) {
				playOnRelease = true;
			}

			deck.pause();
			deck.skipToTime(pos * deck.buffer.duration);

			$("body").mousemove(function(e) {
				var pos2 = (e.pageX - $(self).offset().left) / $(self).width();
				deck.skipToTime(pos2 * deck.buffer.duration);
			});

			$("body").mouseup(function(e) {
				if(playOnRelease)
					deck.play();
				$("body").unbind('mousemove');
				$("body").unbind('mouseup');
			});
		}


		$("#waveformCanvas").mousedown(function(e) {
			e.preventDefault();
			e.stopPropagation();
		});

		$("#waveformCanvas").bind("contextmenu", function(e) {
			return false;
		});

		$(".deckVolume1").slider({
			orientation : "vertical",
			range : "min",
			min : 0,
			max : 100,
			value : 100,
			slide : function(event, ui) {
				deck1.setGain(ui.value / 100);
				//deck1.setReverbLevel(ui.value / 100);
				$("#amount").val(ui.value / 100);
			}
		});

		$(".deckVolume2").slider({
			orientation : "vertical",
			range : "min",
			min : 0,
			max : 100,
			value : 100,
			slide : function(event, ui) {
				deck2.gainNode.gain.value = ui.value / 100;
				$("#amount").val(ui.value / 100);
			}
		});

		$(".deckTempo1").slider({
			orientation : "vertical",
			range : "min",
			min : -100,
			max : 100,
			value : 0,
			slide : function(event, ui) {
				deck1.setPlaybackRate(Math.pow(2, ui.value / 100));

				deck1.updateUI();
				$("#amount").val(ui.value / 100);

			}
		});

		$(".deckTempo2").slider({
			orientation : "vertical",
			range : "min",
			min : -100,
			max : 100,
			value : 0,
			slide : function(event, ui) {
				deck2.setPlaybackRate(Math.pow(2, ui.value / 100));

				deck2.updateUI();
				$("#amount").val(ui.value / 100);
			}
		});

		$(".hpCutSlider1").slider({
			orientation : "vertical",
			range : "min",
			min : 0,
			max : 100,
			value : 0,
			slide : function(event, ui) {
				deck1.setHighpassCutoff(ui.value / 100);
			}
		});

		$(".lpCutSlider1").slider({
			orientation : "vertical",
			range : "min",
			min : 0,
			max : 100,
			value : 100,
			slide : function(event, ui) {
				deck1.setLowpassCutoff(ui.value / 100);
			}
		});

		$(".hpCutSlider2").slider({
			orientation : "vertical",
			range : "min",
			min : 0,
			max : 100,
			value : 0,
			slide : function(event, ui) {
				deck2.setHighpassCutoff(ui.value / 100);
			}
		});

		$(".lpCutSlider2").slider({
			orientation : "vertical",
			range : "min",
			min : 0,
			max : 100,
			value : 100,
			slide : function(event, ui) {
				deck2.setLowpassCutoff(ui.value / 100);
			}
		});

		$(".reverbSlider1").slider({
			orientation : "vertical",
			range : "min",
			min : 0,
			max : 100,
			value : 0,
			slide : function(event, ui) {
				deck1.setReverbLevel(ui.value / 100);
			}
		});

		$(".reverbSlider2").slider({
			orientation : "vertical",
			range : "min",
			min : 0,
			max : 100,
			value : 0,
			slide : function(event, ui) {
				deck2.setReverbLevel(ui.value / 100);
			}
		});

		$(".crossFader").slider({
			orientation : "horizonal",
			range : "min",
			min : 0,
			max : 100,
			value : 50,
			slide : function(event, ui) {
				setCrossFader(ui.value / 100);
			}
		});

		$('#waveform').droppable({
			accept : '.searchResult',
			drop : function(event, ui) {
				var trackId = ui.draggable[0].id;
				var y = ui.offset.top - $(this).offset().top;

				if(y < $(this).height() / 2)
					deck1.triggerLoad(searchResults[trackId]);
				else
					deck2.triggerLoad(searchResults[trackId]);
			}
		});

		resizeUI();
	});
})(jQuery);
