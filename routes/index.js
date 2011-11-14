/*
 * GET home page.
 */
var jsdom = require('jsdom')
  , request = require('request');


exports.index = function(req, res){
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
};
