var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var url=require('./database').url;

mongoose.createConnection(url);
var schema=new mongoose.Schema({
    cin:String,
    name:String,
});

var collection=mongoose.model('buyersList',schema);
 module.exports=collection;