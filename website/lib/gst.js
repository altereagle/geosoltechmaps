/*
 * Map outrageously harder bro.
 *
*/
(function(){
    var gst = {
        load: {
            googleMap: function(mapId, mapOptions, dataLink, buttons){
                mapId = typeof mapId === "string" ? document.getElementById(mapId) : mapId;
                var map = new google.maps.Map(mapId, mapOptions);
                var bindDataButton = buttons.bindData ? buttons.bindData : undefined;
                gst.store.maps.google.push(map); // add map to store
                
                
                if (dataLink.indexOf("http") === 0 && (dataLink.length - dataLink.indexOf(".kml")) === 4){
                    gst.place.kml(map, "google", dataLink);
                    
                    if(bindDataButton){
                        bindDataButton.addEventListener("click", function(e){
                            gst.store.maps.google.map(function(MAP){
                                function execBindData() {
                                    gst.place.kml(MAP, "google", dataLink);
                                    google.maps.event.removeListener(eventListener);
                                }
                                
                                var eventListener = google.maps.event.addListener(MAP, 'click', execBindData);
                            });
                        });
                    }
                    
                } else if(dataLink.length === 44 && !(/[^A-Z^a-z^0-9]/g.test(dataLink))){
                    gst.get.googleTable({
                        key: dataLink,
                        callback: function(data){
                            gst.place.marker(map, "google", data);
                            
                            if(bindDataButton){
                                bindDataButton.addEventListener("click", function(e){
                                    gst.store.maps.google.map(function(MAP){
                                        function execBindData() {
                                            gst.place.marker(MAP, "google", data);
                                            google.maps.event.removeListener(eventListener);
                                        }
                                        
                                        var eventListener = google.maps.event.addListener(MAP, 'click', execBindData);
                                    });
                                });
                            }
                        }
                    });
                }
                
                return map;
            },
            openLayersMap: function(mapId, mapOptions, dataLink, buttons){
                var map = new OpenLayers.Map(mapId);
                var lat = 0;
                var lon = 0;
                var zoom;
                
                if((mapOptions.center instanceof Array && mapOptions.center.length == 2)) {
                    lat = mapOptions.center[0];
                    lon = mapOptions.center[1];
                }
                typeof mapOptions.zoom == "number"?
                    zoom = mapOptions.zoom:
                    zoom = 0;
                typeof mapOptions.layer == "string" && mapOptions.layer === "default" ? 
                    map.addLayer(new OpenLayers.Layer.OSM()):
                    map.addLayer(new OpenLayers.Layer.OSM());
                
                
                var position = new OpenLayers.LonLat(lon, lat).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());
                map.setCenter(position,zoom);
                
                gst.store.maps.openLayers.push(map); // add map to store
                
                if (dataLink.indexOf("http") === 0 && (dataLink.length - dataLink.indexOf(".kml")) === 4){
                    gst.place.kml(map, "openLayers", dataLink);
                }else if(dataLink.length === 44 && !(/[^A-Z^a-z^0-9]/g.test(dataLink))){
                    gst.get.googleTable({
                        key: dataLink,
                        callback: function(data){
                            gst.place.marker(map, "openLayers", data);
                        }
                    });
                }
                
                return map;
            }
        },
        place:{
            kml: function(map, type, data){
                if(type ==="google"){
                    var kmlLayer = new google.maps.KmlLayer(data);
                    kmlLayer.setMap(map);
                } else if(type ==="openLayers"){
                    // This fails on X-origin req. This still needs work, hang tight.
                    var kmlLayer = new OpenLayers.Layer.Vector("KML", {
                        projection: new OpenLayers.Projection("EPSG:4326"),
                        strategies: [new OpenLayers.Strategy.Fixed()],
                        protocol: new OpenLayers.Protocol.HTTP({
                            url: data,
                            format: new OpenLayers.Format.KML({
                                maxDepth: 1,
                                extractStyles: true,
                                extractAttributes: true
                            })
                        })
                    });
                    map.addLayer(kmlLayer);
                }
            },
            marker: function(map, type, data){
                var loc = gst.parse.latLon(data);
                var markerIcon = "lib/img/marker.png";
                var markerIconShadow = "lib/img/marker_shadow.png";
                
                function placeMarkers(row){
                    var lat = row[loc.lat].value;
                    var lon = row[loc.lon].value;
                    if(type === "google"){
                        var marker = new google.maps.Marker({
                            position: new google.maps.LatLng(lat, lon),
                            map: map,
                            title:"Marker",
                            icon: markerIcon,
                            shadow: markerIconShadow
                        });
                    } else if (type ==="openLayers"){
                        var markers = new OpenLayers.Layer.Markers( "Markers" );
                        map.addLayer(markers);
                        markers.addMarker(new OpenLayers.Marker(new OpenLayers.LonLat(lon, lat).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject())));
                    }
                }
                data.map(placeMarkers);
            }
        },
        get: {
            googleTable: function(opts) {
                var thereIsACallback;
                var jQueryEnabled;
                var htmlAllowed;
                var tableURL;
                var sheetNumber;
                var table;
                
                /* Evaluate and assign option values */
                opts.allowHTML === true ?
                    htmlAllowed = true :
                    htmlAllowed = false; // HTML tags must be explicitally allowed or all tags will be removed
                    
                opts.tableNumber ?
                    sheetNumber += parseInt(opts.tableNumber, 10) :
                    sheetNumber = 6; // Select which sheet to show otherwise show first
                    
                opts.callback instanceof Function ?
                    thereIsACallback = true :
                    thereIsACallback = false; // callback is optional
                    
                typeof opts.key === "string" ?
                    tableURL = "https://spreadsheets.google.com/feeds/list/" + opts.key + "/od" + sheetNumber + "/public/values?alt=json" :
                    tableURL = "";
    
                function parseTableFeed(JSONdata) {
                    var parsedTable = []; // Cleaned table that will be returned
                    var tableFeedEntires = JSONdata.feed.entry; // Target array containing each row as an object
    
                    function findValidRows(obj, str, pos) {
                        var validRows = [];
    
                        for (var name in obj) {
                            var rowName = name.split(str)[1]; // Get the name of the value
                            var rowValue = htmlAllowed ? obj[name].$t : gst.tools.stripHTML(obj[name].$t); // Allow or remove HTML tags from values
                            if (name.indexOf(str) === pos) validRows.push({
                                name: rowName,
                                value: rowValue
                            }); // Objects that have the "str" at the specified "pos" are valid
                        }
    
                        return validRows; // Returns the value populated array 
                    }
    
                    if (!tableFeedEntires) return null; // Returns null if the table is empty
                    tableFeedEntires.map(function(rowObject) {
                        var row = findValidRows(rowObject, "gsx$", 0); // Becomes an array with values of objects that started with gsx$, 
                        parsedTable.push(row); // Populates the array to be returned with an array for each row
                    });
    
                    return parsedTable; // Returns the row populated array
                }
    
                try {
                    if (jQuery) jQueryEnabled = true; // Check if jQuery is enabled
                } catch (e) {
                    if (e.type === "not_defined") jQueryEnabled = false;
                }
    
                if (jQueryEnabled) {
                    $.ajax({
                        url: tableURL,
                        complete: function(data, res) {
                            if (res === "success") {
                                table = parseTableFeed($.parseJSON(data.responseText)); // Parse to JSON, then parse the feed
                                if (thereIsACallback) opts.callback(table); // Fire callback
                                return table;
                            } else if (res != "success") {
                                table = []; // No table present but still send an empty array to prevent errors
                                if (thereIsACallback) opts.callback(table); // Fire callback with the empty table
                                return table;
                            }
                        }
                    });
                } else {
                    (function() {
                        var ajaxReq; // Oldschool( no jQuery ) request below is made if there is no jQuery to piggy back on
                        if (window.XMLHttpRequest) {
                            ajaxReq = new XMLHttpRequest(); // Modern Browsers
                        } else {
                            ajaxReq = new ActiveXObject("Microsoft.XMLHTTP"); // IE 5/6 (windows XP)
                        }
    
                        ajaxReq.onreadystatechange = function() {
                            if (ajaxReq.readyState == 4 && ajaxReq.status == 200) {
                                table = [];
                                if (JSON.parse) table = parseTableFeed(JSON.parse(ajaxReq.responseText)); // parses as JSON if the browser supports JSON.parse
                                if (thereIsACallback) opts.callback(table);
                                return table;
                            } else if (ajaxReq.readyState == 4 && ajaxReq.status != 200) {
                                table = [];
                                if (thereIsACallback) opts.callback(table);
                                return table;
                            }
                        };
    
                        ajaxReq.open("GET", tableURL, true);
                        ajaxReq.send();
                    })();
                }
    
            },
            urlArgs: function(URL, callback) {
                var args = {}; // arguments object, will be returned as a name value pair
                var query = URL ? URL.substring(URL.indexOf('?')).substring(1) : location.search.substring(1);
                var pairs = query.split("&");
                
                for (var i = 0; i < pairs.length; i++) {
                    var pos = pairs[i].indexOf('=');
                    
                    if (pos == -1) continue;
                    
                    var name = pairs[i].substring(0, pos);
                    var value = pairs[i].substring(pos + 1);
                    
                    value = decodeURIComponent(value);
                    
                    args[name] = value;
                }
                
                if (callback instanceof Function) callback(args); // Fire callback
                return args;
            }
            
        },
        tools: {
            stripHTML: function(inputString, callback) {
                var htmlTags = /<(?:.|\n)*?>/gm;
                var outputString = "";
                
                typeof inputString === "string" ? outputString = inputString.replace(htmlTags, '') : String(outputString).replace(htmlTags, ''); // returns a string, no matter what
                if (callback instanceof Function) callback(outputString); // Fire callback
                return outputString;
            }
        },
        parse:{
            latLon: function(data){
                var latColumnNumber = -1;
                var lonColumnNumber = -1;
                var i = 0;
                data[0].map(function(record){
                    if(record.name === "latitude" || record.name === "lat") latColumnNumber = i;
                    if(record.name === "longitude" || record.name === "lon") lonColumnNumber = i;
                    i += 1;
                });
                return {lat:latColumnNumber, lon:lonColumnNumber};
            }
        },
        calc: {
            degRad: function(inputArg, typeOption){
                // Convert degrees to radians, or radians to degrees
                var outputValue = null;
                
                if( typeof typeOption == "string" && typeOption == "deg") {
                    outputValue = (inputArg/360) * (2 * Math.PI);
                } else if ( typeof typeOption == "string" && typeOption == "rad") {
                    outputValue = (inputArg/(2*Math.PI) * 360);
                }
                
               return outputValue;
            },
            direction:function (point1, point2) {
                /* Thanks Josh and Adam, FOR SCIENCE ! ! !*/
                if (!(point1 instanceof Array && point2 instanceof Array)) {
                    return [];
                }
                
                var p1x = point1[0];
                var p1y = point1[1];
                var p2x = point2[0];
                var p2y = point2[1];
                var X = p2x - p1x;
                var Y = p2y - p1y;
                var R = Math.sqrt(X * X + Y * Y);
                var Ti = Math.asin(Math.abs(X) / R);
                var Tf;
                var direction = "";
                
                if (X >= 0 && Y > 0) {
                    Tf = Ti;
                }
                if (X < 0 && Y >= 0) {
                    Tf = Math.PI - Ti;
                }
                if (X <= 0 && Y < 0) {
                    Tf = Math.PI + Ti;
                }
                if (X > 0 && Y <= 0) {
                    Tf = (Math.PI * 2) - Ti;
                }
                
                var n = (Tf * 180 / Math.PI);
                
                if (337.5 < n || n <= 22.5) {
                    direction = "East";
                }
                if (22.5 < n && n <= 67.5) {
                    direction = "NorthEast";
                }
                if (67.5 < n && n <= 112.5) {
                    direction = "North";
                }
                if (112.5 < n && n <= 157.5) {
                    direction = "NorthWest";
                }
                if (157.5 < n && n <= 202.5) {
                    direction = "West";
                }
                if (202.5 < n && n <= 247.5) {
                    direction = "SouthWest";
                }
                if (247.5 < n && n <= 292.5) {
                    direction = "South";
                }
                if (292.5 < n && n <= 337.5) {
                    direction = "SouthEast";
                }
                return [n, direction];
            }
        },
        ui: {
            init: function(options){
                var drawNewMapButton = document.getElementById(options.buttons.newMap);
                var clearMapsButton = document.getElementById(options.buttons.clearMaps);
                var desktop = document.getElementById(options.containers.desktop);
                
                function startDrawContainer(startEvent) {
                    var x1 = startEvent.clientX;
                    var y1 = startEvent.clientY;
                    var validMap = false;
                    var randomId = (Math.round(Math.random() * 99999999));
                    var mapOptionContainer = document.createElement('nav');
                    var googleMapButton = document.createElement('button');
                    var openLayersMapButton = document.createElement('button');
                    var cancelButton = document.createElement('button');
                    
                    var bindDataButton = document.createElement('button');
                    var bindViewButton = document.createElement('button');
                    
                    var mapContainer = document.createElement('div');
                    var map = document.createElement('div');
                    var mapMenu = document.createElement('nav');
                    var tableInput = document.createElement('input');
                    
                    googleMapButton.innerHTML = "Google Map";
                    openLayersMapButton.innerHTML = "Open Layers Map";
                    cancelButton.innerHTML = "Cancel";
                    
                    bindDataButton.innerHTML = "Bind Data";
                    bindViewButton.innerHTML = "Bind View";
                    
                    document.body.style.cursor = "se-resize";
                    
                    map.setAttribute("class", "map");
                    mapMenu.setAttribute("class", "mapMenu");
                    mapContainer.setAttribute("class", "mapContainer");
                    tableInput.setAttribute("class", "mapTable");
                    tableInput.value = "0AkOIIIT7wBStdEtXdnVCeGQzbWtabGJiUDkwUWo5eWc"; // for testing only
                    // alternate test 0AkqtJEdjsVeodHdCakQ1SHZPZ0FULWh5SXlweUFfekE
                    
                    mapContainer.style.left = x1 + "px";
                    mapContainer.style.top = y1 + "px";
                    
                    function initMap(e) {
                        var mapType = e.srcElement.innerHTML === "Google Map" ? "google" : "openLayers";
                        var newMapId = mapType === "google"? "googleMap_": "openLayersMap_";
                            newMapId += randomId;
                        var tableKey = gst.tools.stripHTML(tableInput.value);
                        
                        map.setAttribute("id", newMapId);
                        map.style.height = (parseInt(mapContainer.style.height,10) - 50 ) + "px";
                        
                        mapMenu.appendChild(bindDataButton);
                        mapMenu.appendChild(bindViewButton);
                        
                        mapContainer.removeChild(mapOptionContainer);
                        mapContainer.appendChild(map);
                        mapContainer.appendChild(mapMenu);
                        
                        function startingLocation(loc){
                            var lat = loc.coords.latitude;
                            var lon = loc.coords.longitude;
                            if(mapType === "google") {
                                var mapOptions = {
                                    center      : new google.maps.LatLng(lat, lon),
                                    zoom        : 13,
                                    mapTypeId   : google.maps.MapTypeId.ROADMAP
                                };
                                gst.load.googleMap(newMapId, mapOptions, tableKey, { 
                                    bindData: bindDataButton,
                                    bindView: bindViewButton
                                });
                                
                            } else if (mapType === "openLayers") {
                                var openLayersOptions = {
                                    center  : [lat, lon],
                                    zoom    : 13,
                                    layer   : "default"
                                };
                                gst.load.openLayersMap(newMapId, openLayersOptions, tableKey, { 
                                    bindData: bindDataButton,
                                    bindView: bindViewButton
                                });
                            }
                            gst.store.view.origin = [lat, lon]; // store origin
                            gst.store.view.centroid = [lat, lon]; // store centroid
                        }
                        
                        navigator.geolocation.getCurrentPosition(startingLocation);
                    }
                    
                    function showDrawContainer(dragEvent) {
                        var x2 = dragEvent.clientX;
                        var y2 = dragEvent.clientY;
                        var dx = x2 - x1;
                        var dy = y2 - y1;
                        var desktopLimit = 10;
                        var desktopWidth =desktop.offsetWidth;
                        var desktopHeight = desktop.offsetHeight;
                        
                        mapContainer.style.height = dy + "px";
                        mapContainer.style.width = dx + "px";
                        
                        desktop.appendChild(mapContainer);
                        
                        validMap = dy > 200 && dx > 200 ? true : false;
                        
                        if(x2 < desktopLimit || x2 > (desktopWidth - desktopLimit)) {
                            mapContainer.style.height = (dy - 20) + "px";
                            mapContainer.style.width = (dx - 20) + "px";
                            validMap = dy > 200 && dx > 200 ? true : false;
                            
                            endDrawContainer();
                        } else if (y2 < desktopLimit || y2 > (desktopHeight - desktopLimit)) {
                            mapContainer.style.height = (dy - 20) + "px";
                            mapContainer.style.width = (dx - 20) + "px";
                            validMap = dy > 200 && dx > 200 ? true : false;
                            
                            endDrawContainer();
                        }
                    }
                    
                    function endDrawContainer(e) {
                        function cancelMap(){
                            desktop.removeChild(mapContainer);
                        }
                        
                        if(validMap){
                            googleMapButton.addEventListener("click", initMap);
                            openLayersMapButton.addEventListener("click", initMap);
                            cancelButton.addEventListener("click", cancelMap);
                            tableInput.value = "0AkOIIIT7wBStdEtXdnVCeGQzbWtabGJiUDkwUWo5eWc"; // for testing only
                            
                            mapOptionContainer.appendChild(googleMapButton);
                            mapOptionContainer.appendChild(openLayersMapButton);
                            mapOptionContainer.appendChild(cancelButton);
                            mapOptionContainer.appendChild(tableInput);
                            mapContainer.appendChild(mapOptionContainer);
                            
                        } else if (!validMap){
                            mapContainer.style.height = 100 + "px";
                            mapContainer.style.width = 100 + "px";
                            mapContainer.innerHTML = "Map too small!";
                            
                            setTimeout(function() {
                                try{
                                    desktop.removeChild(mapContainer);
                                } catch (err){}
                            }, 2500);
                        }
                        
                        mapContainer.style.boxShadow = "none";
                        mapContainer.style.backgroundColor = "none";
                        document.body.style.cursor = "default";
                        desktop.removeEventListener("mousedown", startDrawContainer);
                        desktop.removeEventListener("mousemove", showDrawContainer);
                        desktop.removeEventListener("mouseup", endDrawContainer);
                    }
                    
                    desktop.addEventListener("mousemove", showDrawContainer);
                    desktop.addEventListener("mouseup", endDrawContainer);
                }
                
                function enableDrawContainer() {
                    document.body.style.cursor = "crosshair";
                    desktop.addEventListener("mousedown", startDrawContainer);
                }
                
                function clearMaps(){
                    while(desktop.hasChildNodes()){
                        desktop.removeChild(desktop.lastChild);
                    }
                    
                    gst.store.maps.google.length = 0;
                    gst.store.maps.openLayers.length = 0;
                }
                
                drawNewMapButton.addEventListener("click", enableDrawContainer);
                clearMapsButton.addEventListener("click", clearMaps);
            }
        },
        store:{
            maps: {
                google:[],
                openLayers:[]
            },
            tables: {
                google: []
            },
            markers: [],
            view: {
                origin: [],
                centroid: []
            }
        }
    };
    $(document).ready(function(){
        var logStatus = document.getElementById('logStatus');
        logStatus.onclick = function(){ console.log(gst.store);};
    });
    
    window.gstInit = gst.ui.init; // expose init to DOM
})();