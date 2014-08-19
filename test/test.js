var chai = require('chai');
var expect = chai.expect;
var should = chai.should();
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

var request = require("request");
var Promise = require("bluebird"),
//var should = chai.should();


Client = require('../lib/Client.js');
Client = new Client();

Vertex = require('../lib/Vertex.js');
Edge = require('../lib/Edge.js');


describe("Graph", function() {
   
    describe("new Graph()", function() {

        it("should have a host set", function() {
            expect(Client.Graph.options.host).to.exist;
        });

        it("should have a port set", function(){
            expect(Client.Graph.options.port).to.exist;
        });

        it("should have a graph set", function(){
            expect(Client.Graph.options.graph).to.exist;
            expect(Client.Graph.options.graph).to.be.a('string');
        });

        it("should have number of retry times defined", function(){
            expect(Client.Graph.retryTimes).to.be.a('number');
        });

    });

    describe("Graph.apiRequest()", function() {

        it("should produce the correct url", function(){
           expect(Client.Graph.apiRequest("")).to.equal("http://"+Client.Graph.options.host+":"+Client.Graph.options.port+"/graphs/"+Client.Graph.options.graph+"/");
        });

        it("should be able to resolve default api url", function(done){
            request.get(Client.Graph.apiRequest(""), function(err, res, body) {
                expect(res.statusCode).to.equal(200);
                done();
            });
        });

        it("should be able to access specified graph db", function(done){
            request.get(Client.Graph.apiRequest(""), function(err, res, body) {

                var body = JSON.parse(body);
                
                expect(res.statusCode).to.equal(200);
                expect(body.name).to.equal(Client.Graph.options.graph);
                expect(body.graph).to.exist;

                done();
            });
        });
    });
});


