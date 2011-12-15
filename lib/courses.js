var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

Courses = function(host, port) {
   this.db = new Db('ucla-courses', new Server(host, port, {auto_reconnect: true}, {}));
   this.db.open(function(){});
};

Courses.prototype.getCollection = function(collection, callback) {
   this.db.collection(collection, function(error, result_collection) {
      if( error ) callback(error);
      else callback(null, result_collection);
   });
};

Courses.prototype.findCourse = function(term, sub, classid, callback) {
   this.getCollection('courses', function(error, course_collection) {
      if (error) {callback(error)}
      else {
         //Added 2 days limit
         var end   = new Date(),
             start = new Date();
         start.setDate(start.getDate() - 2);

         course_collection.findOne({term: term, sub: sub, classid: classid, created_at: {$gte: start, $lte: end}}, function(error, result){
            if (error) {callback(error)}
            else {callback(null, result)};
         });
      }
   });
}

Courses.prototype.saveCourses = function(course, callback) {
   this.getCollection('courses', function(error, course_collection) {
      if (error) {callback(error)}
      else {
         course_collection.findOne({term: course.term, sub: course.sub, classid: course.classid}, function(error, results){
            //Remove the old data
            if (results != null) {
               course_collection.remove({term: course.term, sub: course.sub, classid: course.classid});
            };
         });

         course.created_at = new Date();
         if (course.course_sec == undefined) {course.course_sec = [];};
         for (var j = 0; j < course.course_sec.length; j++) {
            course.course_sec[j].created_at = new Date();
         };

         course_collection.insert(course, function() {
            callback(null, course);
         });
      }
   })
}

//Find all the terms
Courses.prototype.findAllTerms = function(callback) {
   this.getCollection('terms', function(error, term_collection){
      if (error) {callback(error)}
      else {
         //Added 2 days limit
         var end   = new Date(),
             start = new Date();
         start.setDate(start.getDate() - 2);

         term_collection.find({created_at: {$gte: start, $lte: end}}).toArray(function(error, results){
            if (error) {callback(error)}
            else {callback(null, results)}
         });
      }
   });
}

Courses.prototype.saveTerms = function(terms, callback) {
   this.getCollection('terms', function(error, term_collection){
      if (error) {callback(error)}
      else {
         //Remove old data
         term_collection.find({}, function(error, results){
            if (results.length != 0) {
               term_collection.remove({});
            }
         });

         if (typeof(terms.length) == "undefined") {
            terms = [terms];
         };

         //Add new data
         for (var i = 0; i < terms.length; i++) {
            term = terms[i];
            term.created_at = new Date();
         };

         term_collection.insert(terms, function(error, results){
            callback(null, results);
         });
      }
   })
}

//Find all the subject areas based on term
//
Courses.prototype.findAllSubjectAreasByTerm = function(term, callback) {
   this.getCollection('subjectAreas', function(error, subjectAreas_collection){
      if (error) {callback(error)}
      else {
         //Added 2 days limit
         var end   = new Date(),
             start = new Date();
         start.setDate(start.getDate() - 2);

         subjectAreas_collection.findOne({term: term, created_at: {$gte: start, $lte: end}}, function(error, results){
            if (error) {callback(error)}
            else {callback(null, results)};
         });
      }
   })
}

//Save all the subject areas
//
Courses.prototype.saveSubjectAreas = function(subjectArea, callback) {
   this.getCollection('subjectAreas', function(error, subjectAreas_collection){
      if (error) {callback(error)}
      else {
         //Remove old data
         subjectAreas_collection.findOne({term: subjectArea.term}, function(error, results){
            if (results != null) {
               subjectAreas_collection.remove({term: subjectArea.term});
            }
         });
         
         //Insert new data
         subjectArea.created_at = new Date();
         if (subjectArea.subjectAreas == undefined) {subjectArea.subjectAreas = [];};
         for (var i = 0; i < subjectArea.subjectAreas.length; i++) {
            subjectArea.subjectAreas[i].created_at = new Date();
         };

         subjectAreas_collection.insert(subjectArea, function(){
            callback(null, subjectArea);
         });
      }
   })
}

//Find all the subjects based on subject area
//
Courses.prototype.findAllSubjectsBySA = function(term, sub, callback) {
   this.getCollection('subjects', function(error, subjects_collection){
      if (error) {callback(error)}
      else {
         //Added 2 days limit
         var end   = new Date(),
             start = new Date();
         start.setDate(start.getDate() - 2);

         subjects_collection.findOne({term: term, sub: sub, created_at: {$gte: start, $lte: end}}, function(error, results){
            if (error) {callback(error)}
            else {callback(null, results)};
         });
      }
   })
}

//Save all the subjects
//
Courses.prototype.saveSubjects = function(subject, callback) {
   //Insert new data to the database, and it saves memory.
   this.getCollection('subjects', function(error, subjects_collection){
      if (error) {callback(error)}
      else {
         subjects_collection.findOne({term: subject.term, sub: subject.sub}, function(error, results){
            //Remove the old data.
            if (results != null) {
               subjects_collection.remove({term: subject.term, sub: subject.sub});
            }
         });

         subject.created_at = new Date();
         if (subject.cls == undefined) {subject.cls = []};
         for (var i = 0; i < subject.cls.length; i++) {
            subject.cls[i].created_at = new Date();
         };

         if (subject.back_links == undefined) {subject.back_links = []};
         for (var i = 0; i < subject.back_links.length; i++) {
            subject.back_links[i].created_at = new Date();
         };

         subjects_collection.insert(subject, function(){
            callback(null, subject);
         });
      }
   });
}

exports.Courses = Courses;
