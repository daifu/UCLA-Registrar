var Mongolian = require('mongolian');

Courses = function() {
   if(process.env.MONGOHQ_URL) {
      db = new Mongolian(process.env.MONGOHQ_URL);
   } else {
      server = new Mongolian;
      this.db = server.db('ucla-courses');
   }
};

Courses.prototype.getCollection = function(collection, callback) {
   callback(null, this.db.collection(collection));
};

Courses.prototype.findCourse = function(term, sub, classid, callback) {
   this.getCollection('courses', function(error, course_collection) {
      if (error) {callback(error)}
      else {
         //Added 1 hour limit
         var end   = new Date(),
             start = new Date();
         start.setHours(start.getHours() - 1);

         course_collection.findOne({term: term, sub: sub, classid: classid, created_at: {$gte: start, $lte: end}}, function(error, result){
            if (error) {callback(error)}
            else {
               console.log('Find a course: ' + result);
               callback(null, result)
            };
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
         // console.log(JSON.stringify(course));
         course_collection.insert(course, function() {
            console.log('Save Course');
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
            else {
               console.log('Find terms: ' + results);
               callback(null, results);
            }
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
            console.log('Save Terms');
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
            else {
               console.log('Find subject areas: '+results);
               callback(null, results)
            };
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
            console.log("Save Subject Area");
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
            else {
               console.log("Find Subjects: "+results);
               callback(null, results)
            };
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

         //console.log(JSON.stringify(subject));
         subjects_collection.insert(subject, function(){
            console.log("Save Subject");
            callback(null, subject);
         });
      }
   });
}

exports.Courses = Courses;
