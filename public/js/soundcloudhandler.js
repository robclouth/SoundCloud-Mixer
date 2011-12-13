/**
 * Class SoundCloudHandler
 */
SoundCloudHandler = function() {
	this.searchResults = [];
	this.searchResultsWithNoBpm = "";
	this.selectedTag = 0;
	this.selectedArtist = 0;
	
	this.selectedTagButton = 0;
	this.selectedArtistButton = 0;
	
	
}

SoundCloudHandler.prototype.apiTrackSearchUrl = "http://api.soundcloud.com/tracks.json?callback=?&client_id=3818f234c5565fd0c330e96416c129cb&q={0}";
SoundCloudHandler.prototype.getBpmUrl = "http://vaetxh.com/soundcloudmixer/getbpm.php?ids={0}";
SoundCloudHandler.prototype.addBpmUrl = "http://vaetxh.com/soundcloudmixer/addbpm.php?id={0}&bpm={1}";

SoundCloudHandler.prototype.getMediaLink = function(trackData, callback) {
	$.ajax({
		url : trackData.permalink_url,
		type : 'GET',
		dataType : 'text',
		success : function(res) {
			var p = res.responseText.indexOf('"streamUrl":"') + ('"streamUrl":"').length;
			var mediaUrl = res.responseText.substring(p, res.responseText.indexOf('"', p));

			callback(mediaUrl);
		}
	});

	return this;
}

SoundCloudHandler.prototype.addBpm = function(id, bpm) {
	var self = this;

	$.ajax({
		url : self.addBpmUrl.format(id, bpm),
		type : 'GET',
		dataType : 'text',
		success : function(res) {

		}
	});
}

SoundCloudHandler.prototype.createTagButton = function(name) {
	var self = this;
	var button = $("<p class='searchResult' id='" + name + "'>" + name + "</p>");
	
	button.hover(function() 
	{ 
		$(this).addClass("hilite"); 
	}, function() { 
		$(this).removeClass("hilite"); 
	});
	
	button.mousedown(function(event, ui) 
	{ 
		self.selectTagButton($(this));
	});
	
	return button;
}

SoundCloudHandler.prototype.createArtistButton = function(name) {
	var self = this;
	var button = $("<p class='searchResult' id='"+ name + "'>" + name + "</p>");
	
	button.hover(function() 
	{ 
		$(this).addClass("hilite"); 
	}, function() { 
		$(this).removeClass("hilite"); 
	});
	
	button.mousedown(function(event, ui) 
	{ 
		self.selectArtistButton($(this));
	});
	
	return button;
}
	
SoundCloudHandler.prototype.selectTagButton = function(button) {
	if (this.selectedTagButton)
	{
		if (this.selectedTagButton == button) return;
		this.selectedTagButton.removeClass("selected"); 
		this.selectedTagButton = 0;
	}
	
	this.selectedTag = button[0].id;
	this.selectedTagButton = button;
	this.updateArtistList(); 
	button.addClass("selected"); 
}

SoundCloudHandler.prototype.selectArtistButton = function(button) {
	if (this.selectedArtistButton)
	{
		if (this.selectedArtistButton == button) return;
		this.selectedArtistButton.removeClass("selected"); 
		this.selectedArtistButton = 0;
	}
	
	this.selectedArtist = button[0].id;
	this.selectedArtistButton = button;
	this.updateTrackList(); 
	button.addClass("selected"); 
}


SoundCloudHandler.prototype.createTrackButton = function(name, index) {
	var self = this;
	var trackInfo = this.searchResults[index];
	var button = $("<div class='searchResult' id='" + index + "'></div>");
	button.append("<div class='trackResult name'>" + name + "</div>");
	var bpm;
	if(trackInfo.bpm)
		bpm = trackInfo.bpm;
	else
		bpm = "Unknown";
	button.append("<div class='trackResult bpm'>" + bpm + "</div>");
	button.append("<div class='trackResult duration'>" + Math.floor(trackInfo.duration / 60000) + "m" + ((trackInfo.duration / 1000) % 60).toFixed(0) + "s" + "</div>");

	button.hover(function() 
	{ 
		$(this).addClass("hilite"); 
	}, function() { 
		$(this).removeClass("hilite"); 
	});
	
	button.draggable({
		//	use a helper-clone that is append to 'body' so is not 'contained' by a pane
		helper : function() {
			//return $(this).clone().appendTo('body').css('zIndex', 5).show();
			return $("<div class='searchResultDragging'>" + trackInfo.user.username + " - " + trackInfo.title +  "</div>").appendTo('body').css('zIndex', 5).show();
		},
		cursor : 'move'
	});
	
	return button;
}

