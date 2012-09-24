/*
 * Map hard bro.
 *
*/

var maphard = {
    get: {
        googleTable: function(opts) {
            var thereIsACallback;
            var table;
            if(typeof opts.url != "string") return; // URL must be a string
            if(opts.callback instanceof Function) thereIsACallback = true; // callback is optional
            
            function parseTableFeed(JSONdata) {
                var parsedTable = []; // Cleaned table that will be returned
                var tableFeedEntires = JSONdata.feed.entry; // Target array containing each row as an object
                
                function findValidRows(obj, str, pos) {
                    var validRows = [];
                    
                    for (var name in obj) {
                        if (name.indexOf(str) === pos) parsedTable.push(obj[name].$t); // Objects that have the "str" at the specified "pos" are valid
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
            $.ajax({
                url: opts.url,
                complete: function(data, res) {
                    if (res === "success") {
                        table = parseTableFeed($.parseJSON(data.responseText)); // Parse to JSON, then parse the feed
                        if (thereIsACallback) opts.callback(table); // Fire callback
                    } else if (res != "success") {
                        table = []; // No table present but still send an empty array to prevent errors
                        if (thereIsACallback) opts.callback(table); // Fire callback with the empty table
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