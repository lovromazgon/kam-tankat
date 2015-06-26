"use strict";

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FUEL_PRICE_AUT_URL = "http://107.161.149.156/kam-tankat.php";

var kamTankat, view;

// **********************
// ** HELPER FUNCTIONS **
// **********************

var Util = (function () {
    function Util() {
        _classCallCheck(this, Util);
    }

    _createClass(Util, null, [{
        key: "createXMLHttpRequest",
        value: function createXMLHttpRequest() {
            var request;
            if (window.XMLHttpRequest) {
                // IE7+, Firefox, Chrome, Opera, Safari
                request = new XMLHttpRequest();
            } else {
                // code for IE6, IE5
                request = new ActiveXObject("Microsoft.XMLHTTP");
            }
            return request;
        }
    }, {
        key: "loadJSON",
        value: function loadJSON(data, callback) {
            console.log(data);
            var request = Util.createXMLHttpRequest();
            request.onreadystatechange = function () {
                if (request.readyState == 4 && request.status == 200) {
                    callback(JSON.parse(request.responseText));
                } else if (request.readyState == 4) {
                    console.log(request.responseText);
                    alert("Sorči, prišlo je do napake..");
                }
            };
            request.open(data.method, data.url, true);
            if (data.headers) {
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = data.headers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var header = _step.value;

                        request.setRequestHeader(header.title, header.content);
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator["return"]) {
                            _iterator["return"]();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }
            }
            request.send(data.query);
        }
    }, {
        key: "createAUTQueryString",
        value: function createAUTQueryString(location, radius, fuel) {
            console.log(location);
            var checked = "\"checked\"";
            var fuel = "\"" + fuel + "\"";
            var circleBounds = new google.maps.Circle({ center: location, radius: radius }).getBounds();
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
    }, {
        key: "encodeQueryData",
        value: function encodeQueryData(data) {
            var ret = [];
            for (var d in data) ret.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
            return ret.join("&");
        }
    }, {
        key: "googleMapsInit",
        value: function googleMapsInit() {
            var inputAddress = document.getElementById("address");

            var map = new google.maps.Map(document.getElementById("map-canvas"), Util.options.mapOptions);
            var directionsService = new google.maps.DirectionsService();
            var directionsDisplay = new google.maps.DirectionsRenderer();
            var autocomplete = new google.maps.places.Autocomplete(inputAddress, Util.options.autocompleteOptions);
            directionsDisplay.setMap(map);

            google.maps.event.addListenerOnce(map, "bounds_changed", function () {
                Util.options.mapOptions.initialBounds = this.getBounds();
                kamTankat.reset();
            });

            kamTankat.setMap(map);
            kamTankat.setDirectionsService(directionsService);
            kamTankat.setDirectionsDisplay(directionsDisplay);
            kamTankat.setAutocomplete(autocomplete);
        }
    }]);

    return Util;
})();

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

var Location = (function () {
    function Location(name, lat, lng) {
        _classCallCheck(this, Location);

        this.location = new google.maps.LatLng(lat, lng);
        this.name = name;
    }

    _createClass(Location, [{
        key: "lat",
        value: function lat() {
            return this.location.lat();
        }
    }, {
        key: "lng",
        value: function lng() {
            return this.location.lng();
        }
    }]);

    return Location;
})();

var Crossing = (function (_Location) {
    function Crossing(initData) {
        _classCallCheck(this, Crossing);

        _get(Object.getPrototypeOf(Crossing.prototype), "constructor", this).call(this, initData.name, initData.lat, initData.lng);
    }

    _inherits(Crossing, _Location);

    _createClass(Crossing, [{
        key: "calculateCoordDistance",
        value: function calculateCoordDistance(coord) {
            return Math.sqrt(Math.pow(this.lat() - coord.lat(), 2) + Math.pow(this.lng() - coord.lng(), 2));
        }
    }]);

    return Crossing;
})(Location);

