var  request = require('request')
   , jsdom = require('jsdom')
   , Courses = require('./courses').Courses;

//Create course model
var courses = new Courses();

API = function(){};

function removeFieldFromObject(object, field) {
  var new_object = {};
  for (var prop in object) {
    // Ignore the _id field from the mongohq
    if (prop !== field) {
      new_object[prop] = object[prop];
    }
  }
  return new_object;
}

API.prototype.getTerms = function(callback) {
   courses.findAllTerms(function(error, allTerms){
      if (allTerms.length === 0) {
         //Tell the request that we want to fetch http://www.registrar.ucla.edu/schedule/schedulehome.aspx
         request({url: 'http://www.registrar.ucla.edu/schedule/schedulehome.aspx'}, function(err, response, body){
            //Just a basic error check
            if (err && response.statusCode !== 200) { console.log('Request error! Not HTTP 200'); }
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
                  };
               });
               courses.saveTerms(terms, function(){});
               callback(null, terms);
            });
         });
      } else {
         for (var i = 0; i < allTerms.length; i += 1) {
           allTerms[i] = removeFieldFromObject(allTerms[i], '_id');
         }
         callback(null, allTerms);
      }
   });
};

// return subject areas based on the term
API.prototype.getSubjectAreas = function(term, callback) {
   courses.findAllSubjectAreasByTerm(term, function(error, subjectAreas){
      if (subjectAreas === null || subjectAreas === undefined) {
         //Tell the request that we want to fetch http://www.registrar.ucla.edu/schedule/schedulehome.aspx
         request({url: 'http://www.registrar.ucla.edu/schedule/schedulehome.aspx'}, function(err, response, body){
            //Just a basic error check
            if (err && response.statusCode !== 200) { console.log('Request error! Not HTTP 200'); }
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
                  };
               });
               var list = {
                  'term': term,
                  'subjectAreas': subjectAreas
               };
               courses.saveSubjectAreas(list, function(error, subjectAreas){});
               callback(null, list);
            });
         });
      } else {
         //subjectAreas is an array, so it needs to pop up the first element to
         //make it work.
         callback(null, subjectAreas);
      }
   });
};

