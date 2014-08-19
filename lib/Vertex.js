/** 
 * The Vertex class is a subclass of Client 
 * 
 * @author  Ben Mag
 * @version 1.0
 * @since   2014-08-13
 */
var Promise = require("bluebird");
var Client = require('./Client.js');


function Vertex(){

}

Vertex.prototype = new Client();
Vertex.prototype.constructor = Vertex;
Vertex.prototype.endpoint = "Vertex";
Vertex.prototype.endpointUri = "vertices";

Vertex.prototype.findVertices = function(values) {
	return Vertex.prototype.findRecords(values);
}

module.exports = Vertex;