var FuelStation = (function (_Location2) {
    function FuelStation(initData) {
        _classCallCheck(this, FuelStation);

        _get(Object.getPrototypeOf(FuelStation.prototype), "constructor", this).call(this, initData.gasStationName, initData.latitude, initData.longitude);
        this.address = initData.address;
        this.city = initData.city;
        this.open = initData.open;
        this.postalCode = initData.postalCode;
        this.fuelPrice = new FuelPrice(initData.spritPrice[0]);
    }

    _inherits(FuelStation, _Location2);

    _createClass(FuelStation, [{
        key: "setMarker",
        value: function setMarker(marker) {
            this.marker = marker;
        }
    }, {
        key: "removeMarker",
        value: function removeMarker() {
            if (this.marker) {
                this.marker.setMap(undefined);
                this.marker = undefined;
            }
        }
    }, {
        key: "calculateFuelConsumption",
        value: function calculateFuelConsumption() {
            this.fuelConsumption = view.getFuelEfficiency() * this.distance.value / 100000; // /1000 because of conversion from KM to M, /100 because efficiency is in l/100km
        }
    }]);

    return FuelStation;
})(Location);

var FuelPrice = function FuelPrice(initData) {
    _classCallCheck(this, FuelPrice);

    this.price = initData.amount;
    this.type = initData.spritId;
};

