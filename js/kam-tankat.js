var FUEL_PRICE_AUT_URL = "http://107.161.149.156/kam-tankat.php";
var CROSSINGS_LIMIT = 3;
var FUEL_STATION_RADIUS = 8000;
var autocomplete, directionsService, directionsDisplay, map, inputAddress, borderCrossings;

loadJSON("js/crossings.json", function(crossings) {
    borderCrossings = crossings;
    for (c of borderCrossings) {
        c.location = new google.maps.LatLng(c.lat, c.lng);
    }
    console.log(borderCrossings);
});
sloveniaBounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(45.4216739,16.596685699999966),
    new google.maps.LatLng(46.876659,13.375335500000006)
);

function loadJSON(file, callback) {
    var request;
    if (window.XMLHttpRequest) {
        // IE7+, Firefox, Chrome, Opera, Safari
        request = new XMLHttpRequest();
    } else {
        // code for IE6, IE5
        request = new ActiveXObject('Microsoft.XMLHTTP');
    }
    // load
    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) {
            callback(JSON.parse(request.responseText));
        }
        else if (request.readyState == 4) {
            console.log(request.responseText);
            alert("Sorči, prišlo je do napake..");
        }
    }
    request.open('GET', file, true);
    request.send();
}

function initialize() {
    var mapOptions = {
        center: { lat: 46.051241, lng: 14.995462999999972},
        zoom: 9
    };
    inputAddress = document.getElementById('address');

    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    directionsService = new google.maps.DirectionsService();
    directionsDisplay = new google.maps.DirectionsRenderer();
    autocomplete = new google.maps.places.Autocomplete(inputAddress, {bounds: sloveniaBounds});
    google.maps.event.addListener(autocomplete, 'place_changed', function() {
        var place = autocomplete.getPlace();
        if (place.geometry) {
            findNearestFuelStations(place);
        } else {
            inputAddress.value = '';
        }
    });
    directionsDisplay.setMap(map);
}

function findNearestFuelStations(place) {
    findNearestCrossings(place, function(nearestCrossings) {
        console.log(nearestCrossings);
        crossing = nearestCrossings[0];
        //directionsDisplay.setDirections(crossing.directions);
        if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
            xmlhttp = new XMLHttpRequest();
        }
        else {// code for IE6, IE5
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                console.log("Got AUT fuel station prices.");
                var result = JSON.parse(xmlhttp.responseText);
                displayFuelStations(result);
                displayRoute(place.geometry.location, new google.maps.LatLng(result[0].latitude, result[0].longitude));
            }
            else if (xmlhttp.readyState == 4) {
                console.log(xmlhttp.responseText);
                alert("Sorči, prišlo je do napake..");
            }
        }
        xmlhttp.open("POST", FUEL_PRICE_AUT_URL, true);
        xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        queryString = getQueryString(crossing.location);
        console.log(queryString);
        xmlhttp.send(queryString);
    });
}

function getQueryString(location) {
    checked = '"checked"';
    fuel = '"DIE"';
    circleBounds = new google.maps.Circle({center: location, radius: FUEL_STATION_RADIUS}).getBounds();
    northEast = circleBounds.getNorthEast();
    southWest = circleBounds.getSouthWest();
    return encodeQueryData({
        checked: checked,
        fuel: fuel,
        lat1: northEast.lat(),
        lng1: northEast.lng(),
        lat2: southWest.lat(),
        lng2: southWest.lng()
        });
}

function displayFuelStations(fuelStations) {
    console.log(fuelStations);
    for (fs of fuelStations) {
        console.log(fs);
        new google.maps.Marker({
            title: fs.gasStationName,
            position: new google.maps.LatLng(fs.latitude, fs.longitude),
            map: map
        });
    }
}

function displayRoute(origin, end) {
    var request = {
        origin: origin,
        destination: end,
        travelMode: google.maps.TravelMode.DRIVING
    };

    directionsService.route(request, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(response);
        }
        else {
            console.log(status);
        }
    });
}

function encodeQueryData(data) {
    var ret = [];
    for (var d in data)
        ret.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
    return ret.join("&");
}

function findNearestCrossings(place, callback) {
    nearestCrossings = [];
    for (key in borderCrossings) {
        nearestCrossings.push({key : key,
                        name : borderCrossings[key].name,
                        location : borderCrossings[key].location,
                        coordDistance : calculateCoordDistance(borderCrossings[key].location, place.geometry.location)
        });
    }
    nearestCrossings.sort(function(a,b) {
        return a.coordDistance - b.coordDistance;
    });
    
    calculateDistancesAndDurations(place.geometry.location, nearestCrossings, callback);
}

function calculateCoordDistance(coord1, coord2) {
    return Math.sqrt(Math.pow(coord1.lat()-coord2.lat(), 2)+Math.pow(coord1.lng()-coord2.lng(), 2));
}

function calculateDistancesAndDurations(origin, crossings, callback, i) {
    if (!i) {
        i = 0;
    }
    if (!crossings[i] || i >= CROSSINGS_LIMIT) {
        crossings.sort(function(a,b) {
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
        callback(crossings);
        return;
    }
    console.log(i);
    console.log(crossings[i]);
    var request = {
        origin: origin,
        destination: borderCrossings[crossings[i].key].location,
        travelMode: google.maps.TravelMode.DRIVING
    };

    directionsService.route(request, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            crossings[i].distance = response.routes[0].legs[0].distance;
            crossings[i].duration = response.routes[0].legs[0].duration;
            crossings[i].directions = response;
        }
        else {
            console.log(status);
        }
        calculateDistancesAndDurations(origin, crossings, callback, i+1);
    });
}

(function main(){
    google.maps.event.addDomListener(window, 'load', initialize);
})();
