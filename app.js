
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , jsdom = require('jsdom')
  , request = require('request')
  , url = require('url')
  , app = module.exports = express.createServer();

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
    String.prototype.trim = function() 
    {
        return String(this).replace(/^\s+|\s+$/g, '');
    };
}
if(typeof(String.prototype.strip_tag) === "undefined")
{
   String.prototype.strip_tag = function()
   {
      return String(this).replace(/(<([^>]+)>)/ig,"");
   }
}

// Routes

app.get('/', function(req, res){
   //Tell the request that we want to fetch http://www.registrar.ucla.edu/schedule/schedulehome.aspx
   request({url: 'http://www.registrar.ucla.edu/schedule/schedulehome.aspx'}, function(err, response, body){
      //Just a basic error check
      if (err && response.statusCode !== 200) { console.log('Request error! Not HTTP 200'); };
      //Send the body param as the HTML code we will parse in jsdom
      //also tell jsdom to attach jQuery in the scripts and loaded from
      //jQuery.com
      jsdom.env({
         html: body,
         scripts: ['http://code.jquery.com/jquery-1.6.min.js']
      }, function(err, window) {
         //Use jQuery just as in a regular HTML Page
         var $ = window.jQuery,
             //Assume the id for the selection not change
             $term_opts = $('#ctl00_BodyContentPlaceHolder_SOCmain_lstTermDisp').children(),
             terms = [];

         $term_opts.each(function(i, v){
            terms[i] = {
               'key' : $(v).val(),
               'name' : $(v).text()
            }
         });

         res.render('index', {
            title: 'UCLA Courses',
            ucla_terms: terms
         });
      });
   });
});

//Start hacking
app.get('/uclaregistrar', function(req, res){
   //Tell the request that we want to fetch http://www.registrar.ucla.edu/schedule/schedulehome.aspx
   request({url: 'http://www.registrar.ucla.edu/schedule/schedulehome.aspx'}, function(err, response, body){
      //Just a basic error check
      if (err && response.statusCode !== 200) { console.log('Request error! Not HTTP 200'); };
      //Send the body param as the HTML code we will parse in jsdom
      //also tell jsdom to attach jQuery in the scripts and loaded from
      //jQuery.com
      jsdom.env({
         html: body,
         scripts: ['http://code.jquery.com/jquery-1.6.min.js']
      }, function(err, window) {
         //Use jQuery just as in a regular HTML Page
         var $ = window.jQuery,
             //Assume the id for the selection not change
             $term_opts = $('#ctl00_BodyContentPlaceHolder_SOCmain_lstTermDisp').children(),
             terms = [];

         $term_opts.each(function(i, v){
            terms[i] = {
               'key' : $(v).val(),
               'name' : $(v).text()
            }
         });

         res.render('index', {
            title: 'UCLA Courses',
            ucla_terms: terms
         });
      });
   });
});

app.get('/uclaregistrar/:term', function(req, res){
   var term = req.params['term'];

   //Tell the request that we want to fetch http://www.registrar.ucla.edu/schedule/schedulehome.aspx
   request({url: 'http://www.registrar.ucla.edu/schedule/schedulehome.aspx'}, function(err, response, body){
      //Just a basic error check
      if (err && response.statusCode !== 200) { console.log('Request error! Not HTTP 200'); };
      //Send the body param as the HTML code we will parse in jsdom
      //also tell jsdom to attach jQuery in the scripts and loaded from
      //jQuery.com
      jsdom.env({
         html: body,
         scripts: ['http://code.jquery.com/jquery-1.6.min.js']
      }, function(err, window) {
         //Use jQuery just as in a regular HTML Page
         var $ = window.jQuery,
             $subjetArea_opts = $("#ctl00_BodyContentPlaceHolder_SOCmain_lstSubjectArea").children(),
             subjectAreas = [];

         $subjetArea_opts.each(function(i, v){
            subjectAreas[i] = {
               // Convert all the white space into +
               'key' : $(v).val().replace(/\s/g, "+"),
               'name' : $(v).text()
            }
         });

         res.render('courseTerms', {
            title: 'UCLA Subject Areas',
            ucla_term: term,
            ucla_subjectAreas: subjectAreas
         });
      });
   });
});

