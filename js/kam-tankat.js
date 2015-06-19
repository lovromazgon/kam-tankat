var CROSSINGS_LIMIT = 3;
var autocomplete, directionsService, directionsDisplay, map, inputAddress;
borderCrossings = [
    {
        name:"Korensko sedlo",
        location: new google.maps.LatLng(46.51773060441385,13.751593083143234)
    },
    {
        name:"Karavanke",
        location: new google.maps.LatLng(46.48136758200522,14.00758981704712)
    },
    {
        name:"Ljubelj",
        location: new google.maps.LatLng(46.437481294769356,14.254932403564453)
    },
    {
        name:"Jezersko",
        location: new google.maps.LatLng(46.419126964638565,14.527037143707275)
    },
    {
        name:"Holmec",
        location: new google.maps.LatLng(46.56750224126688,14.839066565036774)
    },
    {
        name:"Vič",
        location: new google.maps.LatLng(46.604669868501205,14.985136985778809)
    },
    {
        name:"Radelj",
        location: new google.maps.LatLng(46.64506895743895,15.206556022167206)
    },
    {
        name:"Jurij",
        location: new google.maps.LatLng(46.647870726812364,15.5515256524086)
    },
    {
        name:"Šentilj (novi - avtocesta)",
        location: new google.maps.LatLng(46.6907994052945,15.645303726196289)
    },
    {
        name:"Trate",
        location: new google.maps.LatLng(46.7070204237029,15.7853364944458)
    },
    {
        name:"Gornja Radgona",
        location: new google.maps.LatLng(46.68378702211667,15.987145900726318)
    },
    {
        name:"Gederovci",
        location: new google.maps.LatLng(46.67906890102226,16.040736436843872)
    },
    {
        name:"Kuzma",
        location: new google.maps.LatLng(46.83932215058491,16.056778728961945)
    }
];
sloveniaBounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(45.4216739,16.596685699999966),
    new google.maps.LatLng(46.876659,13.375335500000006)
);

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
        directionsDisplay.setDirections(nearestCrossings[0].directions);
    });
}

function findNearestCrossings(place, callback) {
    nearestCrossings = [];
    for (key in borderCrossings) {
        nearestCrossings.push({key: key,
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
    console.log(i);
    console.log(crossings[i]);
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
