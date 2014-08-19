/** 
 * This class makes it easier to talk to the database via the Rexster
 * RESTful API. It dramatically simplifies the creation, storage and 
 * retrieval of nodes and edges within the graph database.
 * 
 * @author  Ben Mag
 * @package rex-ogm
 * @version 1.0
 * @since   2014-07-29
 */

var Promise = require("bluebird"),
	request = require("request"),
    async = require("async"),
    hat = require('hat'),
    rack = hat.rack();


function Graph() {
   
   // Graph DB options
    this.options = {
        'host': 'localhost',
        'port': 8182,
        'graph': 'graph'
    };
    
    // if a request fails retry 
    this.retryTimes = 5;

}


Graph.prototype = {
    constructor: Graph,

    /** 
     * This method is used to generate the 
     * URL to be used for a REST API call
     * 
     * @param String uri - URI for API endpoint
     * @return String - API URL
     */
    apiRequest: function(uri) {
        return "http://" + this.options.host + ":" + this.options.port + "/graphs/" + this.options.graph + "/" + uri;
    },

}

// expose it to our app
module.exports = Graph;