//It takes from subject area to class area
app.get('/uclaregistrar/:term/:subject', function(req, res){
   var term = req.params['term'];
   var sub = req.params['subject'].replace(/&/g, '%26');
   var subject_url = 'http://www.registrar.ucla.edu/schedule/crsredir.aspx?termsel='+term+'&subareasel='+sub;
   // console.log(subject_url);
   //Tell the request that we want to fetch http://www.registrar.ucla.edu/schedule/crsredir.aspx
   request({url: subject_url}, function(err, response, body){
      //Just a basic error check
      if (err && response.statusCode !== 200) { console.log('Request error! Not HTTP 200'); };
      jsdom.env({
         html: body,
         scripts: ['http://code.jquery.com/jquery-1.6.min.js']
      }, function(err, window) {
         //Use jQuery just as in a regular HTML Page
         var $ = window.jQuery,
             title = $('#ctl00_BodyContentPlaceHolder_crsredir1_lblSAHeaderNormal').text(),
             $class_opts = $('#ctl00_BodyContentPlaceHolder_crsredir1_lstCourseNormal').children(),
             cls = [];

         if (title.length === 0) {
            title = $('#ctl00_BodyContentPlaceHolder_crsredir1_lblSAHeaderTentative').text();
         };
         
         if ($class_opts.length === 0) {
            $class_opts = $('#ctl00_BodyContentPlaceHolder_crsredir1_lstCourseTentative').children();
         };
         
         $class_opts.each(function(i, v){
            cls[i] = {
               // convert all the white space into +
               'key' : $(v).val().replace(/\s/g, "+"),
               'name' : $(v).text()
            }
         });

         var back_links = [
         {
            'page': 'Home',
            'link': '/uclaregistrar'
         }, 
         {  
            'page': 'Subject Areas',
            'link': '/uclaregistrar/'+term
         }];

         res.render('subjectArea', {
            ucla_title: title,
            ucla_classes: cls,
            ucla_term: term,
            ucla_subject: sub,
            ucla_back_links: back_links
         });
      });
   });
});


