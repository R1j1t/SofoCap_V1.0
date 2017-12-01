var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var url=require('./database').url;

mongoose.createConnection(url);
var schema=new mongoose.Schema({
    id:Number,
    name:String,
});

var collection=mongoose.model('documentType',schema);
module.exports=collection;