/**
 * Class Waveform view
 */
WaveformView = function() {
	var viewLength = 5;
	//seconds
	var density = 15;
	this.canvasId = "waveformCanvas";

	var self = this;
	this.pjs = new Processing(document.getElementById(this.canvasId), function(p5) {
		self.p5 = p5;

		p5.setup = function() {
			p5.size($('#' + self.canvasId).width(), $('#' + self.canvasId).height(), p5.OPENGL);
			p5.frameRate(30);
			p5.background(40);
		}

		p5.draw = function() {
			p5.background(40);

			if(deck1.buffer) {
				drawWaveform(deck1);
				
				drawBeatMarkers(deck1);
				drawPlayhead(deck1);
				drawCuePoints(deck1);
			}

			if(deck2.buffer) {
				drawWaveform(deck2);
				drawCuePoints(deck2);
				drawBeatMarkers(deck2);
				drawPlayhead(deck2);
			}

			p5.stroke(0, 50, 255);
			p5.strokeWeight(2);
			p5.line(p5.width / 2, 0, p5.width / 2, p5.height);
			p5.strokeWeight(1);
			p5.stroke(0);
			p5.line(0, p5.height/2, p5.width, p5.height/2);
			
			deck1.loading();
			deck2.loading();
		}
		
		function drawWaveform(deck) {
			var yOffset = 0;
			if(deck == deck2)
				yOffset = p5.height / 2;

			var data = deck.buffer.getChannelData(0);
			var offset = deck.getCurrentPlayPosition() * deck.buffer.sampleRate;
			if(offset > data.length)
				offset = data.length
			var viewLengthSamples = viewLength * deck.playbackRate * deck.buffer.sampleRate;

			p5.strokeWeight(1);
			var skip = viewLengthSamples / p5.width;
			var max, min, val;
			
			p5.noFill();
			p5.stroke(255, 150, 0);
			p5.beginShape();
			
			for(var i = 0; i < p5.width; i += 2) {
				max = -1;
				min = 1;
				for(var j = 0; j < skip; j += density) {
					var index = Math.floor(i * skip + j + offset - viewLengthSamples / 2);
					if(index >= 0 && index < data.length) {
						val = data[index];
						if(val > max)
							max = val;
						if(val < min)
							min = val;
					} else {
						min = max = 0;
						break;
					}
				}

				if(min != 0 || max != 0) {
					// p5.colorMode(p5.HSB);
					// p5.stroke((max - min) * 50, 255, 255);
					// p5.line(i, min * p5.height / 4 + p5.height / 4 + yOffset, i, max * p5.height / 4 + p5.height / 4 + yOffset);
					// p5.colorMode(p5.RGB);
					p5.vertex(i, min * p5.height / 4 + p5.height / 4 + yOffset);
					p5.vertex(i, max * p5.height / 4 + p5.height / 4 + yOffset);
				}
			}
			
			p5.endShape();
			
			drawBeatMarkers(deck);
		}

		function drawPlayhead(deck) {
			var yOffset = 0;
			if(deck == deck2)
				yOffset = p5.height / 2;

			var p = deck.getCurrentPlayPosition() / deck.buffer.duration;
			if(p > 1) {
				p = 1;
				deck.pause();
			}

			deck.playheadElem.width(p * 100 + '%');
		}

		function drawCuePoints(deck) {
			var yOffset = 0;
			if(deck == deck2)
				yOffset = p5.height / 2;

			for(var i = 0; i < deck.cuePoints.length; i++) {
				var point = getPointInWindowAtTime(deck.cuePoints[i], deck);
				if(point >= 0 && point < p5.width) {
					p5.stroke(255, 0, 0);
					p5.line(point, yOffset, point, p5.height / 2 + yOffset);
				}
			}
		}

		function drawBeatMarkers(deck) {
			var yOffset = 0;
			if(deck == deck2)
				yOffset = p5.height / 2;

			var time = deck.getCurrentPlayPosition();

			var p = Math.floor((time - viewLength * deck.playbackRate / 2) / deck.beatLength) * deck.beatLength  + deck.cuePoints[0]%deck.beatLength;
			var windowEnd = time + viewLength * deck.playbackRate / 2;
			var x;

			while(p < windowEnd) {
				x = getPointInWindowAtTime(p, deck);
				p5.fill(200);
				p5.noStroke();
				p5.rect(x, yOffset, 3, p5.height / 2);
				p += deck.beatLength;
			}
		}

		p5.mousePressed = function() {
			if(p5.mouseButton == 39) {/* RIGHT CLICK is this always 39?*/
				var deck;
				if(p5.mouseY < p5.height / 2)
					deck = deck1;
				else
					deck = deck2;
					
				deck.setCuePoint(0, getTimeAtPointInWindow(p5.mouseX, deck));
			}
		}

		p5.mouseDragged = function() {
			if(p5.mouseButton == 37) {/* LEFT CLICK*/

				var deck;
				if(p5.mouseY < p5.height / 2)
					deck = deck1;
				else
					deck = deck2;

				if(!deck.buffer)
					return;

				var nudge = p5.mouseX - p5.pmouseX;

				if(p5.mouseY < p5.height / 2) {

					deck.skipToTime(deck.getCurrentPlayPosition() + nudge / 500);
				} else {

					deck.skipToTime(deck.getCurrentPlayPosition() + nudge / 500);
				}
			}
		}
		function getTimeAtPointInWindow(point, deck) {
			var time = (point / p5.width) * viewLength * deck.playbackRate + deck.getCurrentPlayPosition() - (viewLength / 2) * deck.playbackRate;
			return time;
		}

		function getPointInWindowAtTime(time, deck) {
			var point = (time + (viewLength / 2) * deck.playbackRate - deck.getCurrentPlayPosition()) * (p5.width / (viewLength * deck.playbackRate));
			return point;
		}

	});
}