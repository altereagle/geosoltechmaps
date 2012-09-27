maphard.get.googleTable({
    key: "0AkOIIIT7wBStdC13dEh2V0xMMUdVSnhrOWV0dy1QRnc",
    callback: function(data){
        //console.log(data);
    }
});

function initGMap() {
    var mapId = "googleMap";
    var mapOptions = {
        center: new google.maps.LatLng(30.2669, -97.7428),
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    
    maphard.load.googleMap(mapId, mapOptions);
}

function initOMap(){
    var mapId = "openMap";
    var mapOptions = {
        layer: "default"
    };
        
    maphard.load.osMap(mapId,mapOptions)
}

function initAllMaps(){
    initGMap();
    initOMap();
}

$(document).ready(initAllMaps);