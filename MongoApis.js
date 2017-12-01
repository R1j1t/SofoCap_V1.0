var MongoClient = require('mongodb').MongoClient;
//var mongo=require('mongodb');
var url = "mongodb://localhost:27017/sofocap";

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  console.log("Database created!");
  db.close();
});

MongoClient.connect(url, function(err, db) {
    if (err) throw err;
	//console.log("==========================",mongo.GridFSBucket(db))
    db.createCollection("suppliers", function(err, res) {
      if (err) throw err;
      console.log("Collection created!");
      db.close();
    });
  }); 
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    db.createCollection("buyers", function(err, res) {
      if (err) throw err;
      console.log("Collection created!");
      db.close();
    });
  }); 
