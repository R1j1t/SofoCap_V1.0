var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var assert= require('assert');
var mongo = require('mongodb');

var app=express();
var url = "mongodb://localhost:27017/sofocap";

//mongoose.createConnection(url);

//var conn = mongoose.connection;
var fs = require('fs');

var Grid = require('gridfs-stream');

var gfs;
var MongoClient = require('mongodb').MongoClient;
//var mongo=require('mongodb');
var url = "mongodb://localhost:27017/sofocap";

// MongoClient.connect(url, function(err, db) {
//   if (err) throw err;
//   console.log("Database created!");
//    gfs = Grid(db, mongo);
//    console.log("hello",gfs);
//   db.close();
// });

// var db = new mongo.Db('sofocap', new mongo.Server("0.0.0.0", 27017));

// Grid.mongo = mongoose.mongo;
// var gfs;
// conn.once('open', function () {
//     console.log('GRIDFS WORKING ');
//     gfs = Grid(conn.db);
// });
// setTimeout(function() {
    
// }, 10000);

var conn = mongoose.createConnection(url);

Grid.mongo = mongoose.mongo;
var gfs;
conn.once('open', function () {
    console.log('GRIDFS WORKING ');
    gfs = Grid(conn.db);
});



module.exports={



            writeFile:function(file,hash){
                var f=file;
                console.log("writeFile")

                var writestream = gfs.createWriteStream({
                    _id:hash,
                    filename: hash,
                    mode:'w',
                    content_type:f.mimetype
                });
                writestream.on('close',function(file){
                    console.log(file+' written')
                })
                writestream.write(f.data);
                writestream.end();
            },

            readFile:function(req,res,file){
                
                var fname=''+file;
                gfs= Grid(conn.db);
                console.log(__dirname+'/../,tmp/+fname')
            
            var readstream = gfs.createReadStream({
                filename: ''+file,
                mode:'r'
            });
            
            readstream.pipe(res);
        },
        
        removeFile:function(id){
            var _id=''+id;
            gfs.remove({_id:_id}, function (err) {
                
                console.log('success deletion');
            });
        },

        existFile:function(id,callBack){
            var ID=""+id;
            mongo.connect(url,function(err,db){
                db.collection('fs.files').findOne({filename:ID},function(err,f){
                    if (err!= null) {
                        console.log(err);
                    }
    
                    console.log("=====",f);
                    callBack(f);
                });
            });
           
                
        }




};




