rex-ogm
=======
An Object Graph Mapper ("OGM") which dramatically simplifies the creation, storage, retrieval and removal of vertices and edges within a graph database running Rexster.

This package makes it easier to talk to the Graph database via the Rexster RESTful API from NodeJS. It is still very much a work in progress - this version only covers the main Vertex/Edge operations. I've tried to keep it as intuitive as possible and adopt some of the styles/conventions that other ODMs and ORMs utilise

Originally this was built as a library within another project but it continued to grow to the point where it had enough functionality that it was worth packing up and releasing.

Installation
============
Coming soon.


Quick start
===========

### Connecting & Initialisation ###
```javascript
var rex = require('rex-ogm');

// Graph DB settings (optional, will default to localhost, 8182, graph)
rex.Client.Graph.options = {
    'host': 'localhost',
    'port': 8182,
    'graph': 'graph'
};

var Vertex = new rex.Vertex();
var Edge = new rex.Edge();
```

### Add Vertex with .save()
```javascript
Vertex.firstName = "Ben";
Vertex.lastName = "Mag";

Vertex.save().then(function(newVertex) {
  console.log("Created Vertex: %s %s", newVertex.firstName, newVertex.lastName);
}).catch(function(e) {
  console.log(e);
});
```

### Add Vertex with .create()
```javascript
var values = [
  {key: "firstName", value: "Ben"}, 
  {key: "lastName", value: "Dover"},
];

Vertex.create(values).then(function(newVertex) {
  console.log("Created Vertex %s - %s %s", newVertex._id, newVertex.firstName, newVertex.lastName);
}).catch(function(e) {
  console.log(e);
});
```

### Find Vertex
```javascript 
var vertexId = 1; 

Vertex.find(vertexId).then(function(foundVertex) {
  console.log(foundVertex);
}).catch(function(e) {
  console.log(e);
});
```

### Delete Vertex
```javascript 
var vertexId = 1; 

Vertex.destroy(vertexId).then(function() {
  console.log("Destroyed");
}).catch(function(e) {
  console.log(e);
});
```