var KamTankat = (function () {
    function KamTankat(crossingsLimit, fuelStationRadius) {
        _classCallCheck(this, KamTankat);

        this.crossingsLimit = crossingsLimit;
        this.fuelStationRadius = fuelStationRadius;
    }

    _createClass(KamTankat, [{
        key: "setCrossings",
        value: function setCrossings(crossings) {
            this.crossings = crossings;
        }
    }, {
        key: "setMap",
        value: function setMap(map) {
            this.map = map;
        }
    }, {
        key: "setDirectionsService",
        value: function setDirectionsService(ds) {
            this.directionsService = ds;
        }
    }, {
        key: "setDirectionsDisplay",
        value: function setDirectionsDisplay(dd) {
            this.directionsDisplay = dd;
        }
    }, {
        key: "setStartPlace",
        value: function setStartPlace(place) {
            this.startPlace = place;
        }
    }, {
        key: "setAutocomplete",
        value: function setAutocomplete(autocomplete) {
            this.autocomplete = autocomplete;
        }
    }, {
        key: "isReady",

        //for debugging purposes
        value: function isReady() {
            if (!this.crossings || !this.map || !this.directionsService || !this.directionsDisplay || !this.startPlace) {
                return false;
            }
            return true;
        }
    }, {
        key: "reset",
        value: function reset() {
            if (this.fuelStations) {
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = this.fuelStations[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var fs = _step2.value;

                        fs.removeMarker();
                    }
                } catch (err) {
                    _didIteratorError2 = true;
                    _iteratorError2 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion2 && _iterator2["return"]) {
                            _iterator2["return"]();
                        }
                    } finally {
                        if (_didIteratorError2) {
                            throw _iteratorError2;
                        }
                    }
                }
            }
            this.nearestCrossings = undefined;
            this.fuelStations = undefined;
            this.startPlace = undefined;
            this.directionsDisplay.set("directions", null);
            this.map.fitBounds(Util.options.mapOptions.initialBounds);
            view.reset();
        }
    }, {
        key: "kamTankat",
        value: function kamTankat(successCallback) {
            this.successCallback = successCallback;
            var place = this.autocomplete.getPlace();
            if (place.geometry) {
                this.reset();
                this.setStartPlace(place);
            } else {
                inputAddress.value = "";
                return;
            }
            //the method is divided between 4 methods, because.. callbacks.. and JavaScript awesomeness
            this._kamTankat1();
        }
    }, {
        key: "_kamTankat1",
        value: function _kamTankat1() {
            this.findNearestCrossings();
            this.sortNearestCrossings(kamTankat2Callback);
        }
    }, {
        key: "_kamTankat2",
        value: function _kamTankat2() {
            this.findFuelStations(kamTankat3Callback);
        }
    }, {
        key: "_kamTankat3",
        value: function _kamTankat3(response) {
            this.saveFuelStations(response);
            this.sortFuelStations(kamTankat4Callback);
        }
    }, {
        key: "_kamTankat4",
        value: function _kamTankat4() {
            this.displayFuelStationMarkers();
            this.displayRouteToBestFuelStation();
            view.displayResults();
            this.successCallback();
        }
    }, {
        key: "findNearestCrossings",
        value: function findNearestCrossings() {
            this.nearestCrossings = [];
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = this.crossings[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var c = _step3.value;

                    this.nearestCrossings.push({
                        crossing: c,
                        coordDistance: c.calculateCoordDistance(this.startPlace.geometry.location)
                    });
                }
            } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion3 && _iterator3["return"]) {
                        _iterator3["return"]();
                    }
                } finally {
                    if (_didIteratorError3) {
                        throw _iteratorError3;
                    }
                }
            }

            this.nearestCrossings.sort(function (a, b) {
                return a.coordDistance - b.coordDistance;
            });
        }
    }, {
        key: "sortNearestCrossings",
        value: function sortNearestCrossings(callback, i) {
            if (!i) {
                i = 0;
            }
            if (!this.nearestCrossings[i] || i >= this.crossingsLimit) {
                this.nearestCrossings.sort(function (a, b) {
                    if (!a.duration && !b.duration) {
                        return 0;
                    } else if (!a.duration) {
                        return 1;
                    } else if (!b.duration) {
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

            this.directionsService.route(request, function (response, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    kamTankat.nearestCrossings[i].distance = response.routes[0].legs[0].distance;
                    kamTankat.nearestCrossings[i].duration = response.routes[0].legs[0].duration;
                    kamTankat.nearestCrossings[i].directions = response;
                } else {
                    console.log(status);
                    alert("Prišlo je do napake!");
                }
                kamTankat.sortNearestCrossings(callback, i + 1);
            });
        }
    }, {
        key: "findFuelStations",
        value: function findFuelStations(callback) {
            console.log(this.nearestCrossings);

            var queryString = Util.createAUTQueryString(this.nearestCrossings[0].crossing.location, this.fuelStationRadius, view.getFuelType());
            Util.loadJSON({
                method: "POST",
                url: FUEL_PRICE_AUT_URL,
                headers: [{ title: "Content-type", content: "application/x-www-form-urlencoded" }],
                query: queryString
            }, callback);
        }
    }, {
        key: "saveFuelStations",
        value: function saveFuelStations(fuelStationsResponse) {
            this.fuelStations = [];
            console.log(fuelStationsResponse);
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = fuelStationsResponse[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var fs = _step4.value;

                    this.fuelStations.push(new FuelStation(fs));
                }
            } catch (err) {
                _didIteratorError4 = true;
                _iteratorError4 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion4 && _iterator4["return"]) {
                        _iterator4["return"]();
                    }
                } finally {
                    if (_didIteratorError4) {
                        throw _iteratorError4;
                    }
                }
            }
        }
    }, {
        key: "displayFuelStationMarkers",
        value: function displayFuelStationMarkers() {
            //TODO create nicer marks, which display some information about fuel stations
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = this.fuelStations[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var fs = _step5.value;

                    console.log(fs);
                    fs.setMarker(new google.maps.Marker({
                        title: fs.name,
                        position: fs.location,
                        map: this.map
                    }));
                }
            } catch (err) {
                _didIteratorError5 = true;
                _iteratorError5 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion5 && _iterator5["return"]) {
                        _iterator5["return"]();
                    }
                } finally {
                    if (_didIteratorError5) {
                        throw _iteratorError5;
                    }
                }
            }
        }
    }, {
        key: "sortFuelStations",
        value: function sortFuelStations(callback, i) {
            if (!i) {
                i = 0;
            }
            var fs = this.fuelStations[i];
            if (!fs) {
                this.fuelStations.sort(function (a, b) {
                    if (!a.fuelConsumption && !b.fuelConsumption) {
                        return 0;
                    } else if (!a.fuelConsumption) {
                        return 1;
                    } else if (!b.fuelConsumption) {
                        return -1;
                    }
                    return a.fuelConsumption - b.fuelConsumption;
                });
                callback();
                return;
            }

            if (fs.fuelPrice.price === "" || i > 0 && this.fuelStations[i - 1].fuelPrice.price == fs.fuelPrice.price) {
                kamTankat.sortFuelStations(callback, i + 1);
                return;
            }

            console.log(fs);
            var request = {
                origin: this.startPlace.geometry.location,
                destination: fs.location,
                travelMode: google.maps.TravelMode.DRIVING
            };

            this.directionsService.route(request, function (response, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    kamTankat.fuelStations[i].distance = response.routes[0].legs[0].distance;
                    kamTankat.fuelStations[i].duration = response.routes[0].legs[0].duration;
                    kamTankat.fuelStations[i].directions = response;
                    kamTankat.fuelStations[i].calculateFuelConsumption();
                } else {
                    console.log(status);
                    alert("Prišlo je do napake!");
                }
                kamTankat.sortFuelStations(callback, i + 1);
            });
        }
    }, {
        key: "displayRouteToBestFuelStation",
        value: function displayRouteToBestFuelStation() {
            var request = {
                origin: this.startPlace.geometry.location,
                destination: this.fuelStations[0].location,
                travelMode: google.maps.TravelMode.DRIVING
            };

            this.directionsService.route(request, function (response, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    kamTankat.directionsDisplay.setDirections(response);
                } else {
                    console.log(status);
                }
            });
        }
    }]);

    return KamTankat;
})();

