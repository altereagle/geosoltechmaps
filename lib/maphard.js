/*
 * Map hard bro.
 *
*/

var maphard = {
    get: {
        googleTable: function(URL, callback) {
            var table; // table that will be passed to the callback function
            
            // Cleans the table returned from the AJAX request
            function CLEAN(table) {
                var cleanTable = []; // Cleaned array that will be returned
                var tableObjects = table.feed.entry; // Array with each row as an object
                
                // Returns empty array if the table is empty or there is a bad get request
                if (!tableObjects) return cleanTable; // Returns the unpopulated array
                
                // Finds valid rows and returns an array with each
                function getValidRows(obj) {
                    var tempArr = []; // Temporary array for storing each found name
                    
                    // Looks at each name in the object
                    for (var name in obj) {
                        // Objects that start with "gsx$" are valid
                        if (name.indexOf("gsx$") === 0) tempArr.push(obj[name].$t); // Valid objects are added to the temporary array
                    }
                    return tempArr; // Returns the populated array 
                }
                
                // Loops through the objects in the raw array
                tableObjects.map(function(OBJ) {
                    var row = getValidRows(OBJ); // Finds valid rows in the object
                    cleanTable.push(row); // Populates the clean array with an array for each row
                });
                
                return cleanTable; // Returns the populated clean table
            }
            $.ajax({
                url: URL,
                complete: function(data, res) {
                    // If the get request is successful,
                    if (res === "success") {
                        table = CLEAN($.parseJSON(data.responseText)); // Parse to JSON, then clean
                        if (callback instanceof Function) callback(table); // Fire callback with the full table
                        // If the get request is un-successful,
                    } else if (res != "success") {
                        table = []; // No table present but still send an empty array to prevent errors
                        if (callback instanceof Function) callback(table); // Fire callback with the empty table
                    }
                }
            });
        },
        urlArgs:function(URL, callback) {
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
    tools:{
        stripHTML: function (inputString, callback){
            var htmlTags = /<(?:.|\n)*?>/gm;
            var outputString = "";
            if (typeof inputString === "string") outputString = inputString.replace(htmlTags, '');
            if (callback instanceof Function) callback(outputString); // Fire callback
            return outputString;
        }
    }
};