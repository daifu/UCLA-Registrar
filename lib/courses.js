var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

Courses = function(host, port) {
   this.db = new Db('courses', new Server(host, port, {auto_reconnect: true}, {}));
   this.db.open(function(){});
};

Courses.prototype.getCollection= function(callback) {
  this.db.collection('courses', function(error, course_collection) {
    if( error ) callback(error);
    else callback(null, course_collection);
  });
};
