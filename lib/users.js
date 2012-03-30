var Mongolian = require('mongolian');

Users = function() {
   if(process.env.MONGOHQ_URL) {
      this.db = new Mongolian(process.env.MONGOHQ_URL);
   } else {
      server = new Mongolian;
      this.db = server.db('ucla-courses');
   }
};

Users.prototype.getCollection = function(collection, callback) {
   callback(null, this.db.collection(collection));
};
//Create user accounts
//
Users.prototype.createUser = function(user, callback) {
   //Insert new data to the database
   this.getCollection('users', function(error, users_collection){
      if (error) {callback(error);}
      else {
         users_collection.findAndModify({
            "query": { _id: user._id },
            "update": user
            },
            function(error, result) {
               console.log(result);
            }
         )
      }
   })
}
