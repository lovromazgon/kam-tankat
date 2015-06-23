"use strict";

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FUEL_PRICE_AUT_URL = "http://107.161.149.156/kam-tankat.php";
var DEFAULT_CROSSINGS_LIMIT = 3;
var DEFAULT_FUEL_STATION_RADIUS = 8000;

var kamTankat;

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
        value: function createAUTQueryString(location, radius) {
            console.log(location);
            var checked = "\"checked\"";
            var fuel = "\"DIE\"";
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
            google.maps.event.addListener(autocomplete, "place_changed", function () {
                var place = autocomplete.getPlace();
                if (place.geometry) {
                    kamTankat.setStartPlace(place);
                    kamTankat.kamTankat();
                } else {
                    inputAddress.value = "";
                }
            });
            directionsDisplay.setMap(map);

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
function saveFuelStationsCallback(response) {
    kamTankat.saveFuelStations(response);
}

function findFuelStationsCallback(response) {
    kamTankat.findFuelStations(response);
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
    }

    _inherits(FuelStation, _Location2);

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
        value: function isReady() {
            if (!this.crossings || !this.map || !this.directionsService || !this.directionsDisplay || !this.startPlace) {
                return false;
            }
            return true;
        }
    }, {
        key: "kamTankat",
        value: function kamTankat() {
            this.findNearestCrossings();
            this.calculateDistancesAndDurations(findFuelStationsCallback);
            //when the method finishes it calls findFuelStations();
        }
    }, {
        key: "findFuelStations",
        value: function findFuelStations() {
            console.log(this.nearestCrossings);
            var crossing = this.nearestCrossings[0];

            var queryString = Util.createAUTQueryString(crossing.crossing.location, this.fuelStationRadius);
            Util.loadJSON({
                method: "POST",
                url: FUEL_PRICE_AUT_URL,
                headers: [{ title: "Content-type", content: "application/x-www-form-urlencoded" }],
                query: queryString
            }, saveFuelStationsCallback);
        }
    }, {
        key: "saveFuelStations",
        value: function saveFuelStations(fuelStationsResponse) {
            this.fuelStations = [];
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = fuelStationsResponse[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var fs = _step2.value;

                    this.fuelStations.push(new FuelStation(fs));
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

            this.displayFuelStations();
            this.displayRouteToNearestFuelStation();
        }
    }, {
        key: "displayFuelStations",
        value: function displayFuelStations() {
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = this.fuelStations[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var fs = _step3.value;

                    console.log(fs);
                    new google.maps.Marker({
                        title: fs.name,
                        position: fs.location,
                        map: this.map
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
        }
    }, {
        key: "displayRouteToNearestFuelStation",
        value: function displayRouteToNearestFuelStation() {
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
    }, {
        key: "findNearestCrossings",
        value: function findNearestCrossings() {
            this.nearestCrossings = [];
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = this.crossings[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var c = _step4.value;

                    this.nearestCrossings.push({
                        crossing: c,
                        coordDistance: c.calculateCoordDistance(this.startPlace.geometry.location)
                    });
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

            this.nearestCrossings.sort(function (a, b) {
                return a.coordDistance - b.coordDistance;
            });
        }
    }, {
        key: "calculateDistancesAndDurations",
        value: function calculateDistancesAndDurations(callback, i) {
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
            console.log(i);
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
                }
                kamTankat.calculateDistancesAndDurations(callback, i + 1);
            });
        }
    }]);

    return KamTankat;
})();

// *******************
// ** MAIN FUNCTION **
// *******************
(function main() {
    kamTankat = new KamTankat(DEFAULT_CROSSINGS_LIMIT, DEFAULT_FUEL_STATION_RADIUS);
    Util.loadJSON({ method: "GET", url: "js/options.json" }, function (options) {
        Util.options = options;

        google.maps.event.addDomListener(window, "load", Util.googleMapsInit);
        var crossings = [];
        var _iteratorNormalCompletion5 = true;
        var _didIteratorError5 = false;
        var _iteratorError5 = undefined;

        try {
            for (var _iterator5 = options.crossings[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                var c = _step5.value;

                crossings.push(new Crossing(c));
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

        kamTankat.setCrossings(crossings);
    });
})();
