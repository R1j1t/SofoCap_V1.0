var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var url=require('./database').url;

mongoose.createConnection(url);
var schema=new mongoose.Schema({
    invoiceHash:String
});

var collection=mongoose.model('docHashes',schema);
 module.exports=collection;