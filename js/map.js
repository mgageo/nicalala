//=================================================================
// la partie cartes
//=================================================================
//
// le tableau avec les markers, pour pouvoir les enlever
var markers = [];
// la liste des destinations choisies par le visiteur
var destinations = [];
// la liste des photos par id
var aPhotos = [];
// la carte affichee a l'ecran
var activeMap;
// le marker actif
var activeMarker;
// le json avec les donnees des markers
var lieux_json;
var conf = {
    lat: 12.4,
    lng: -86,
    zoom: 8,
    minZoom: 8,
    maxZoom: 14,
};
var map;
var strictBounds;
//
// initialisation de la carte
// https://developers.google.com/maps/documentation/javascript/controls
function loadMap() {
    var mapOptions = {
        zoom: conf.zoom,
        center: new google.maps.LatLng(conf.lat, conf.lng),
        minZoom: conf.minZoom,
        maxZoom: conf.maxZoom,
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DEFAULT,
            mapTypeIds: [
        google.maps.MapTypeId.ROADMAP,
        google.maps.MapTypeId.TERRAIN
      ]
        },
        panControl: false,
        streetViewControl: false,
        zoomControl: true,
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.DEFAULT,
            position: google.maps.ControlPosition.RIGHT_BOTTOM,
        }
    };
    map = new google.maps.Map(document.getElementById('map'), mapOptions);
}

function setBounds() {
    // Bounds for Nicaragua
    strictBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(10.8, -88),
        new google.maps.LatLng(14.8, -82)
    );

    // pb sens de rotation ?
    // http://jeffreysambells.com/2010/11/12/mmmmm-donuts
    var lemonde_path = [
    new google.maps.LatLng(-90, -90),
    new google.maps.LatLng(-90, 90),
    new google.maps.LatLng(90, -120),
    new google.maps.LatLng(90, 120),
  ];
    var nica_path = [
    new google.maps.LatLng(10.7084923, -83.929495),
    new google.maps.LatLng(11.0758783, -85.8978782),
    new google.maps.LatLng(11.5119899, -86.4358944),
    new google.maps.LatLng(11.6839304, -86.6269538),
    new google.maps.LatLng(12.7817427, -87.7416506),
    new google.maps.LatLng(12.8864341, -87.8339721),
    new google.maps.LatLng(13.0253028, -87.7848009),
    new google.maps.LatLng(13.1328237, -87.7346261),
    new google.maps.LatLng(13.7685826, -86.763348),
    new google.maps.LatLng(14.8142595, -84.9004014),
    new google.maps.LatLng(14.815225, -84.8981188),
    new google.maps.LatLng(14.8290189, -84.8222939),
    new google.maps.LatLng(15.0292846, -83.4029268),
    new google.maps.LatLng(15.0292017, -83.4004377),
    new google.maps.LatLng(15.0081713, -83.0416823),
    new google.maps.LatLng(14.4817705, -82.6513033),
    new google.maps.LatLng(14.4313649, -82.6278505),
    new google.maps.LatLng(14.387597, -82.6227023),
    new google.maps.LatLng(14.3704199, -82.6232743),
    new google.maps.LatLng(14.3537956, -82.6249904),
    new google.maps.LatLng(12.2708823, -82.8622846),
    new google.maps.LatLng(12.2421449, -82.8671683),
    new google.maps.LatLng(12.2311298, -82.8715442),
    new google.maps.LatLng(10.80992, -83.6669),
    new google.maps.LatLng(10.79375, -83.67791),
    new google.maps.LatLng(10.78952, -83.68635),
    new google.maps.LatLng(10.7174317, -83.8622037),
    new google.maps.LatLng(10.7167571, -83.865637),
    new google.maps.LatLng(10.7098416, -83.9174787),
    new google.maps.LatLng(10.7088296, -83.9262334),
    new google.maps.LatLng(10.7084923, -83.929495)
  ];

    var poly = new google.maps.Polygon({
        paths: [lemonde_path, nica_path],
        strokeWeight: 0,
        fillColor: '#eeeeee',
        fillOpacity: 0.7
    });
    poly.setMap(map);
}

