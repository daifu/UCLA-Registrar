/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , url = require('url')
  , Parser = require('./lib/parser').Parser
  , app = module.exports = express.createServer()
  , Api = require('./lib/api').API;

// Configuration
app.configure(function(){
   app.set('views', __dirname + '/views');
   app.set('view engine', 'jade');
   app.use(express.bodyParser());
   app.use(express.methodOverride());
   app.use(app.router);
   app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

//Uitility functions
//trim all the empty string in the string
if(typeof(String.prototype.trim) === "undefined")
{
    // String.prototype.trim = function()
    // {
    //     return String(this).replace(/^\s+|\s+$/g, '');
    // };
    String.prototype.trim=function(){return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');};
}

if(typeof(String.prototype.strip_tag) === "undefined")
{
   String.prototype.strip_tag = function()
   {
      return String(this).replace(/(<([^>]+)>)/ig,"");
   };
}

//Initial Objects
var parser = new Parser();
var api = new API();

// Routes
app.get('/', function(req, res){
   parser.index(function(error, terms){
      res.render('index', {
         title: 'UCLA Courses',
         ucla_terms: terms
      });
   });
});

//Start hacking
app.get('/uclaregistrar', function(req, res){
   parser.index(function(error, terms){
      res.render('index', {
         title: 'UCLA Courses',
         ucla_terms: terms
      });
   });
});

app.get('/uclaregistrar/:term', function(req, res) {
   var term = req.params['term'];
   parser.term(term, function(error, list){
      res.render('subjectAreas', {
         title: 'UCLA Subject Areas',
         ucla_term: list.term,
         ucla_subjectAreas: list.subjectAreas
      });
   });
});

//It takes from subject area to class area
app.get('/uclaregistrar/:term/:subject', function(req, res){
   var term = req.params['term'];
   var sub = req.params['subject'].replace(/&/g, '%26');
   var subject_url = 'http://www.registrar.ucla.edu/schedule/crsredir.aspx?termsel='+term+'&subareasel='+sub;
   // console.log(subject_url);
   parser.subjects(term, sub, subject_url, function(error, list){
      res.render('subjectArea', {
         ucla_title:       list.title,
         ucla_classes:     list.cls,
         ucla_term:        list.term,
         ucla_subject:     list.sub,
         ucla_back_links:  list.back_links
      });
   });
});


//It takes from class area to class details area
app.get('/uclaregistrar/:term/:subject/:classid', function(req, res){
   var term = req.params['term'],
       sub = req.params['subject'].replace(/&/g, '%26'),
       classid = req.params['classid'];
   var class_url = 'http://www.registrar.ucla.edu/schedule/detselect.aspx?termsel='+term+'&subareasel='+sub+'&idxcrs='+classid;
   parser.courseDetail(term, sub, classid, class_url, function(error, list){
      res.render('classDetails', {
         ucla_title:              list.title,
         ucla_term:               list.term,
         ucla_subject:            list.sub,
         ucla_classid:            list.classid,
         ucla_course_note:        list.course_note,
         ucla_course_title:       list.course_title,
         ucla_course_sec:         list.course_sec,
         ucla_course_sec_detail:  list.sec_opt_wrap,
         ucla_course_desc_link:   list.course_desc_link,
         ucla_link_to_profs:      list.link_to_profs,
         ucla_back_links:         list.back_links,
         ucla_class_url:          list.class_url
      });
   });
});


//It takes from class area to class details area
app.get('/uclaregistrar/:term/:subject/:classid/:idnum', function(req, res){
   var term = req.params['term'],
       sub = req.params['subject'].replace(/&/g, '%26'),
       classid = req.params['classid'],
       idNum = req.params['idnum'],
       subjectName = req.params['subject'].replace(/\+/g, ' ')+' '+classid.replace(/\+/g, '');
   var class_url = 'http://www.registrar.ucla.edu/schedule/subdet.aspx?srs='+idNum+'&term='+term+'&session=';
   parser.courseDescription(term, sub, classid, class_url, idNum, subjectName, function(error, list){
      res.render('couseDesc', {
         ucla_course_title:  list.course_title,
         ucla_desp:          list.desp,
         ucla_back_link:     list.back_link,
         ucla_back_links:    list.back_links,
         ucla_class_url:     list.class_url
      });
   });
});

//It takes from class area to class details area
app.get('/uclaregistrar/:term/:subject/:classid/prof/:prof', function(req, res){
   var term = req.params['term'],
       sub = req.params['subject'].replace(/&/g, '%26'),
       classid = req.params['classid'],
       prof = req.params['prof'];
   var prof_url = 'http://www.bruinwalk.com/search/professors/?q='+prof;

   parser.profReview(term, sub, classid, prof, prof_url, function(error, list){
      res.render('profReviews', {
         ucla_prof:             list.prof,
         ucla_depart:           list.depart,
         ucla_avg_reviews:      list.avg_reviews,
         ucla_results:          list.results,
         ucla_back_link:        list.back_link,
         ucla_bruin_walk_link:  list.bruin_walk_link,
         ucla_back_links:       list.back_links
      });
   });
});

//////////////////////////////////////////////////////////////
/////
///// Handle Searching
/////
//////////////////////////////////////////////////////////////
// Handle searching requests
app.get('/search', function(req, res){
  api.getTerms(function(error, subjects_by_terms) {
    if (!error && subjects_by_terms) {
      api.getAllCoursesDetail(function(error, subjects){
        if (!error && subjects) {
          subjects_by_terms.map(function(ele) {
            ele.subjects = [];
            return ele;
          });
          subjects.map(function(ele){
            if (ele.title.length > 0) {
              subjects_by_terms.map(function(term){
                if (term.key === ele.term) {
                  term.subjects.push(ele);
                }
                // console.log(term);
                return term;
              });
            }
            return ele;
          });
          // console.log(subjects_by_terms);
          res.render('search', {
            ucla_subjects: subjects_by_terms
          });
        }
      });
    }
  });
});

//////////////////////////////////////////////////////////////
/////
///// Handle Star
/////
//////////////////////////////////////////////////////////////
app.post('/star/add', function(req, res){
  var term = req.body.term,
      subject = req.body.subject,
      classid = req.body.classid,
      email = decodeURIComponent(req.body.email);
  api.createUserStarred(email, term, subject, classid, function(error, user){
    if (!error && user) {
      res.send('saved');
    } else {
      console.log(error);
    }
  });
});

app.post('/star/remove', function(req, res){
  var term = req.body.term,
      subject = req.body.subject,
      classid = req.body.classid,
      email = decodeURIComponent(req.body.email);
  api.removeUserStarred(email, term, subject, classid, function(error, user){
    if (!error && user) {
      res.send('removed');
    } else {
      console.log(error);
    }
  });
});

app.get('/star/:email', function(req, res){
  var email = decodeURIComponent(req.params['email']);
  if (email === 'null' || email === null || email === undefined) {
    res.redirect('/login');
    return;
  }
  // get user info
  api.getUserStarred(email, function(error, list){
    if (!error && list) {
      res.render('star', {
        ucla_subjects: list.courses
      });
    } else {
      res.send("error");
    }
  });
});

app.get('/login', function(req, res){
  res.render('login');
});

app.post('/star/save', function(req, res){
  var email  = decodeURIComponent(req.body.email);
  if (email === null || email === undefined) {
    res.redirect('/login');
  }

  api.createUserStarred(email, null, null, null, function(error, user){
    if (!error && user) {
      res.redirect('/star/'+encodeURIComponent(email));
    } else {
      res.send("error");
    }
  });
});



//////////////////////////////////////////////////////////////
/////
///// Handle API Call
/////
//////////////////////////////////////////////////////////////
//Provide API calls for the mobile app
app.get('/api/terms', function(req, res){
  api.getTerms(function(error, terms){
    res.send(terms);
  });
});

//Provide API calls for the subject areas
app.get('/api/subject_areas/:term', function(req, res){
  var term = req.params['term'];
  api.getSubjectAreas(term, function(error, list){
    res.send({
      term: list.term,
      subject_areas: list.subjectAreas
    });
  });
});

// Provide API calls for the subjects
app.get('/api/subjects/:term/:subject', function(req, res){
  var term = req.params['term'];
  var sub = req.params['subject'].replace(/&/g, '%26');
  var subject_url = 'http://www.registrar.ucla.edu/schedule/crsredir.aspx?termsel='+term+'&subareasel='+sub;
  parser.subjects(term, sub, subject_url, function(error, list){
    res.send({
      term: list.term,
      subject: list.sub,
      classes: list.cls
    });
  });
});

// Provide API calls for the course details
app.get('/api/course/:term/:subject/:classid', function(req, res){
   var term = req.params['term'],
       sub = req.params['subject'].replace(/&/g, '%26'),
       classid = req.params['classid'];
   var class_url = 'http://www.registrar.ucla.edu/schedule/detselect.aspx?termsel='+term+'&subareasel='+sub+'&idxcrs='+classid;
   api.getCourseDetail(term, sub, classid, class_url, function(error, list){
      res.send({
         term:               list.term,
         subject:            list.sub,
         classid:            list.classid,
         course_note:        list.course_note,
         course_title:       list.course_title,
         course_sec:         list.course_sec,
         course_sec_detail:  list.sec_opt_wrap,
         course_desc:        list.course_desc,
         // course_desc_link:   list.course_desc_link,
         profs_review:       list.profs_review
         // link_to_profs:      list.link_to_profs,
      });
   });
});

// Populate database with all the UCLA Course
// It is dangerous to do that, and it will crash the server
app.get('/api/populate_db', function(req, res){
  api.populateDB(function(error, list){
    res.send("DONE");
    // res.send({
    //   courses: list.courses
    // });
  });
});

// Example
// term: 12F
// subject: COM+SCI
// classid: 0035L++
// idnum: 187105204

var port = process.env.PORT || 3001;
app.listen(port, function() {
   console.log("Listening on " + port);
});
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
