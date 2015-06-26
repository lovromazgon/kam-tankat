var FUEL_PRICE_AUT_URL = "http://107.161.149.156/kam-tankat.php";

var kamTankat, view;

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
    
    static createAUTQueryString(location, radius, fuel) {
        console.log(location);
        var checked = '"checked"';
        var fuel = '"' + fuel + '"';
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
        directionsDisplay.setMap(map);

        google.maps.event.addListenerOnce(map, 'bounds_changed', function(){
            Util.options.mapOptions.initialBounds = this.getBounds();
            kamTankat.reset();
        });

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
function kamTankat2Callback(response) {
    kamTankat._kamTankat2(response);
}
function kamTankat3Callback(response) {
    kamTankat._kamTankat3(response);
}
function kamTankat4Callback(response) {
    kamTankat._kamTankat4(response);
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
        this.fuelPrice = new FuelPrice(initData.spritPrice[0]);
    }

    setMarker(marker) {
        this.marker = marker;
    }

    removeMarker() {
        if (this.marker) {
            this.marker.setMap(undefined);
            this.marker = undefined;
        }
    }
    
    calculateFuelConsumption() {
        this.fuelConsumption = view.getFuelEfficiency() * this.distance.value / 100000; // /1000 because of conversion from KM to M, /100 because efficiency is in l/100km
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

    //for debugging purposes
    isReady() {
        if (!this.crossings || !this.map || !this.directionsService || !this.directionsDisplay || !this.startPlace) {
            return false;
        }
        return true;
    }
    reset() {
        if (this.fuelStations) {
            for(var fs of this.fuelStations) {
                fs.removeMarker();
            }
        }
        this.nearestCrossings = undefined;
        this.fuelStations = undefined;
        this.startPlace = undefined;
        this.directionsDisplay.set('directions', null);
        this.map.fitBounds(Util.options.mapOptions.initialBounds);
        view.reset();
    }

    kamTankat(successCallback) {
        this.successCallback = successCallback;
        var place = this.autocomplete.getPlace();
        if (place.geometry) {
            this.reset();
            this.setStartPlace(place);
        } else {
            inputAddress.value = '';
            return;
        }
        view.beforeKamTankat();
        //the method is divided between 4 methods, because.. callbacks.. and JavaScript awesomeness
        this._kamTankat1();
    }

    _kamTankat1() {
        this.findNearestCrossings();
        this.sortNearestCrossings(kamTankat2Callback);
    }
    _kamTankat2() {
        this.findFuelStations(kamTankat3Callback);
    }
    _kamTankat3(response) {
        this.saveFuelStations(response);
        this.sortFuelStations(kamTankat4Callback);
    }
    _kamTankat4() {
        this.displayFuelStationMarkers();
        this.displayRouteToBestFuelStation();
        view.afterKamTankat();
        this.successCallback();
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

    sortNearestCrossings(callback, i) {
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
                alert("Prišlo je do napake!");
            }
            kamTankat.sortNearestCrossings(callback, i+1);
        });
    }

    findFuelStations(callback) {
        console.log(this.nearestCrossings);

        var queryString = Util.createAUTQueryString(this.nearestCrossings[0].crossing.location, this.fuelStationRadius, view.getFuelType());
        Util.loadJSON({
            method: 'POST',
            url:FUEL_PRICE_AUT_URL,
            headers: [{title:'Content-type', content:'application/x-www-form-urlencoded'}],
            query: queryString
            }, callback
        );
    }

    saveFuelStations(fuelStationsResponse) {
        this.fuelStations = [];
        console.log(fuelStationsResponse);
        for (var fs of fuelStationsResponse) {
            this.fuelStations.push(new FuelStation(fs));
        }
    }

    displayFuelStationMarkers() {
        //TODO create nicer marks, which display some information about fuel stations
        for (var fs of this.fuelStations) {
            console.log(fs);
            fs.setMarker(new google.maps.Marker({
                title: fs.name,
                position: fs.location,
                map: this.map
            }));
        }
    }

    sortFuelStations(callback, i) {
        if (!i) {
            i = 0;
        }
        var fs = this.fuelStations[i];
        if (!fs) {
            this.fuelStations.sort(function(a,b) {
                if (!a.fuelConsumption && !b.fuelConsumption) {
                    return 0;
                }
                else if (!a.fuelConsumption) {
                    return 1;
                }
                else if (!b.fuelConsumption) {
                    return -1;
                }
                return a.fuelConsumption - b.fuelConsumption;
            });
            callback();
            return;
        }
        
        if (fs.fuelPrice.price === "" || (i > 0 && this.fuelStations[i-1].fuelPrice.price == fs.fuelPrice.price)) {
            kamTankat.sortFuelStations(callback, i+1);
            return;
        }

        console.log(fs);
        var request = {
            origin: this.startPlace.geometry.location,
            destination: fs.location,
            travelMode: google.maps.TravelMode.DRIVING
        };

        this.directionsService.route(request, function(response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                kamTankat.fuelStations[i].distance = response.routes[0].legs[0].distance;
                kamTankat.fuelStations[i].duration = response.routes[0].legs[0].duration;
                kamTankat.fuelStations[i].directions = response;
                kamTankat.fuelStations[i].calculateFuelConsumption();
            }
            else {
                console.log(status);
                alert("Prišlo je do napake!");
            }
            kamTankat.sortFuelStations(callback, i+1);
        });
    }

    displayRouteToBestFuelStation() {
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
}

class View {
    constructor() {
        this.resultsPanel = $('#results');
        this.overlay = $('.overlay');
        this.fuelEfficiencyInput = $('#fuel-efficiency');
        this.tankVolumeInput = $('#tank-volume');
        this.fuelTypeInput = $('#fuel-type');
    }

    getFuelEfficiency() {
        return this.fuelEfficiencyInput.val();
    }
    getTankCapacity() {
        return this.tankVolumeInput.val();
    }
    getFuelType() {
        return this.fuelTypeInput.val();
    }

    reset() {
        this.resultsPanel.slideUp();
    }

    beforeKamTankat() {
        this.overlay.fadeIn();
    }
    afterKamTankat() {
        this.overlay.fadeOut();
        this.resultsPanel.slideDown();
    }
}

// *******************
// ** MAIN FUNCTION **
// *******************
(function main(){
    Util.loadJSON({method:"GET", url:"js/options.json"}, function(options) {
        Util.options = options;

        view = new View();
        kamTankat = new KamTankat(options.crossingsLimit, options.fuelStationRadius);
        google.maps.event.addDomListener(window, 'load', Util.googleMapsInit);
        var crossings = [];
        for (var c of options.crossings) {
            crossings.push(new Crossing(c));
        }
        kamTankat.setCrossings(crossings);
    });
})();
