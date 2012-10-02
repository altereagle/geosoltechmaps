maphard.get.googleTable({
    key: "0AkOIIIT7wBStdC13dEh2V0xMMUdVSnhrOWV0dy1QRnc",
    callback: function(data){
        //console.log(data);
    }
});

var initOptions = {
    buttons: {
        newMap: 'drawNewMap',
        clearMaps: 'clearMaps'
    },
    containers: {
        desktop: 'desktop'
    }
};

function init(options){
    
    var drawNewMapButton = document.getElementById(options.buttons.newMap);
    var clearMapsButton = document.getElementById(options.buttons.clearMaps);
    var desktop = document.getElementById(options.containers.desktop);
    
    function startDrawContainer(startEvent) {
        var x1 = startEvent.clientX;
        var y1 = startEvent.clientY;
        var validMap = false;
        var mapOptionContainer = document.createElement('nav');
        var googleMapButton = document.createElement('button');
        var openLayersMapButton = document.createElement('button');
        var cancelButton = document.createElement('button');
        var containerMap = document.createElement('div');
        var randomId = (Math.round(Math.random() * 99999999));
        
        googleMapButton.innerHTML = "Google Map";
        openLayersMapButton.innerHTML = "Open Layers Map";
        cancelButton.innerHTML = "Cancel";
        
        document.body.style.cursor = "se-resize";
        
        containerMap.setAttribute("class", "map");
        containerMap.style.left = x1 + "px";
        containerMap.style.top = y1 + "px";
        
        function initMap(e) {
            var mapType = e.srcElement.innerHTML === "Google Map" ? "google" : "openLayers";
            var newMapId = mapType === "google"? "googleMap_": "openLayersMap_";
                newMapId += randomId;
            
            containerMap.setAttribute("id", newMapId);
            containerMap.removeChild(mapOptionContainer);
            
            function userLocation(loc){
                var lat = loc.coords.latitude;
                var lon = loc.coords.longitude;
                if(mapType === "google") {
                    var mapOptions = {
                        center      : new google.maps.LatLng(lat, lon),
                        zoom        : 13,
                        mapTypeId   : google.maps.MapTypeId.ROADMAP
                    };
                    maphard.load.googleMap(newMapId, mapOptions);
                    
                } else if (mapType === "openLayers") {
                    var openLayersOptions = {
                        center  : [lat, lon],
                        zoom    : 13,
                        layer   : "default"
                    };
                    maphard.load.openLayersMap(newMapId, openLayersOptions)
                }
            }
            
            
            navigator.geolocation.getCurrentPosition(userLocation);
            
            
        }
        
        function showDrawContainer(dragEvent) {
            var x2 = dragEvent.clientX;
            var y2 = dragEvent.clientY;
            var dx = x2 - x1;
            var dy = y2 - y1;
            var windowThreshold = 10;
            
            containerMap.style.height = dy + "px";
            containerMap.style.width = dx + "px";
            
            desktop.appendChild(containerMap);
            
            validMap = dy > 200 && dx > 200 ? true : false;
            if(x2 < windowThreshold || x2 > (window.innerWidth - windowThreshold)) {
                containerMap.style.height = (dy - 20) + "px";
                containerMap.style.width = (dx - 20) + "px";
                validMap = dy > 200 && dx > 200 ? true : false;
                
                endDrawContainer();
            } else if (y2 < windowThreshold || y2 > (window.innerHeight - windowThreshold)) {
                containerMap.style.height = (dy - 20) + "px";
                containerMap.style.width = (dx - 20) + "px";
                validMap = dy > 200 && dx > 200 ? true : false;
                
                endDrawContainer();
            }
        }
        
        function endDrawContainer(e) {
            function cancelMap(){
                desktop.removeChild(containerMap);
            }
            
            if(validMap){
                googleMapButton.addEventListener("click", initMap);
                openLayersMapButton.addEventListener("click", initMap);
                cancelButton.addEventListener("click", cancelMap);
                mapOptionContainer.appendChild(googleMapButton);
                mapOptionContainer.appendChild(openLayersMapButton);
                mapOptionContainer.appendChild(cancelButton);
                containerMap.appendChild(mapOptionContainer);
                
            } else if (!validMap){
                containerMap.style.height = 100 + "px";
                containerMap.style.width = 100 + "px";
                containerMap.innerHTML = "Map too small!";
                
                setTimeout(function() {
                    try{
                        desktop.removeChild(containerMap);
                    } catch (err){}
                }, 2500);
            }
            
            containerMap.style.boxShadow = "none";
            containerMap.style.backgroundColor = "none";
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
    }
    
    drawNewMapButton.addEventListener("click", enableDrawContainer);
    clearMapsButton.addEventListener("click", clearMaps);
}

$(document).ready(function(){init(initOptions);});