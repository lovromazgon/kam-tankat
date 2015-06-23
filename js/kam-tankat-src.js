var FUEL_PRICE_AUT_URL = "http://107.161.149.156/kam-tankat.php";
var DEFAULT_CROSSINGS_LIMIT = 3;
var DEFAULT_FUEL_STATION_RADIUS = 8000;

var kamTankat;

// **********************
// ** HELPER FUNCTIONS **
// **********************
class Util {
    static createXMLHttpRequest() {
        var request;
        if (window.XMLHttpRequest) {
            // IE7+, Firefox, Chrome, Opera, Safari
            request = new XMLHttpRequest();
        } else {
            // code for IE6, IE5
            request = new ActiveXObject('Microsoft.XMLHTTP');
        }
        return request;
    }

    static loadJSON(data, callback) {
        console.log(data);
        var request = Util.createXMLHttpRequest();
        request.onreadystatechange = function() {
            if (request.readyState == 4 && request.status == 200) {
                callback(JSON.parse(request.responseText));
            }
            else if (request.readyState == 4) {
                console.log(request.responseText);
                alert("Sorči, prišlo je do napake..");
            }
        }
        request.open(data.method, data.url, true);
        if (data.headers) {
            for (var header of data.headers) {
                request.setRequestHeader(header.title, header.content);
            }
        }
        request.send(data.query);
    }
    
    static createAUTQueryString(location, radius) {
        console.log(location);
        var checked = '"checked"';
        var fuel = '"DIE"';
        var circleBounds = new google.maps.Circle({center: location, radius: radius}).getBounds();
        var northEast = circleBounds.getNorthEast();
        var southWest = circleBounds.getSouthWest();
        return Util.encodeQueryData({
            checked: checked,
            fuel: fuel,
            lat1: northEast.lat(),
            lng1: northEast.lng(),
            lat2: southWest.lat(),
            lng2: southWest.lng()
        });
    }

    static encodeQueryData(data) {
        var ret = [];
        for (var d in data)
            ret.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
        return ret.join("&");
    }

    static googleMapsInit() {
        var inputAddress = document.getElementById('address');

        var map = new google.maps.Map(document.getElementById('map-canvas'), Util.options.mapOptions);
        var directionsService = new google.maps.DirectionsService();
        var directionsDisplay = new google.maps.DirectionsRenderer();
        var autocomplete = new google.maps.places.Autocomplete(inputAddress, Util.options.autocompleteOptions);
        google.maps.event.addListener(autocomplete, 'place_changed', function() {
            var place = autocomplete.getPlace();
            if (place.geometry) {
                kamTankat.setStartPlace(place);
                kamTankat.kamTankat();
            } else {
                inputAddress.value = '';
            }
        });
        directionsDisplay.setMap(map);

        kamTankat.setMap(map);
        kamTankat.setDirectionsService(directionsService);
        kamTankat.setDirectionsDisplay(directionsDisplay);
        kamTankat.setAutocomplete(autocomplete);
    }
}

// ***************
// ** CALLBACKS **
// ***************
// just because JavaScript is actually not that good in object oriented programming, d00h
function saveFuelStationsCallback(response) {
    kamTankat.saveFuelStations(response);
}

function findFuelStationsCallback(response) {
    kamTankat.findFuelStations(response);
}

// ***********************
// ** CLASS DEFINITIONS **
// ***********************
class Location {
    constructor(name, lat, lng) {
        this.location = new google.maps.LatLng(lat, lng);
        this.name = name;
    }
    lat() {
        return this.location.lat();
    }
    lng() {
        return this.location.lng();
    }
}

class Crossing extends Location {
    constructor(initData) {
        super(initData.name, initData.lat, initData.lng);
    }

    calculateCoordDistance(coord) {
        return Math.sqrt(Math.pow(this.lat()-coord.lat(), 2)+Math.pow(this.lng()-coord.lng(), 2));
    }
}

class FuelStation extends Location {
    constructor(initData) {
        super(initData.gasStationName, initData.latitude, initData.longitude);
        this.address = initData.address;
        this.city = initData.city;
        this.open = initData.open;
        this.postalCode = initData.postalCode;
    }
}

class FuelPrice {
    constructor(initData) {
        this.price = initData.amount;
        this.type = initData.spritId;
    }
}

