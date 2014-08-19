var Client = require("./lib/Client.js");
var Vertex = require("./lib/Vertex.js");
var Edge = require("./lib/Edge.js");

function rex() {

}

rex.prototype = {
	Client: Client,
	Vertex: Vertex,
	Edge: Edge,
}

module.exports = new rex;
