var Mongolian = require('mongolian');

Courses = function() {
   if(process.env.MONGOHQ_URL) {
      this.db = new Mongolian(process.env.MONGOHQ_URL);
   } else {
      server = new Mongolian();
      this.db = server.db('ucla-courses');
   }
};

Courses.prototype.getCollection = function(collection, callback) {
   callback(null, this.db.collection(collection));
};

Courses.prototype.findCourse = function(term, sub, classid, callback) {
   this.getCollection('courses', function(error, course_collection) {
      if (!error && course_collection) {
         //Added 1 hour limit
         var end   = new Date(),
             start = new Date();
         start.setHours(start.getHours() - 1);

         course_collection.findOne({term: term, sub: sub, classid: classid, created_at: {$gte: start, $lte: end}}, function(error, result){
            if (!error && result) {
               console.log('Find a course: ' + result);
               callback(null, result);
            } else {
               callback(error);
            }
         });
      } else {
         console.log("Cannot find course");
         callback(error);
      }
   });
};

Courses.prototype.saveCourses = function(course, callback) {
   this.getCollection('courses', function(error, course_collection) {
      if (!error && course_collection) {
         course_collection.findOne({term: course.term, sub: course.sub, classid: course.classid}, function(error, result){
            //Remove the old data
            if (!error && result) {
               course_collection.remove({term: result.term, sub: result.sub, classid: course.classid});
            }
         });

         course.created_at = new Date();
         if (course.course_sec === undefined) {course.course_sec = [];}
         for (var j = 0; j < course.course_sec.length; j++) {
            course.course_sec[j].created_at = new Date();
         }
         // console.log(JSON.stringify(course));
         course_collection.insert(course);
         console.log('Save Course: '+course.title);
         callback(null, course);
      } else {
         console.log("Not found course collection.");
         callback(error);
      }
   });
};

//Find all the terms
Courses.prototype.findAllTerms = function(callback) {
   this.getCollection('terms', function(error, term_collection){
      if (!error && term_collection) {
         //Added 2 days limit
         var end   = new Date(),
             start = new Date();
         start.setDate(start.getDate() - 2);

         term_collection.find({created_at: {$gte: start, $lte: end}}).toArray(function(error, results){
            if (error) {callback(error);}
            else {
               console.log('Find terms: ' + results);
               callback(null, results);
            }
         });
      } else {
         console.log("Cannot findAllTerms");
         callback(error);
      }
   });
};

Courses.prototype.saveTerms = function(terms, callback) {
   this.getCollection('terms', function(error, term_collection){
      if (!error && term_collection) {
         //Remove old data
         term_collection.find({}, function(error, results){
            if (!error && results.length !== 0) {
               term_collection.remove({});
            }
         });

         if (typeof(terms.length) == "undefined") {
            terms = [terms];
         }

         //Add new data
         for (var i = 0; i < terms.length; i++) {
            term = terms[i];
            term.created_at = new Date();
         }

         term_collection.insert(terms);
         console.log('Save Terms: ' + terms.name);
         callback(null, terms);
      } else {
         console.log("Cannot find terms collection");
         callback(error);
      }
   });
};

//Find all the subject areas based on term
//
Courses.prototype.findAllSubjectAreasByTerm = function(term, callback) {
   this.getCollection('subjectAreas', function(error, subjectAreas_collection){
      if (!error && subjectAreas_collection) {
         //Added 2 days limit
         var end   = new Date(),
             start = new Date();
         start.setDate(start.getDate() - 2);

         subjectAreas_collection.findOne({term: term, created_at: {$gte: start, $lte: end}}, function(error, results){
            if (error) {callback(error);}
            else {
               console.log('Find Subject Areas: '+results);
               callback(null, results);
            }
         });
      } else {
         console.log("Cannot find subjectAreas collection");
         callback(error);
      }
   });
};

//Save all the subject areas
//
Courses.prototype.saveSubjectAreas = function(subjectArea, callback) {
   this.getCollection('subjectAreas', function(error, subjectAreas_collection){
      if (!error && subjectAreas_collection) {
         //Remove old data
         subjectAreas_collection.findOne({term: subjectArea.term}, function(error, result){
            if (!error && result) {
               subjectAreas_collection.remove({term: result.term});
            }
         });

         //Insert new data
         subjectArea.created_at = new Date();
         if (subjectArea.subjectAreas === undefined) {subjectArea.subjectAreas = [];}
         for (var i = 0; i < subjectArea.subjectAreas.length; i++) {
            subjectArea.subjectAreas[i].created_at = new Date();
         }

         subjectAreas_collection.insert(subjectArea);
         console.log("Save Subject Area for term: "+subjectArea.term);
         callback(null, subjectArea);
      } else {
         console.log("Cannot find subjectAreas collection");
         callback(error);
      }
   });
};

//Find all the subjects based on subject area
//
Courses.prototype.findAllSubjectsBySA = function(term, sub, callback) {
   this.getCollection('subjects', function(error, subjects_collection){
      if (!error && subjects_collection) {
         //Added 2 days limit
         var end   = new Date(),
             start = new Date();
         start.setDate(start.getDate() - 2);

         subjects_collection.findOne({term: term, sub: sub, created_at: {$gte: start, $lte: end}}, function(error, result){
            if (!error && result) {
               console.log("Find Subject: "+result.title);
               callback(null, result);
            } else {
               callback(error, null);
            }
         });
      } else {
         callback(error);
      }
   });
};

//Save all the subjects
//
Courses.prototype.saveSubjects = function(subject, callback) {
   //Insert new data to the database, and it saves memory.
   this.getCollection('subjects', function(error, subjects_collection){
      if (!error && subjects_collection) {
         subjects_collection.findOne({term: subject.term, sub: subject.sub, title: subject.title}, function(error, result){
            //Remove the old data.
            if (!error && result) {
               subjects_collection.remove({term: result.term, sub: result.sub, title: result.title});
               // console.log("SaveSubjects -> Found Subject: "+ result.title);
            }
         });

         subject.created_at = new Date();
         if (subject.cls === undefined) {subject.cls = [];}
         for (var i = 0; i < subject.cls.length; i++) {
            subject.cls[i].created_at = new Date();
         }

         if (subject.back_links === undefined) {subject.back_links = [];}
         for (i = 0; i < subject.back_links.length; i++) {
            subject.back_links[i].created_at = new Date();
         }

         // console.log(JSON.stringify(subject));
         subjects_collection.insert(subject);
         console.log("Save Subject: "+subject.title);
         callback(null, subject);
      } else {
         callback(error);
      }
   });
};

Courses.prototype.findAllSubjects = function(callback) {
   this.getCollection('subjects', function(error, subjects_collection){
      if (!error && subjects_collection) {
         subjects_collection.find().sort({term: -1}).toArray(function(err, subjects){
            callback(null, subjects);
         });
      } else {callback(error);}
   });
};

Courses.prototype.findAllSubjectAreas = function(callback) {
   this.getCollection('subjectAreas', function(error, subjectAreas_collection){
      if (!error && subjectAreas_collection) {
         subjectAreas_collection.find().sort({term: 1}).toArray(function(error, subjectAreas) {
            callback(null, subjectAreas);
         });
      } else {
         callback(error);
      }
   });
};

Courses.prototype.findAllCoursesDetail = function(callback) {
   this.getCollection('courses', function(error, courses_collection) {
      courses_collection.find().sort({term: -1}).toArray(function(error, all_courses){
         if (!error && all_courses) {
            callback(null, all_courses);
         } else {
            callback(error);
         }
      });
   });
};

exports.Courses = Courses;