describe("Vertex", function() {

    this.timeout(15000);
   
    describe("new Vertex()", function() {

        it("should set Vertex properties locally", function() {
            var person = new Vertex();
            person.foo = "Bar";
            person.numb = 1;

            expect(person.foo).to.equal("Bar");
            expect(person.numb).to.equal(1);

        });

    });


    describe(".save()", function() {

        it("should create and store a Vertex in the graph db", function(done){

            var person = new Vertex();
            person.foo = "Bar";
            person.numb = 1;
            person.save().then(function(V) {
                
                expect(V.foo).to.equal("Bar");
                expect(V.numb).to.equal("1");
                expect(V._type).to.equal("vertex");

                person.destroy(V._id);
                done();
            });

        });

    });


    describe(".create()", function() {

        it("should create and store a Vertex in the graph db", function(done){

            var person = new Vertex();
            var values = [{key: "hello", value: "world"}, {key: "numb", value: 2}];

            person.create(values).then(function(V) {
              
              expect(V.hello).to.equal("world");
              expect(V.numb).to.equal("2");
              expect(V._type).to.equal("vertex");

              person.destroy(V._id);

              done();
            });

        });

    });

    
    describe(".destroy()", function() {

        it("should delete a Vertex from the DB", function(done){

            var person = new Vertex();
            person.eyeColour = "Brown";
            person.hairColour = "Brown";
            person.save().then(function(person) {

                var V = new Vertex();

                V.destroy(person._id).then(function(result) {
                    expect(result).to.be.true;
                    done();
                });

            });

        });

        it("should reject if Vertex doesn't exist", function(){

            var V = new Vertex();
            var find = V.destroy(-1);
            expect(find).to.be.rejected;

        });

    });

    

    describe(".find()", function() {

        it("should create a Vertex then find it", function(done){

            var person = new Vertex();
            person.foo = "Bar";
            person.numb = 1;

            person.save().then(function(V) {

                // We've saved it, now find it
                person.find(V._id).then(function(foundVertex) {

                    expect(foundVertex._id).to.equal(V._id);
                    expect(V._type).to.equal(V._type);
                    expect(foundVertex.foo).to.equal(V.foo);
                    expect(foundVertex.numb).to.equal(V.numb);

                    // clean up
                    person.destroy(foundVertex._id);
                    done();
                });
                
            });

        }); 

        it("should reject if it cant find vertex", function(){

            var V = new Vertex();
            var find = V.find(-1);
            expect(find).to.be.rejected;

        });

    });


    describe(".findByKeyValue()", function() {

        it("should find a vertex by a key value pair", function(done) {

            var V = new Vertex();
            V.fakeName = "Ben Down";
            V.save().then(function(ben) {

                V.findByKeyValue("fakeName", ben.fakeName).then(function(match) {
                    
                    if(Object.keys(match).length > 0) {
                        expect(match[0].fakeName).to.equal(ben.fakeName)
                    } else {
                        expect(match.fakeName).to.equal(ben.fakeName);
                    }

                    // clean up
                    V.destroy(ben._id);
                    
                    done();

                });

            });
            
        });

        it("should handle not being able to find a key pair", function(done) {

            var V = new Vertex();
            V.findByKeyValue("SomeRandomThing", "SomeRandomValue!!!!").then(function(results) {
                expect(results).to.be.empty;
                done();
            })
        })

        // it should detect a broken call to findByKeyValue(key, value)

    });


    describe(".findVertices()", function() {

        it("should return an empty array if no vertex could be found", function(done) {

            var V = new Vertex();
            V.findVertices([{key: "SKDJSDJ", value: "SKJNKJSKD"}]).then(function(results) {
                expect(results).to.be.empty;
                done();
            });

        });

        it("should find the correct Vertex", function(done) {

            var person = new Vertex();
            var values = [{key: "firstName", value: "James"}, {key: "lastName", value: "Bond"}];

            person.create(values).then(function(james) {
                
                var V = new Vertex();
    
                V.findVertices(values).then(function(results) {

                    results = results[0];

                    expect(results.firstName).to.equal("James");
                    expect(results.lastName).to.equal("Bond");

                    // clean up
                    person.destroy(james._id);

                    done();

                });

            });


        });

        it("should find the correct Vertices and order them correctly", function(done) {

            var tempV = [];

            var V = new Vertex();
            var V1 = new Vertex();

            var values = [
                {key: "fullName", value: "Ben Dover"},
                {key: "firstName", value: "Ben"},
                {key: "age", value: "20"},
            ];

            V1.create(values)
            .then(function(p1) {
                
                // keep track of the vertex ID so we can delete it
                tempV.push(p1._id);

                var V2 = new Vertex();
                var values = [
                    {key: "fullName", value: "Ben Dover"},
                    {key: "age", value: "22"},
                ];

                return V2.create(values);

            })
            .then(function(p2) {

                tempV.push(p2._id);

                var V3 = new Vertex();
                var values = [
                    {key: "fullName", value: "Ben Dover"},
                    {key: "age", value: "20"},
                ];

                return V3.create(values);

            })
            .then(function(p3) {

                tempV.push(p3._id);

                var V4 = new Vertex();
                var values = [
                    {key: "fullName", value: "Ben Dover"},
                    {key: "firstName", value: "Ben"},
                    {key: "lastName", value: "Dover"},
                ];

                return V4.create(values);

            })
            .then(function(p4) {
                
                tempV.push(p4._id);

                var values = [
                    {key: "firstName", value: "Ben"},  // must find this
                    {key: "fullName", value: "Ben Dover"}, 
                    {key: "age", value: "20"},
                ];
      
                return V.findVertices(values);

            })
            .then(function(matches) {

                expect(matches[0].fullName).to.equal("Ben Dover");
                expect(matches[0].firstName).to.equal("Ben");
                expect(matches[0].age).to.equal("20");

                expect(matches[1].fullName).to.equal("Ben Dover");
                expect(matches[1].firstName).to.equal("Ben");
                expect(matches[1].lastName).to.equal("Dover");
                expect(matches[1].age).to.be.empty;

                // clean up
                V.destroy(tempV[0]);
                V.destroy(tempV[1]);
                V.destroy(tempV[2]);
                V.destroy(tempV[3]);
                
                done();

            });

        });

        // it("should be able to order correctly", function(done) {

        // });
    });


    describe(".firstOrCreate()", function() {

        it("should get the first Vertex available with one key:value pair", function(done) {

            var V = new Vertex(); 
            var values = [
                {key: "fullName", value: "Ben D. Over"},
                {key: "fakeName", value: "Ben Dover"},
            ];


            V.firstOrCreate(values).then(function(result) {
                expect(result.fullName).to.equal("Ben D. Over");
                expect(result.fakeName).to.equal("Ben Dover");
                

                V.destroy(result._id);
                done();
            });

        });

        it("should get the first Vertex available multiple key:value pairs", function(done) {

            var tempV = [];

            var V = new Vertex(); 
            var V1 = new Vertex(); 
            var values = [
                {key: "firstName", value: "Ben"},
                {key: "lastName", value: "Dover"},
                {key: "age", value: "20"},
            ];

            V1.create(values).then(function(p1) {
                
                tempV.push(p1._id);
                
                var V2 = new Vertex();
                var values = [
                    {key: "firstName", value: "Ben"},
                    {key: "lastName", value: "Dover"},
                    {key: "age", value: "30"},
                ];

                return V2.create(values);

            }).then(function(p2) {

                tempV.push(p2._id);
                
                return V.firstOrCreate(values);

            }).then(function(result) {

                expect(result.firstName).to.equal("Ben");
                expect(result.lastName).to.equal("Dover");
                expect(result.age).to.equal("20");

                V.destroy(tempV[0]);
                V.destroy(tempV[1]);

                done();

            });


        });


        it("should not create a new vertex if vertex is already created", function(done) {

            var tempV = [];

            var values = [{key: "firstName", value: "REALlyOddName"}, {key: "lastName", value: "EvennOdderLastnamee"}, { key: "age", value: "1337"}];
            var V = new Vertex();


            V.firstOrCreate(values)
            .then(function(V1) {
                
                tempV.push(V1._id); // so we can clean up

                expect(V1.firstName).to.equal("REALlyOddName");
                expect(V1.lastName).to.equal("EvennOdderLastnamee");
                expect(V1.age).to.equal("1337");

                return V.firstOrCreate(values);
            })
            .then(function(V2) {

                tempV.push(V2._id); // so we can clean up
                
                expect(V2.firstName).to.equal("REALlyOddName");
                expect(V2.lastName).to.equal("EvennOdderLastnamee");
                expect(V2.age).to.equal("1337");
                
                return V.findVertices(values);
            })
            .then(function(vertices) {
                
                expect(vertices.length).to.equal(1);
                expect(vertices[0]._id).to.equal(tempV[0]);
                expect(vertices[0]._id).to.equal(tempV[1]);

                V.destroy(tempV[0]).then(function(a) {
                    done();
                });

            });

        });

    });

});