class KamTankat {
    constructor(crossingsLimit, fuelStationRadius) {
        this.crossingsLimit = crossingsLimit;
        this.fuelStationRadius = fuelStationRadius;
    }

    setCrossings(crossings) {
        this.crossings = crossings;
    }
    setMap(map) {
        this.map = map;
    }
    setDirectionsService(ds) {
        this.directionsService = ds;
    }
    setDirectionsDisplay(dd) {
        this.directionsDisplay = dd;
    }
    setStartPlace(place) {
        this.startPlace = place;
    }
    setAutocomplete(autocomplete) {
        this.autocomplete = autocomplete;
    }

    isReady() {
        if (!this.crossings || !this.map || !this.directionsService || !this.directionsDisplay || !this.startPlace) {
            return false;
        }
        return true;
    }

    kamTankat() {
        this.findNearestCrossings();
        this.calculateDistancesAndDurations(findFuelStationsCallback);
        //when the method finishes it calls findFuelStations();
    }

    findFuelStations() {
        console.log(this.nearestCrossings);
        var crossing = this.nearestCrossings[0];

        var queryString = Util.createAUTQueryString(crossing.crossing.location, this.fuelStationRadius);
        Util.loadJSON({
            method: 'POST',
            url:FUEL_PRICE_AUT_URL,
            headers: [{title:'Content-type', content:'application/x-www-form-urlencoded'}],
            query: queryString
            }, saveFuelStationsCallback
        );
    }

    saveFuelStations(fuelStationsResponse) {
        this.fuelStations = [];
        for (var fs of fuelStationsResponse) {
            this.fuelStations.push(new FuelStation(fs));
        }
        this.displayFuelStations();
        this.displayRouteToNearestFuelStation();
    }

    displayFuelStations() {
        for (var fs of this.fuelStations) {
            console.log(fs);
            new google.maps.Marker({
                title: fs.name,
                position: fs.location,
                map: this.map
            });
        }
    }

    displayRouteToNearestFuelStation() {
        var request = {
            origin: this.startPlace.geometry.location,
            destination: this.fuelStations[0].location,
            travelMode: google.maps.TravelMode.DRIVING
        };

        this.directionsService.route(request, function(response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                kamTankat.directionsDisplay.setDirections(response);
            }
            else {
                console.log(status);
            }
        });
    }

    findNearestCrossings() {
        this.nearestCrossings = [];
        for (var c of this.crossings) {
            this.nearestCrossings.push({
                crossing : c,
                coordDistance : c.calculateCoordDistance(this.startPlace.geometry.location)
            });
        }
        this.nearestCrossings.sort(function(a,b) {
            return a.coordDistance - b.coordDistance;
        });
    }

    calculateDistancesAndDurations(callback, i) {
        if (!i) {
            i = 0;
        }
        if (!this.nearestCrossings[i] || i >= this.crossingsLimit) {
            this.nearestCrossings.sort(function(a,b) {
                if (!a.duration && !b.duration) {
                    return 0;
                }
                else if (!a.duration) {
                    return 1;
                }
                else if (!b.duration) {
                    return -1;
                }
                return a.duration.value - b.duration.value;
            });
            callback();
            return;
        }
        console.log(i);
        console.log(this.nearestCrossings[i]);
        var request = {
            origin: this.startPlace.geometry.location,
            destination: this.nearestCrossings[i].crossing.location,
            travelMode: google.maps.TravelMode.DRIVING
        };

        this.directionsService.route(request, function(response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                kamTankat.nearestCrossings[i].distance = response.routes[0].legs[0].distance;
                kamTankat.nearestCrossings[i].duration = response.routes[0].legs[0].duration;
                kamTankat.nearestCrossings[i].directions = response;
            }
            else {
                console.log(status);
            }
            kamTankat.calculateDistancesAndDurations(callback, i+1);
        });
    }
}

// *******************
// ** MAIN FUNCTION **
// *******************
(function main(){
    kamTankat = new KamTankat(DEFAULT_CROSSINGS_LIMIT, DEFAULT_FUEL_STATION_RADIUS);
    Util.loadJSON({method:"GET", url:"js/options.json"}, function(options) {
        Util.options = options;

        google.maps.event.addDomListener(window, 'load', Util.googleMapsInit);
        var crossings = [];
        for (var c of options.crossings) {
            crossings.push(new Crossing(c));
        }
        kamTankat.setCrossings(crossings);
    });
})();
