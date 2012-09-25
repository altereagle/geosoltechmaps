/*
 * Map harder bro.
 *
*/

var maphard = {
    get: {
        googleTable: function(opts) {
            var thereIsACallback;
            var jQueryEnabled;
            var htmlAllowed;
            var tableURL;
            var sheetNumber;
            var table;

            /* Evaluate and assign option values */
            opts.allowHTML === true ? htmlAllowed = true : htmlAllowed = false; // HTML tags must be explicitally allowed or all tags will be removed
            opts.tableNumber ? sheetNumber += parseInt(opts.tableNumber, 10) : sheetNumber = 6; // Select which sheet to show otherwise show first
            opts.callback instanceof Function ? thereIsACallback = true : thereIsACallback = false; // callback is optional
            typeof opts.key === "string" ? tableURL = "https://spreadsheets.google.com/feeds/list/" + opts.key + "/od" + sheetNumber + "/public/values?alt=json" : tableURL = "";

            function parseTableFeed(JSONdata) {
                var parsedTable = []; // Cleaned table that will be returned
                var tableFeedEntires = JSONdata.feed.entry; // Target array containing each row as an object

                function findValidRows(obj, str, pos) {
                    var validRows = [];

                    for (var name in obj) {
                        var rowName = name.split(str)[1]; // Get the name of the value
                        var rowValue = htmlAllowed ? obj[name].$t : maphard.tools.stripHTML(obj[name].$t); // Allow or remove HTML tags from values
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
    }
};