var YelpBusiness = function(data, self) {
    this.name = ko.observable(data.name);
	this.id = ko.observable(data.id);
    this.location = ko.observable(data.location);
    this.lat = ko.observable(this.location().coordinate.latitude);
    this.lng = ko.observable(this.location().coordinate.longitude);
    this.loc = ko.observable(new google.maps.LatLng(this.lat(),this.lng()));
	this.phone = ko.observable(data.display_phone);
    this.neighborhood = ko.observable(this.location().neighborhoods);
    this.address = ko.observable(this.location().address);
    this.city = ko.observable(this.location().city);
	this.state = ko.observable(this.location().state_code);
    this.postal = ko.observable(this.location().postal_code);
	this.snippet = ko.observable(data.snippet_text);
	this.snippetUrl = ko.observable(data.snippet_image_url);
    
    this.rating = ko.observable(data.rating);
	this.ratingImgUrlSmall = ko.observable(data.rating_img_url_small);
	this.imageUrl = ko.observable(data.image_url);
	this.reviewCount = ko.observable(data.review_count);
    this.businessUrl = ko.observable(data.url);

    this.content =  "<a href=" + this.businessUrl() + " target='_blank'><h3>" + this.name() + "</h3></a>" + 
                    "<p>" + this.address() + "<br>" + this.city() + ", " + this.state() + this.postal() + "</p>" +
                    "<p>" + this.phone() + "</p>";
	
	this.marker = new google.maps.Marker({
        position: this.loc(),
        map: self.map
    });

    self.markers.push(this.marker);

    google.maps.event.addListener(this.marker, "click", (function(marker, content, infowindow) {
        return function(){
            infowindow.setContent(content);
            self.map.panTo(marker.getPosition());
            infowindow.open(self.map, marker);
        };
    })(this.marker, this.content, self.infowindow));

	// MODIFY THIS 
    this.onClick = function(){
        $(".menu-icon-link").trigger('click');
        google.maps.event.trigger(this.marker, 'click');
    };
};



var AppViewModel = function() {
	var self = this;
	var businesses = {};
	self.searchMsg = ko.observable("What do you want to search?");
	self.business = ko.observable("");
	self.neighborhood = ko.observable("");
	self.yelpPlaceList = ko.observableArray([]);
	
	self.doSubmit = function(formElement) {
		console.log(formElement);
	}
	
	self.initMap = function() {
		
		self.pos = new google.maps.LatLng(37.869085, -122.254775); // set default position to Berkeley
		var sv = new google.maps.StreetViewService();
		var mapOptions = {
			center: self.pos,
			zoom: 12,
			streetViewControl: false
		};
		self.map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
		
		if(navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(function(position) {
				self.pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
				self.map.setCenter(self.pos);
				self.request.location = self.pos;
				self.request = {
					location: self.pos,
					radius: 500,
					types: ['restaurant']
				};
				self.infowindow = new google.maps.InfoWindow();
				self.service = new google.maps.places.PlacesService(self.map);
				self.service.nearbySearch(self.request, self.callback);
				
				}, function() {
					console.log("Error: The Geolocation service failed.");
			});
		} else {
			// Browser doesn't support Geolocation
			console.log("Browser doesn't support Geolocation");
		}
		
		self.request = {
			location: self.pos,
			radius: 500,
			types: ['store']
		};
		self.infowindow = new google.maps.InfoWindow();
		self.service = new google.maps.places.PlacesService(self.map);
		self.service.nearbySearch(self.request, self.callback);
	}
	
	self.callback = function(results, status) {
		if (status == google.maps.places.PlacesServiceStatus.OK) {
			for (var i = 0; i < results.length; i++) {
				self.createMarker(results[i]);
			}
		}
	}

	self.createMarker = function(place) {
		var placeLoc = place.geometry.location;
		var marker = new google.maps.Marker({
			map: self.map,
			position: place.geometry.location
		});

		google.maps.event.addListener(marker, 'click', function() {
			self.infowindow.setContent(place.name);
			self.infowindow.open(self.map, this);
		});
	}

	google.maps.event.addDomListener(window, 'load', self.initMap);
	
	var oauth = new OAuth({
			consumer: {
				public: '9r8BfRLFVT40JH6DpobwSw',
				secret: '8TcqNn9FyR9oaxdmSrRbbG7XaE4'
			},
			signature_method: 'HMAC-SHA1'
	});
	
	var token = {
			public: '4K_bXpUdSl9NwsQ7h348i51hXUX4iUpP',
			secret: '8Ezp5igI08vVGJxLUI1kUXy0O70'
	};
		
	self.getYelp = function() {
		
		self.formattedQueryStr = ko.computed(function(){
            if (self.neighborhood() === "" ) {
                return "";
            } else {
                if (self.business() == "")
					return "location=" + self.neighborhood();
				else
					return "term=" + self.business() + "&location=" + self.neighborhood();
            }
        }, self);
		// Go to https://www.yelp.com/developers/api_console to see response
		var request_data = {
			url: 'http://api.yelp.com/v2/search/?' + self.formattedQueryStr(),
			method: 'POST',
			data: {
				status: 'Hello Ladies + Gentlemen, a signed OAuth request!'
			}
		};
		$.ajax({
			url: request_data.url,
			type: request_data.method,
			dataType: 'jsonp',
			data: oauth.authorize(request_data, token)
//			headers: oauth.toHeader(oauth.authorize(request_data, token))
		}).done(function(data) {
		//process your data here
			$.each(data.businesses, function() {
                    businesses[this.name] = this.id;
					self.yelpPlaceList.push(new YelpBusiness(this, self));
                });
			});
			
	}
/*	
	self.getYelpBusiness = function() {
		// Based on instructions from https://github.com/ddo/oauth-1.0a
		
		var request_data = {
			url: 'http://api.yelp.com/v2/business/',
			method: 'POST',
			data: {
				status: 'Hello Ladies + Gentlemen, a signed OAuth request!'
			}
		};
		
		$.ajax({
			url: request_data.url + self.formattedBusinessId(),
			type: 'GET',
			data: request_data.data,
			headers: oauth.toHeader(oauth.authorize(request_data, token))
		}).done(function(data) {
		//process your data here
		});
	}
*/
		
	
}

ko.applyBindings(new AppViewModel());