//It takes from class area to class details area
app.get('/uclaregistrar/:term/:subject/:classid', function(req, res){
   var term = req.params['term'],
       sub = req.params['subject'].replace(/&/g, '%26'),
       classid = req.params['classid'];
   var class_url = 'http://www.registrar.ucla.edu/schedule/detselect.aspx?termsel='+term+'&subareasel='+sub+'&idxcrs='+classid;
   //Tell the request that we want to fetch http://www.registrar.ucla.edu/schedule/detselect.aspx
   request({url: class_url}, function(err, response, body){
      //Just a basic error check
      if (err && response.statusCode !== 200) { console.log('Request error! Not HTTP 200'); };
      jsdom.env({
         html: body,
         scripts: ['http://code.jquery.com/jquery-1.6.min.js']
      }, function(err, window) {
         //Use jQuery just as in a regular HTML Page
         var $ = window.jQuery,
             title = $('.SAHeaderDarkGreenBar').text(),
             course_note = $('#ctl00_BodyContentPlaceHolder_detselect_trClassNotes').text().trim(),
             $course_head = $('.coursehead'),
             course_title = '', course_sec = [], sec_counter = 0,
             $detail_tables = $(".dgdTemplateGrid:contains(Type)"),
             ID_number = '', Days = '', Start = '', Stop = '', Building = '', Room = '',
             Rest = '', En = '', EnCp = '', WL = '', WLCp = '', Status = '',
             IDClassName = 'dgdClassDataColumnIDNumber',
             DaysClassName = 'dgdClassDataDays',
             StartClassName = 'dgdClassDataTimeStart',
             StopClassName = 'dgdClassDataTimeEnd',
             BuildingClassName = 'dgdClassDataBuilding',
             RoomClassName = 'dgdClassDataRoom',
             RestClassName = 'dgdClassDataRestrict',
             EnClassName = 'dgdClassDataEnrollTotal',
             EnCpClassName = 'dgdClassDataEnrollCap',
             WLClassName = 'dgdClassDataWaitListTotal',
             WLCpClassName = 'dgdClassDataWaitListCap',
             StatusClassName = 'dgdClassDataStatus';
         
         var link_to_profs = [];
         $course_head.each(function(i, v) {
            var $tmp = $(v);
            if ($tmp.parents('.SAHeaderDarkGreenBar').length > 0) {
               course_title = $(v).text();
            } else if ($tmp.next('.fachead').length > 0) {
               var instuctor = $tmp.next('.fachead').text().replace(/\s+/g, ""),
                   instuctor_link = instuctor.split(',')[0];
               course_sec[sec_counter] = {
                  'section': $tmp.text(),
                  'instuctor': instuctor,
                  'section_link': $tmp.text().replace(/\s+/g, "")
               };
               link_to_profs[sec_counter] = {
                  'link': '/uclaregistrar/'+term+'/'+sub+'/'+classid+'/prof/'+instuctor_link};
               sec_counter += 1;
            }
         })
         
         //Get the details for each section
         var tmp_counter = 0;
         var sec_opt_wrap = [];
         var IDNum = '';
         $detail_tables.each(function(i, v){
            var table_rows = $(v).find('tr'),
                sec_opt_counter = 0,
                sec_opt = [];
            table_rows.each(function(ti, tv) {
               var $tr = $(tv), sec_opt_child = {};
               if ($tr.hasClass('.dgdClassDataHeader')) {
                  // tmp_counter += 1;
               } else {
                  var table_data = $(tv).find('td');
                  table_data.each(function(di, dv){
                     var td_data = $(dv);
                     switch(td_data.attr('class')) {
                        case IDClassName:
                           var id_num = td_data.find('a').text();
                           if (id_num.match(/[0-9]{9}/)) {
                              sec_opt_child.IDNumber = id_num;
                              IDNum = id_num;
                           } else {
                              sec_opt_child.IDNumber = 'NONE';
                           }
                           break;
                        case DaysClassName:
                           var days = td_data.children().text().trim();
                           sec_opt_child.Days = days;
                           break;
                        case StartClassName:
                           var start = td_data.children().text().trim();
                           sec_opt_child.Start = start;
                           break;
                        case StopClassName:
                           var stop = td_data.children().text().trim();
                           sec_opt_child.Stop = stop;
                           break;
                        case BuildingClassName:
                           var building = td_data.children().text().trim();
                           sec_opt_child.Building = building;
                           break;
                        case RoomClassName:
                           var room = td_data.children().text().trim();
                           sec_opt_child.Room = room;
                           break;
                        case RestClassName:
                           var rest = td_data.children().text().trim();
                           sec_opt_child.Rest = rest;
                           break;
                        case EnClassName:
                           var en = td_data.children().text().trim();
                           sec_opt_child.En = en;
                           break;
                        case EnCpClassName:
                           var encp = td_data.children().text().trim();
                           sec_opt_child.EnCp = encp;
                           break;
                        case WLClassName:
                           var wl = td_data.children().text().trim();
                           sec_opt_child.WL = wl;
                           break;
                        case WLCpClassName:
                           var wlcp = td_data.children().text().trim();
                           sec_opt_child.WLCp = wlcp;
                           break;
                        case StatusClassName:
                           var sta = td_data.children().text().trim();
                           sec_opt_child.Status = sta;
                           break;
                        default:
                           break;
                     }
                  })
                  if (!$.isEmptyObject(sec_opt_child)) {
                     sec_opt[sec_opt_counter] = sec_opt_child;
                     delete sec_opt_child;
                     sec_opt_counter += 1;
                  };
               }
            })
            sec_opt_wrap[tmp_counter] = sec_opt;
            delete sec_opt;
            tmp_counter += 1;
         })

         var course_desc_link = '/uclaregistrar/'+term+'/'+sub+'/'+classid+'/'+IDNum;
         var back_links = [
         {
            'page': 'Home',
            'link': '/uclaregistrar'
         }, 
         {  
            'page': 'Subject Areas',
            'link': '/uclaregistrar/'+term
         },
         {
            'page': 'Subject',
            'link': '/uclaregistrar/'+term+'/'+sub
         },
         {
            'page': 'UCLA Class Page',
            'link': class_url
         }
         ];

         res.render('classDetails', {
            ucla_title: title,
            ucla_term: term,
            ucla_subject: sub,
            ucla_classid: classid,
            ucla_course_note: course_note,
            ucla_course_title: course_title,
            ucla_course_sec: course_sec,
            ucla_course_sec_detail: sec_opt_wrap,
            ucla_course_desc_link: course_desc_link,
            ucla_link_to_profs: link_to_profs,
            ucla_back_links: back_links,
            ucla_class_url: class_url
         });
      });
   });
});


