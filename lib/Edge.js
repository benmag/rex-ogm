/** 
 * The Edge class is a subclass of Client 
 * 
 * @author  Ben Mag
 * @package rex-ogm
 * @version 1.0
 * @since   2014-08-13
 */
var Promise = require("bluebird");
var Client = require('./Client.js');


function Edge(){

}

Edge.prototype = new Client();
Edge.prototype.constructor = Edge;
Edge.prototype.endpoint = "Edge";
Edge.prototype.endpointUri = "edges";

Edge.prototype.findEdges = function(values) {
    return Edge.prototype.findRecords(values);
}


module.exports = Edge;