SoundCloudHandler.prototype.updateTagList = function() {
	//clear previous results
	$(".tagResults").empty();
	var self = this;

	var tagList = [];
	for (var i in this.searchResults)
	{
		var track = this.searchResults[i];
		var trackTags = track.tag_list.split(" ");
		
		for (var j in trackTags)
		{
			var tag = trackTags[j];
			tagList[tag] = i;
		}
	}
		
	var allButton = this.createTagButton("All");
	allButton.appendTo($(".tagResults"));
	
	this.createTagButton("Untagged").appendTo($(".tagResults"));
		
	for (var key in tagList)
	{		
		this.createTagButton(key).appendTo($(".tagResults"));		
	}
	
	this.selectTagButton(allButton);
}

SoundCloudHandler.prototype.updateArtistList = function() {
	//clear previous results
	$(".artistResults").empty();
	
	var artistList = [];
	
	if (this.selectedTag == "All")
	{
		// Add all
		for (var i in this.searchResults)
		{
			var track = this.searchResults[i];
			artistList[track.user.username] = true;
		}
	}
	else if (this.selectedTag == "Untagged")
	{
		// Add untagged
		for (var i in this.searchResults)
		{
			var track = this.searchResults[i];
			if (track.tag_list == "")
			{
				artistList[track.user.username] = true;	
			}
		}
	} else {
		// Add tagged
		for (var i in this.searchResults)
		{
			var track = this.searchResults[i];
			if (track.tag_list.indexOf(this.selectedTag) != -1)
			{
				artistList[track.user.username] = true;	
			}
		}
	}
	
	var allButton = this.createArtistButton("All");
	allButton.appendTo($(".artistResults"));

	for (var key in artistList)
	{
		this.createArtistButton(key).appendTo($(".artistResults"));
	}
	
	this.selectArtistButton(allButton);
}

SoundCloudHandler.prototype.updateTrackList = function() {
	//clear previous results
	$(".trackResults").empty();
	
	var trackList = [];
	
	if (this.selectedTag == "All")
	{
		// Add all
		for (var i in this.searchResults)
		{
			var track = this.searchResults[i];
			if (this.selectedArtist == "All" || track.user.username == this.selectedArtist)
			{
				trackList[track.title] = i;	
			}
		}
	}
	else if (this.selectedTag == "Untagged")
	{
		// Add untagged
		for (var i in this.searchResults)
		{
			var track = this.searchResults[i];
			if (track.tag_list == "")
			{
				if (this.selectedArtist == "All" || track.user.username == this.selectedArtist)
				{
					trackList[track.title] = i;	
				}
			}
		}
	} else {
		// Add tagged
		for (var i in this.searchResults)
		{
			var track = this.searchResults[i];
			if (track.tag_list.indexOf(this.selectedTag) != -1)
			{
				if (this.selectedArtist == "All" || track.user.username == this.selectedArtist)
				{
					trackList[track.title] = i;	
				}
			}
		}
	}

	for (var key in trackList)
	{
		this.createTrackButton(key, trackList[key]).appendTo($(".trackResults"));
	}
}

SoundCloudHandler.prototype.updateBpmList = function() {
	var self = this;
	
	//get bpms
	$.ajax({
		url : self.getBpmUrl.format(self.searchResultsWithNoBpm),
		type : 'GET',
		dataType : 'text',
		success : function(res) {
			var tracks;
			$(res.responseText).each(function(index) {
				if(this.tagName == "P"){
					tracks = this.outerText.split(",");
				}
			});

			for(var i in tracks) {
				var trackInfo = tracks[i].split("-");
				var trackId = trackInfo[0];
				var bpm = trackInfo[1];

				//$("p[trackId'" + trackId + "']")
				for(var j in self.searchResults) {
					if(self.searchResults[j].id == trackId) {
						self.searchResults[j].bpm = bpm;
					}
				}
			}
		}
	});
}

SoundCloudHandler.prototype.search = function() {
	var self = this;

	var searchText = $("input[name=searchText]").val();
	$.getJSON(this.apiTrackSearchUrl.format(searchText), function(tracks) 
	{
		self.searchResults = [];

		self.searchResultsWithNoBpm = "";

		for(var i in tracks) {
			if(tracks[i].duration > 600000)
				continue;
				
			self.searchResults.push(tracks[i]);

			if(!tracks[i].bpm)
				self.searchResultsWithNoBpm += tracks[i].id + ",";
		}
		
		self.updateTagList();
	});
	
	this.updateBpmList();
	
	$('#waveform').droppable({
			accept : '.searchResult',
			drop : function(event, ui) {
				var trackId = ui.draggable[0].id;
				var y = ui.offset.top - $(this).offset().top;
				
				if(y < $(this).height()/2)
					deck1.triggerLoad(self.searchResults[trackId]);
				else
					deck2.triggerLoad(self.searchResults[trackId]);
			}
		});
}