API.prototype.getSubjects = function(term, sub, subject_url, callback) {
   courses.findAllSubjectsBySA(term, sub, function(error, subjects){
      if (subjects === null || subjects === undefined) {
         request({url: subject_url}, function(err, response, body){
            //Just a basic error check
            if (response === undefined) { console.log(subject_url); }
            if (err && response.statusCode !== 200) { console.log('Request error! Not HTTP 200'); }
            jsdom.env({
               html: body,
               scripts: ['http://code.jquery.com/jquery-1.6.min.js']
            },
            function(err, window) {
               //Use jQuery just as in a regular HTML Page
               var $ = window.jQuery,
               title = $('#ctl00_BodyContentPlaceHolder_crsredir1_lblSAHeaderNormal').text(),
               $class_opts = $('#ctl00_BodyContentPlaceHolder_crsredir1_lstCourseNormal').children(),
               cls = [];

               if (title.length === 0) {
                  title = $('#ctl00_BodyContentPlaceHolder_crsredir1_lblSAHeaderTentative').text();
               }

               if ($class_opts.length === 0) {
                  $class_opts = $('#ctl00_BodyContentPlaceHolder_crsredir1_lstCourseTentative').children();
               }

               $class_opts.each(function(i, v){
                  cls[i] = {
                     // convert all the white space into +
                     'key' : $(v).val().replace(/\s/g, "+"),
                     'name' : $(v).text()
                  };
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

               var list = {
                  'title': title,
                  'cls': cls,
                  'term': term,
                  'sub': sub,
                  'back_links': back_links
               };
               //save all the data to the database
               courses.saveSubjects(list, function(error, subjects){});
               callback(null, list);
            });
         });
      } else {
         //else use the database data
         callback(null, subjects);
      }
   });
};



API.prototype.getCourseDescription = function(list, callback) {
   var course_desc_link = 'http://www.registrar.ucla.edu/schedule/subdet.aspx?srs='+list.idNum+'&term='+list.term+'&session=';
   console.log(course_desc_link);
   request({url: course_desc_link}, function(err, response, body){
      //Just a basic error check
      if (err && response.statusCode !== 200) { console.log('Request error! Not HTTP 200'); }
      jsdom.env({
         html: body,
         scripts: ['http://code.jquery.com/jquery-1.6.min.js']
      }, function(err, window) {
         //Use jQuery just as in a regular HTML Page
         var $ = window.jQuery,
             desp = $("#ctl00_BodyContentPlaceHolder_subdet_lblCourseDescription").text().strip_tag(),
             full_title = $("#ctl00_BodyContentPlaceHolder_subdet_lblCourseHeader").text(),
             enforced_requisites = $("#ctl00_BodyContentPlaceHolder_subdet_lblEnforcedReq").text(),
             units = $("#ctl00_BodyContentPlaceHolder_subdet_lblUnits").text(),
             enrollment_restrictions = $("#ctl00_BodyContentPlaceHolder_subdet_lblEnrollRestrict").text().strip_tag(),
             impacted_class = $("#ctl00_BodyContentPlaceHolder_subdet_lblImpacted").text(),
             ge_status = $("#ctl00_BodyContentPlaceHolder_subdet_lblGEStatus").text(),
             splited_title = full_title.split('.');

         var short_title = splited_title[0];
         var long_title = splited_title[1];
         if (long_title !== undefined) {
           long_title = long_title.trim();
         }
         var course_description = {
            'short_title': short_title,
            'long_title': long_title,
            'full_title': full_title,
            'desp': desp,
            'enforced_requisites': enforced_requisites,
            'units': units,
            'enrollment_restrictions': enrollment_restrictions,
            'impacted_class': impacted_class,
            'ge_status': ge_status
         };

         list.course_desc = course_description;
         callback(null, list);
      });
   });
};


API.prototype.getCourseDetail = function(term, sub, classid, class_url, callback) {

   var list;

   courses.findCourse(term, sub, classid, function(error, course){
      if (course === null || course === undefined) {
         request({url: class_url}, function(err, response, body){
            //Just a basic error check
            if (err && response.statusCode !== 200) { console.log('Request error! Not HTTP 200'); }
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
               });
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
                        });
                        if (!$.isEmptyObject(sec_opt_child)) {
                           sec_opt[sec_opt_counter] = sec_opt_child;
                           delete sec_opt_child;
                           sec_opt_counter += 1;
                        }
                     }
                  });
                  sec_opt_wrap[tmp_counter] = sec_opt;
                  delete sec_opt;
                  tmp_counter += 1;
               });
               list = {
                  'title':             title,
                  'term':              term,
                  'sub':               sub,
                  'classid':           classid,
                  'idNum':             IDNum,
                  'course_note':       course_note,
                  'course_title':      course_title,
                  'course_sec':        course_sec,
                  'sec_opt_wrap':      sec_opt_wrap,
                  'link_to_profs':     link_to_profs
               };
               //save the data to the course
               courses.saveCourses(list, function(error, course){});
               API.prototype.getCourseDescription(list, callback);
            });
         });
      } else {
         //else use the database data
         API.prototype.getCourseDescription(course, callback);
      }
   });

   // callback(null, list);
};

API.prototype.populateDB = function(callback) {
   API.prototype.getTerms(function(error, terms){
      terms.map(function(term){
         // Get subject areas from the terms
         API.prototype.getSubjectAreas(term.key, function(error, list){
            if (!error && list) {
               list.subjectAreas.map(function(subjectArea){
                  // Get subjects from the subject areas
                  var subject_url = 'http://www.registrar.ucla.edu/schedule/crsredir.aspx?termsel='+list.term+'&subareasel='+subjectArea.key;
                  API.prototype.getSubjects(list.term, subjectArea.key, subject_url, function(error, subjects) {
                     if (!error && subjects && subjects.cls.length > 0) {
                        var term = subjects.term,
                            sub = subjects.sub,
                            classids = subjects.cls;
                        classids.map(function(ele){
                           var classid = ele.key;
                           var class_url = 'http://www.registrar.ucla.edu/schedule/detselect.aspx?termsel='+term+'&subareasel='+sub+'&idxcrs='+classid;
                           API.prototype.getCourseDetail(term, sub, classid, class_url, function(error, course){
                              // Save all the courses
                              // callback(null, subjects);
                              console.log("Save and found: " + course.course_title);
                           });
                        });
                     }
                  });
               });
            }
         });
      });
   });
};

API.prototype.getAllSubjects = function(callback) {
   courses.findAllSubjects(function(error, subjects){
      if (!error && subjects) {
         callback(null, subjects);
      } else {
         callback(error);
      }
   });
};

API.prototype.getAllSubjectAreas = function(callback) {
   courses.findAllSubjectAreas(function(error, subjectAreas){
      if (!error && subjectAreas) {
         callback(null, subjectAreas);
      } else {
         callback(error);
      }
   });
};

API.prototype.getAllCoursesDetail = function(callback) {
   courses.findAllCoursesDetail(function(error, coursesDetail){
      if (!error && coursesDetail) {
         callback(null, coursesDetail);
      } else {
         callback(error);
      }
   });
};
exports.API = API;