describe("Edge", function() {

    this.timeout(15000);

    var ids = [];

    before(function(done){


        values = [{key: "name", value: "PersonA"}];

        V1 = new Vertex()
        V1.firstOrCreate(values).then(function(p1) {
          
            ids.push(p1._id);

            V2 = new Vertex();
            return V2.firstOrCreate([{key: "name", value: "PersonB"}]);

        }).then(function(p2) {

            ids.push(p2._id);
            done();

        });

    });

    describe("new Edge()", function() {

        it("should set Edge properties locally", function() {
            var e = new Edge();
            e._inV = 1;
            e._outV = 2;
            e._label = "knows";

            expect(e._inV).to.equal(1);
            expect(e._outV).to.equal(2);
            expect(e._label).to.equal("knows")

        });

    });


    describe(".save()", function() {

        it("should create and store an Edge in the graph db", function(done){
            
            var E = new Edge();

            E._inV = ids[0]
            E._outV = ids[1];
            E._label = "knows";
            
            E.save().then(function(result) {

                expect(result._inV).to.equal(ids[0]);
                expect(result._outV).to.equal(ids[1]);
                expect(result._label).to.equal("knows");
                expect(result._type).to.equal("edge");
                
                E.destroy(result._id).then(function(result) {
                    done();
                })

            })
            

        });

    });


    describe(".create()", function() {

        it("should create and store an Edge in the graph db", function(done){

            var E = new Edge();
            var values = [
                {key: "_inV", value: ids[0]}, 
                {key: "_outV", value: ids[1]},
                {key: "_label", value: "friends"},
            ];

            E.create(values).then(function(result) {
              
                expect(result._inV).to.equal(ids[0]);
                expect(result._outV).to.equal(ids[1]);
                expect(result._label).to.equal("friends");
                expect(result._type).to.equal("edge");

                var edge = new Edge();
                edge.destroy(result._id).then(function(result) {
                    done();
                });


            });

        });

    });

    
    describe(".destroy()", function() {

        it("should delete an Edge from the DB", function(done){

            var E1 = new Edge();

            E1._inV = ids[0]
            E1._outV = ids[1];
            E1._label = "hates";
            
            E1.save().then(function(result) {

                var edge = new Edge();
                edge.destroy(result._id).then(function(result) {
                    expect(result).to.be.true;
                    done();
                });

            })


        });

        it("should reject if Edge doesn't exist", function(){

            var E = new Edge();
            var find = E.destroy(-1);
            expect(find).to.be.rejected;

        });

    });

    

    describe(".find()", function() {

        it("should create a Edge then find it", function(done) {

            var edge = new Edge();
            edge._inV = ids[1];
            edge._outV = ids[0];
            edge._label = "admires";

            edge.save().then(function(result) {

                // We've saved it, now find it
                edge.find(result._id).then(function(foundEdge) {

                    expect(foundEdge._id).to.equal(result._id);
                    expect(result._type).to.equal(result._type);
                    expect(foundEdge.foo).to.equal(result.foo);
                    expect(foundEdge.numb).to.equal(result.numb);

                    // clean up
                    edge.destroy(foundEdge._id).then(function() {
                        done();
                    })
                });
                
            });

        }); 
 

        it("should reject if it cant find Edge", function(){

            var E = new Edge();
            var find = E.find(-1);
            expect(find).to.be.rejected;

        });

    });


    describe(".findByKeyValue()", function() {

        it("should find an Edge by a key value pair", function(done) {


            var E = new Edge();

            E._inV = ids[0]
            E._outV = ids[1];
            E._label = "knows";
            E.otherThing = "foo";

            E.save().then(function(edge) {

                // NOTE: Can't access _<key> values
                E.findByKeyValue("otherThing", edge.otherThing).then(function(match) {
                    
                    expect(match[0].otherThing).to.equal(edge.otherThing)

                    // clean up
                    E.destroy(edge._id).then(function() {
                        done();
                    });

                });

            });
            
        });

        it("should handle not being able to find a key pair", function(done) {

            var E = new Edge();
            E.findByKeyValue("SomeRandomThing", "SomeRandomValue!!!!").then(function(results) {
                expect(results).to.be.empty;
                done();
            })
        });

    });


    describe(".findEdges()", function() {

        it("should return an empty array if no Edge could be found", function(done) {

            var E = new Edge();
            E.findEdges([{key: "SKDJSDJ", value: "SKJNKJSKD"}]).then(function(results) {
                expect(results).to.be.empty;
                done();
            });

        });

        it("should find the correct Edge", function(done) {

            var edge = new Edge();
            var values = [
                {key: "foo", value: "bar"}, //searches for this
                {key: "_inV", value: ids[0]}, // matches these
                {key: "_outV", value: ids[1]},
                {key: "_label", value: "knows"},
            ];

            edge.create(values).then(function(newEdge) {
                
                var E = new Edge();
    
                E.findEdges(values).then(function(results) {

                    results = results[0];

                    expect(results._inV).to.equal(ids[0]);
                    expect(results._outV).to.equal(ids[1]);
                    expect(results._label).to.equal("knows");
                    expect(results.foo).to.equal("bar");

                    // clean up
                    edge.destroy(newEdge._id).then(function() {
                        done();
                    });


                });

            });


        });

        it("should find the correct Edges and order them correctly", function(done) {

            var tempE = [];

            var E = new Edge();
            var E1 = new Edge();

            var values = [

                {key: "knownSince", value: "2001"},
                {key: "firstMetAt", value: "school"},
                {key: "relationStatus", value: "active"},
                {key: "_inV", value: ids[0]}, 
                {key: "_outV", value: ids[1]},
                {key: "_label", value: "knows"},
            ];

            E1.create(values)
            .then(function(e1) {
                
                // keep track of the vertex ID so we can delete it
                tempE.push(e1._id);

                var E2 = new Edge();
                var values = [

                    {key: "knownSince", value: "2003"},
                    {key: "firstMetAt", value: "school"},
                    {key: "_inV", value: ids[0]}, 
                    {key: "_outV", value: ids[1]},
                    {key: "_label", value: "knows"},
                ];

                return E2.create(values);

            })
            .then(function(e2) {

                tempE.push(e2._id);

                var E3 = new Edge();
                var values = [

                    {key: "knownSince", value: "2008"},
                    {key: "firstMetAt", value: "party"},
                    {key: "relationStatus", value: "active"},
                    {key: "_inV", value: ids[0]}, 
                    {key: "_outV", value: ids[1]},
                    {key: "_label", value: "knows"},
                ];

                return E3.create(values);

            })
            .then(function(e3) {

                tempE.push(e3._id);

                var E4 = new Edge();
                var values = [

                    {key: "knownSince", value: "2001"},
                    {key: "firstMetAt", value: "school"},
                    {key: "firstFight", value: "2002"},
                    {key: "_inV", value: ids[0]}, 
                    {key: "_outV", value: ids[1]},
                    {key: "_label", value: "knows"},

                ];

                return E4.create(values);

            })
            .then(function(e4) {
                
                tempE.push(e4._id);

                var values = [

                    {key: "knownSince", value: "2001"},
                    {key: "firstMetAt", value: "school"},
                    {key: "relationStatus", value: "active"},
                    {key: "_inV", value: ids[0]}, 
                    {key: "_outV", value: ids[1]},
                    {key: "_label", value: "knows"},

                ];
      
                return E.findEdges(values);

            })
            .then(function(matches) {

                expect(matches[0].knownSince).to.equal("2001");
                expect(matches[0].relationStatus).to.equal("active");
                expect(matches[0].firstMetAt).to.equal("school");

                expect(matches[1].knownSince).to.equal("2001");
                expect(matches[1].relationStatus).to.be.empty;
                expect(matches[1].firstMetAt).to.equal("school");
                expect(matches[1].firstFight).to.equal("2002");


                // clean up
                var E = new Edge();
                E.destroy(tempE[0])
                .then(E.destroy(tempE[1]))
                .then(E.destroy(tempE[2]))
                .then(E.destroy(tempE[3]))
                .then(function() {
                    done();
                });                

            });

        });

    });


    describe(".firstOrCreate()", function() {

        it("should get the first Edge available with one key:value pair", function(done) {

            var E = new Edge(); 
        
            var values = [
                {key: "knownSince", value: "2001"},
                {key: "firstMetAt", value: "school"},
                {key: "relationStatus", value: "active"},
                {key: "_inV", value: ids[0]}, 
                {key: "_outV", value: ids[1]},
                {key: "_label", value: "knows"},
            ];
      

            E.firstOrCreate(values).then(function(result) {
                expect(result.knownSince).to.equal("2001");
                expect(result.firstMetAt).to.equal("school");
                expect(result.relationStatus).to.equal("active");
                
                E.destroy(result._id);
                done();
            });

        });

        it("should get the first Edge available multiple key:value pairs", function(done) {

            var tempE = [];

            var E = new Edge(); 
            var E1 = new Edge(); 
            var values = [
                {key: "knownSince", value: "2001"},
                {key: "firstMetAt", value: "school"},
                {key: "relationStatus", value: "active"},
                {key: "_inV", value: ids[0]}, 
                {key: "_outV", value: ids[1]},
                {key: "_label", value: "knows"},
            ];

            E1.create(values).then(function(e1) {
                
                tempE.push(e1._id);
                
                var E2 = new Edge();
                var values = [
                    {key: "knownSince", value: "2001"},
                    {key: "firstMetAt", value: "school"},
                    {key: "relationStatus", value: "inactive"},
                    {key: "_inV", value: ids[0]}, 
                    {key: "_outV", value: ids[1]},
                    {key: "_label", value: "knows"},
                ];

                return E2.create(values);

            }).then(function(e2) {

                tempE.push(e2._id);
                
                return E.firstOrCreate(values);

            }).then(function(result) {

                expect(result.knownSince).to.equal("2001");
                expect(result.firstMetAt).to.equal("school");
                expect(result.relationStatus).to.equal("active");

                E.destroy(tempE[0]);
                E.destroy(tempE[1]);

                done();

            });


        });


        it("should not create a new edge if edge is already created", function(done) {

            var tempE = [];
            var values = [
                {key: "firstMetAt", value: "RKJSJKDSN SKDNKDKJSDNJS"},
                {key: "knownSince", value: "1000"},
                {key: "relationStatus", value: "enemies"},
                {key: "_inV", value: ids[0]}, 
                {key: "_outV", value: ids[1]},
                {key: "_label", value: "knows"},
            ];
            
            var E = new Edge();


            E.firstOrCreate(values)
            .then(function(E1) {
                
                tempE.push(E1._id); // so we can clean up

                expect(E1.firstMetAt).to.equal("RKJSJKDSN SKDNKDKJSDNJS");
                expect(E1.knownSince).to.equal("1000");
                expect(E1.relationStatus).to.equal("enemies");
                expect(E1._inV).to.equal(ids[0]);
                expect(E1._outV).to.equal(ids[1]);
                expect(E1._label).to.equal("knows");

                return E.firstOrCreate(values);
            })
            .then(function(E2) {

                tempE.push(E2._id); // so we can clean up
                
                expect(E2.firstMetAt).to.equal("RKJSJKDSN SKDNKDKJSDNJS");
                expect(E2.knownSince).to.equal("1000");
                expect(E2.relationStatus).to.equal("enemies");
                expect(E2._inV).to.equal(ids[0]);
                expect(E2._outV).to.equal(ids[1]);
                expect(E2._label).to.equal("knows");


                
                return E.findEdges(values);
            })
            .then(function(edges) {
                
                expect(edges.length).to.equal(1);
                expect(edges[0]._id).to.equal(tempE[0]);
                expect(edges[0]._id).to.equal(tempE[1]);

                E.destroy(tempE[0]).then(function(a) {
                    done();
                });

            });

        });

    });


    after(function(done){


        var V = new Vertex();
        
        V.destroy(ids[0])
        .then(V.destroy(ids[1]))
        .then(function() {
            done();
        });

    });


});