//It takes from class area to class details area
app.get('/uclaregistrar/:term/:subject/:classid/:idnum', function(req, res){
   var term = req.params['term'],
       sub = req.params['subject'].replace(/&/g, '%26'),
       classid = req.params['classid'],
       idNum = req.params['idnum'];
   var class_url = 'http://www.registrar.ucla.edu/schedule/subdet.aspx?srs='+idNum+'&term='+term+'&session=';
   //Tell the request that we want to fetch http://www.registrar.ucla.edu/schedule/detselect.aspx
   request({url: class_url}, function(err, response, body){
      //Just a basic error check
      if (err && response.statusCode !== 200) { console.log('Request error! Not HTTP 200'); };
      jsdom.env({
         html: body,
         scripts: ['http://code.jquery.com/jquery-1.6.min.js']
      }, function(err, window) {
         //Use jQuery just as in a regular HTML Page
         var $ = window.jQuery,
             desp = $("#ctl00_BodyContentPlaceHolder_subdet_lblCourseDescription").text().strip_tag(),
             back_link = "/uclaregistrar/"+term+"/"+sub+"/"+classid;
         
         
         var back_links = [
         {
            'page': 'Home',
            'link': '/uclaregistrar'
         }, 
         {  
            'page': 'Subject Areas',
            'link': '/uclaregistrar/'+term
         },
         {
            'page': 'Subject',
            'link': '/uclaregistrar/'+term+'/'+sub
         },
         {
            'page': 'Course Details',
            'link': '/uclaregistrar/'+term+'/'+sub+'/'+classid
         },
         {
            'page': 'UCLA Class Detail Page',
            'link': class_url
         }];

         res.render('couseDesc', {
            ucla_course_title: req.params['subject'].replace(/\+/g, ' ')+' '+classid.replace(/\+/g, ''),
            ucla_desp: desp,
            ucla_back_link: back_link,
            ucla_back_links: back_links,
            ucla_class_url: class_url
         })
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
   request({url: prof_url}, function(err, response, body){
      //Just a basic error check
      if (err && response.statusCode !== 200) { console.log('Request error! Not HTTP 200'); };
      jsdom.env({
         html: body,
         scripts: ['http://code.jquery.com/jquery-1.6.min.js']
      }, function(err, window) {
         //Use jQuery just as in a regular HTML Page
         var $ = window.jQuery,
             $avgs = $('#ratings_average').find('.graph'),
             depart = $($('.breadcrumbs li')[2]).text().replace(/\//, ''),
             avgs_key = [
                 'Effective',
                 'Easy',
                 'Concerned',
                 'Available',
                 'Overall'],
             avg_reviews = [],
             avgs_key_len = avgs_key.length - 1;
         $avgs.each(function(i, v){
            if (i > avgs_key_len) {
               return false;
            };
            avg_reviews[i] = {
               'key': avgs_key[i],
               'value': $(v).text().trim()
            };
         });
         
         //If there is no result for that professor
         var $results = $('.result'),
             results = [],
             counter = 0;
         if (avg_reviews.length == 0) {
            $results.each(function(i, v){
               var $li = $(v).find('.stats li');
               var avg_reviews = [];
               $li.each(function(li, lv){
                  if (li >= avgs_key_len) {
                     return false;
                  };
                  avg_reviews[li] = {
                     'key': avgs_key[li],
                     'value': $(lv).text().replace(/[a-z]+/i, '').trim()
                  }
               });
               avg_reviews[avgs_key_len] = {
                  'key': avgs_key[avgs_key_len],
                  'value': $(v).find('.overall').text().replace(/[a-z]+/i, '').trim()
               };
               var $prof = $(v).find('h4 a');
               results[counter] = {
                  'department': $prof.parent().next().text().trim(),
                  'prof': $prof.text(),
                  'reviews': avg_reviews
               };
               delete avg_reviews;
               counter += 1;
            })
         };

         // console.log(prof_url);
         // console.log(results);

         var back_links = [
         {
            'page': 'Home',
            'link': '/uclaregistrar'
         }, 
         {  
            'page': 'Subject Areas',
            'link': '/uclaregistrar/'+term
         },
         {
            'page': 'Subject',
            'link': '/uclaregistrar/'+term+'/'+sub
         },
         {
            'page': 'Course Details',
            'link': '/uclaregistrar/'+term+'/'+sub+'/'+classid
         }];

         var back_link = '/uclaregistrar/'+term+'/'+sub+'/'+classid;
         var bruin_walk_link = prof_url;
         res.render('profReviews', {
            ucla_prof: prof,
            ucla_depart: depart,
            ucla_avg_reviews: avg_reviews,
            ucla_results: results,
            ucla_back_link: back_link,
            ucla_bruin_walk_link: bruin_walk_link,
            ucla_back_links: back_links
         });
      });
   });
});

var port = process.env.PORT || 3000;
app.listen(port, function() {
   console.log("Listening on " + port);
});
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