var View = (function () {
    function View() {
        _classCallCheck(this, View);

        this.resultsPanel = $("#results");
        this.fuelEfficiencyInput = $("#fuel-efficiency");
        this.tankVolumeInput = $("#tank-volume");
        this.fuelTypeInput = $("#fuel-type");
    }

    _createClass(View, [{
        key: "getFuelEfficiency",
        value: function getFuelEfficiency() {
            return this.fuelEfficiencyInput.val();
        }
    }, {
        key: "getTankCapacity",
        value: function getTankCapacity() {
            return this.tankVolumeInput.val();
        }
    }, {
        key: "getFuelType",
        value: function getFuelType() {
            return this.fuelTypeInput.val();
        }
    }, {
        key: "reset",
        value: function reset() {
            this.resultsPanel.slideUp();
        }
    }, {
        key: "displayResults",
        value: function displayResults() {
            this.resultsPanel.slideDown();
        }
    }]);

    return View;
})();

// *******************
// ** MAIN FUNCTION **
// *******************
(function main() {
    Util.loadJSON({ method: "GET", url: "js/options.json" }, function (options) {
        Util.options = options;

        view = new View();
        kamTankat = new KamTankat(options.crossingsLimit, options.fuelStationRadius);
        google.maps.event.addDomListener(window, "load", Util.googleMapsInit);
        var crossings = [];
        var _iteratorNormalCompletion6 = true;
        var _didIteratorError6 = false;
        var _iteratorError6 = undefined;

        try {
            for (var _iterator6 = options.crossings[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                var c = _step6.value;

                crossings.push(new Crossing(c));
            }
        } catch (err) {
            _didIteratorError6 = true;
            _iteratorError6 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion6 && _iterator6["return"]) {
                    _iterator6["return"]();
                }
            } finally {
                if (_didIteratorError6) {
                    throw _iteratorError6;
                }
            }
        }

        kamTankat.setCrossings(crossings);
    });
})();
