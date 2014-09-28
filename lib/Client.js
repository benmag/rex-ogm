/**
 * The creators of Rexster have done an excellent 
 * job at standardising their API endpoints. So
 * much so that the only real difference when 
 * performing operations on Vertices and Edges
 * is if it's a Vertex or an Edge!
 * 
 * So we'll be implementing some inheritance
 * here with Client being the superclass and
 * Vertex and Edge being the subclasses.
 * 
 * @author  Ben Mag
 * @package rex-ogm
 * @version 1.0
 * @since   2014-08-17
 */
var Promise = require("bluebird"),
    request = require("request"),
    async = require("async"),
    hat = require('hat'),
    rack = hat.rack();  
    
var Graph = require("./Graph.js");
Graph = new Graph();



function Client() {

}

Client.prototype = {

    constructor: Client,
    Graph: Graph,
    
    /** 
     * Get record with an ID
     * 
     * @param int _id - the ID of the record in the DB
     * @return Object containing results
     */
    find: function(id) {
        
        var resolver = Promise.pending();
        var apiUrl = Graph.apiRequest(this.endpointUri+"/"+id);

        request.get(apiUrl, function(e,r,data) {
            var data = JSON.parse(data);
            if(data['message'] !== undefined) resolver.reject("ERROR [find()]: " + data['message'])
            else resolver.fulfill(data['results']);
        });


        return resolver.promise;

    },


    /** 
     * Search for a record based on 
     * a key:value pairing. 
     *
     * @param String key - the key to search over
     * @param String value - the value we want to find 
     * @return Object containing results
     */
    findByKeyValue: function(key, value) {

        var resolver = Promise.pending();
        var apiUrl = Graph.apiRequest(this.endpointUri+"/?key="+key+"&value="+value);

        request.get(apiUrl, function(e,r,data) {
            var data = JSON.parse(data);

            if(data['message'] !== undefined) resolver.reject("ERROR [findByKeyValue()]: " + data['message'])
            else resolver.fulfill(data['results']);

        });

        return resolver.promise;

    },


    /** 
     * Find the first record that matches the specified 
     * properties or create it  
     *
     * @return Object containing new Vertex/Edge
     */
    firstOrCreate: function(values) {

        self = this;
        var resolver = Promise.pending();

        this.findRecords(values).then(function(results) {
            
            if(results.length > 0) {
                resolver.fulfill(results[0]);
            } else {

                self.create(values).then(function(newEdge) {    
                    resolver.fulfill(newEdge);
                });

            }

        });

        return resolver.promise;

    },


    /** 
     * Finds all records that match the key value/s.
     * `searchParams` is an array that contains one or 
     * multiple key value objects
     * e.g. [{key: "key", value: "value"}, {}, {}]
     * 
     * Please note: REXSTER is limited in its "search"
     * capabilities, so I've thrown together this little
     * abomination which searches for the first key value
     * pair then loops through each of the results and 
     * orders by which result has the most matches
     * 
     * You can provide just one key value pair or 
     * multiple key value pairs.
     *
     * @param array searchParams - contains key value pairs 
     * @return records that match the specified key value pairs
     */
    findRecords: function(searchParams) {
        var values = [];    

        // NOTE: CLean me this is a cluster!
        // Set the values for our new vertex
        if(typeof searchParams[0] === "object" && typeof searchParams[0].key === "undefined" && typeof searchParams[0].value === "undefined") {

            values = this.convertToRexsterObject(searchParams[0]);

        } else {
            values = searchParams;
        }


        self = this;
        var resolver = Promise.pending();
        var keyValueString = this._objectToKeyValueString(values);

        // See if there are any matches
        var apiUrl = Graph.apiRequest(this.endpointUri+"/?"+keyValueString);
        request.get(apiUrl, function(e,r,data) {
            var data = JSON.parse(data);

            if(data['message'] !== undefined) {
                resolver.reject("ERROR ["+this.endpoint+".findRecords(searchParams)]: " + data['message'])          
            } else if(data.totalSize > 0) {
                resolver.fulfill(self._sortByBestMatch(values, data.results));
            } else {
                resolver.fulfill([])    
            }
        });

        return resolver.promise;

    },

    /** 
     * Sorts data by the number of matches
     * 
     * Loop through data, looking for key value matches.
     * Assign each element a "score" which is calculated
     * from the number of matches. A key:value match is 
     * ideal and has a weighting of 2. A key match is 
     * not ideal but still receives a weighting of 1 
     * as it often proves valuable to factor that in
     *
     * @param array searchParams - key:values to search for 
     * @param array data - data to search on
     * @return array of ordered results
     */
    _sortByBestMatch: function(searchParams, data) {

        // Loop through the results and order by which result has the most matches
        for(var element in data) {

            // Give each Vertex a match score 
            data[element].score = 0;

            for(var i in searchParams) {
                // +2 if it matches the key and the value, +1 if it matches the key
                if(data[element].hasOwnProperty(searchParams[i].key) 
                    && data[element][searchParams[i].key] == searchParams[i].value) {
                    data[element].score = data[element].score + 2;
                } else if(data[element].hasOwnProperty(searchParams[i].key)) {
                    data[element].score++;
                }
            }

        }

        data = data.sort(function(a,b){return b.score-a.score});

        return data;

    },


    /** 
     * Create a new record (Vertex/Edge) and provide the properties 
     * via a parameter [{ key: "key", value: "value"}, {}, {}]
     *
     * @param array values - values to create Vertex with
     * @return record (Vertex/Edge)
     */
    create: function(values) {

        var resolver = Promise.pending();

        // Set the values forour new vertex
        if(typeof values[0] === "object" && typeof values[0].key !== "undefined" && typeof values[0].value !== "undefined") {
            
            // Convert {key: '', value: ''} into `this.key = value`
            for(var i in values) this[values[i].key] = values[i].value;

        } else { 

            // Convert normal object into `this`
            for (var i = 0; i < values.length; i++) 
                this[Object.keys(values[i])] = values[i][Object.keys(values[i])];

        } 

        // Create our new Vertex
        this.save().then(function(newRecord) {
            resolver.fulfill(newRecord);
        });

        return resolver.promise;

    },


    /** 
     * Create a new record with properties
     * 
     * Handle failure to create (frequently
     * occurs when loading into a 'clean' DB)
     * by retrying `Graph.retryTimes` many times
     * 
     * @return Object containing new record
     */ 
    save: function() {

        var resolver = Promise.pending();
        var keyValueString = this._objectToKeyValueString(this);
        var apiUrl = Graph.apiRequest(this.endpointUri+"/"+rack()+"?"+keyValueString);

        function myReq(callback, data) {

            try {

                request.post({url: apiUrl}, function(e,r,data) {
                
                    
                    if(e) throw (e);
                    else {

                        var data = JSON.parse(data);

                        if(data['message'] !== undefined) {
                            // console.log("ERROR ["+this.endpoint+".save()]: " + data['message'])
                            // console.log("Retrying... ");
                            callback(true); 
                        } else {
                            callback(null, data['results']);
                        }
                    }

                });

            } catch(e) {
                callback(true);
            }

        }

        // Try to create Vertex x times then give up 
        async.retry(3, myReq, function(err, data) {
            resolver.fulfill(data);
        });

        return resolver.promise;

    },


    /** 
     * Delete a that has the specified ID from the db
     * 
     * Handle failure to delete (frequently
     * occurs at times of high transaction)
     * by retrying `Graph.retryTimes` many times
     * 
     * @return Boolean
     */ 
    destroy: function(id) {

        var resolver = Promise.pending();
        var keyValueString = this._objectToKeyValueString(this);

        var apiUrl = Graph.apiRequest(this.endpointUri+"/"+id);

        function myReq(callback, data) {

            try {

                request.del(apiUrl, function(e,r,data) {
                
                    
                    if(e) throw (e);
                    else {

                        var data = JSON.parse(data);
                        if(data.queryTime !== undefined) {
                            callback(null, true);
                        } else if(data['message'] == null) {
                            // callback("["+this.endpoint+".destroy()] Not found");
                            callback(true);
                        } else {
                            // console.log("ERROR ["+this.endpoint+".destroy()]");
                            // console.log("Retrying... ");
                            callback(true); 
                        }
                    }

                });

            } catch(e) {
                callback(true);
            }

        }

        // Try to create Vertex x times then give up 
        async.retry(3, myReq, function(err, data) {
            if(err) resolver.reject(new Error); 
            else resolver.fulfill(data);
        });

        return resolver.promise;

    },


    /** 
     * Private method that converts an object to a 
     * URI string. This is useful when inserting a
     * new edge or vertex as the API requires keys 
     * and values to be specified in the URI 
     * 
     * @param Object obj - object to convert to string
     * @return String - URI encoded key value string
     */
    _objectToKeyValueString: function(obj) {

        var keyValueString = "";

        // Generate key value string based on `properties`
        for (var i = 0; i < Object.keys(obj).length; i++) {

            // Get the key
            var key = Object.keys(obj)[i];

            // Decide if we need a connector or not (&)
            if(i == Object.keys(obj).length - 1) var connector = "";
            else var connector = "&";

            // Build up our string
            keyValueString += key + "=" + encodeURIComponent(obj[key]) + connector; 


        };

        return keyValueString;
   
    },


    /**
     * Convert a normal Object into something
     * that is Rexster friendly [{key: "foo", value: "bar"}]
     * 
     * @param Object values - to convert
     * @return Object with rexster friendly values
     */
     convertToRexsterObject: function(values) {

        var rexObj = [];

        for (var i = 0; i < Object.keys(values).length; i++) {
            rexObj.push({
                key: Object.keys(values)[i],
                value: values[Object.keys(values)[i]]
            });
        }
        

        return rexObj;
    
     },

}


// expose it to our app
module.exports = Client;