function handleEvents() {
        // Listen for the dragend event
        google.maps.event.addListener(map, 'dragend', function () {
            if (strictBounds.contains(map.getCenter())) return;

            // We're out of bounds - Move the map back within the bounds

            var c = map.getCenter(),
                x = c.lng(),
                y = c.lat(),
                maxX = strictBounds.getNorthEast().lng(),
                maxY = strictBounds.getNorthEast().lat(),
                minX = strictBounds.getSouthWest().lng(),
                minY = strictBounds.getSouthWest().lat();

            if (x < minX) x = minX;
            if (x > maxX) x = maxX;
            if (y < minY) y = minY;
            if (y > maxY) y = maxY;

            map.setCenter(new google.maps.LatLng(y, x));
        });

        // sur changement de zoom, reconstruction des markers
        google.maps.event.addListener(map, 'zoom_changed', function () {
            if (activeMap == "itineraire") {
                showItineraire();
                //  } else {
                //    showMap(lieux_json, activeMap, markers, false);
            }
            if (map.getZoom() > conf.maxZoom) {
                map.setZoom(conf.maxZoom);
            }
        });
    }
    //
    // construction de la couche avec les markers
    // http://stackoverflow.com/questions/13729842/google-map-api-v3-multiple-marker-infowindow-hover-html-garbage
function showMap(data, mapId) {
    // pour récuperer les markers
    les_markers = $('#details_' + mapId + ' div.description_markers').html();
    if (!les_markers) {
        les_markers = mapId;
    }
    // on change la carte affichee a l'ecran
    activeMap = mapId;
    // on enleve tous les markers actuellement affiches
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
    var coeff = Math.pow(Math.max(10 - map.getZoom(), 0), 1.5) / 3;
    $.each(data.features, function (key, val) {
        // on affiche seulement les markers qui correspondent a mapId
        if (contains(val.properties.carte, mapId)) {
            createMarker(val, coeff);
        } else {
            if (contains(les_markers, val.properties.name)) {
                createMarker(val, coeff);
            }
        }
    });
    var latlngbounds = new google.maps.LatLngBounds();
    for (var i = 0; i < markers.length; i++) {
        latlngbounds.extend(markers[i].getPosition());
    }
    // map.fitBounds(latlngbounds);
    map.setZoom(conf.zoom);
    map.setCenter(new google.maps.LatLng(conf.lat, conf.lng));
};
//
// ...
function contains(string, subString) {
    if (string == undefined || subString == undefined || string.length == 0 || subString.length == 0) {
        return false;
    }
    return string.indexOf(subString) != -1;
};
//
// ajouter un marker a une carte
function createMarker(val, coeff) {
    // recuperer coordonnees et image
    var lng = val.geometry.coordinates[0];
    if (val.properties.offsetLng != undefined)
        lng = lng + coeff * val.properties.offsetLng;
    var lat = val.geometry.coordinates[1];
    if (val.properties.offsetLat != undefined)
        lat = lat + coeff * val.properties.offsetLat;
    var myPosition = new google.maps.LatLng(lat, lng);
    var markerImage;
    var anchor;
    // creer le marker avec une image
    if (val.properties.icon != undefined && val.properties.icon.length > 0) {
        if (val.properties.icon.substr(0, 4) == "icon") {
            markerImage = {
                url: val.properties.icon,
                size: new google.maps.Size(110, 110),
                // origin: new google.maps.Point(0, 0)
                anchor: new google.maps.Point(55, 55)
            };
            anchor = -35;
        } else {
            markerImage = {
                url: val.properties.icon,
                size: new google.maps.Size(70, 70),
                // origin: new google.maps.Point(0, 0)
                anchor: new google.maps.Point(35, 35)
            };
            anchor = -20;
        }

    } else {
        markerImage = "icon/blank.png";
        anchor = 10;
    }
    var marker = new MarkerWithLabel({
        position: myPosition,
        draggable: false,
        labelContent: val.properties.lieu,
        labelAnchor: new google.maps.Point(60, anchor),
        labelClass: "markerlabel", // the CSS class for the label
        labelInBackground: false,
        icon: markerImage
    });
    marker.feature = val;
    showMarker(marker);
    return marker;
};

function showMarker(marker) {
    // associer la carte au marker
    marker.setMap(map);
    markers.push(marker);
    // ajouter un evenement lorsqu'on clicke sur le marker
    google.maps.event.addListener(marker, "click", clickOnMarker);
};
//
// l'événement sur le click d'un marker
function clickOnMarker() {
    activeMarker = this;
    // on affiche le texte
    var details = this.feature.properties.name;
    map.panTo(this.getPosition());
    map.setZoom(conf.maxZoom);
    showDetails(details, this.feature.properties.photo, true, "true");
};
//
// recuperation du json et construction du layer
function loadJson() {
    $.getJSON("lieux.json", function (json) {
        $.each(json.features, function (key, val) {
            var name = val.properties.name;
            if (val.properties.photo) {
                aPhotos[name] = val.properties.photo;
            }
        });
        lieux_json = json;
    });
}

loadJson();
loadMap();
setBounds();
handleEvents();