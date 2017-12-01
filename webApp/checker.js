var express = require('express');
var app = express();
var router = express.Router();
var helper = require('../app/helper.js');
var invoke = require('../app/invoke-transaction.js');
var query = require('../app/query.js');
var config = require('../config.json');
var jwt = require('jsonwebtoken');
var fileManagement = require('./fileManagement');
var crypto = require('crypto')
var hfc = require('fabric-client');
var date = require('date-and-time');
//var fileManagement=require('./fileManagement');//
var crypto = require('crypto');
var hashObj = require('object-hash');
var peers;
var MongoClient = require('mongodb').MongoClient;
//var buyer=require('./buyer.js');
var url = "mongodb://localhost:27017/sofocap";
var configData = {
    "currency": "INR",
    "tax": 0,
    "timeout": 500,
    "invoiceStatusTimeout": 800
}
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/views'));
app.use(express.static(__dirname + '/assets'));



router.get('/',function(req,res){
 
        returnCheckerByMail(req.session.username,function(notifyError,notifyResult) {
            if (notifyError) {
                console.log("error in notify", error)
                return res.redirect('back');
            } if(notifyResult) {
                console.log(notifyResult)
                notifydoc = notifyResult.notifications;
                console.log("===================ifdoc / wala ==============", notifydoc);
                setSession(notifyResult.buyerId,req,function(err){
                    if(!err){
                        console.log(req.session);
                    return res.render('buyer', {
                        notifydoc: notifydoc,
                        configData: configData
                    })
                }else{
                    res.redirect('back');
                }
                })
            
            }else
            return res.redirect('back');
        })


})

function setSession(id,req,func){
    returnBuyer(id,function(err,result){
        console.log(result)
        if(err){
            console.log("returning")
            return func(err,null)
        }
        else if(result){
            console.log("nowreturning")
            req.session.username=result.emailId
            req.session.viewer='verifier'
            return func(null)
        }
        else{
            console.log("finally returning")
            return func("hello")
        }
    })

}


function returnBuyer(id, func) {
    MongoClient.connect(url, function(err, db) {
        if (err) {
            throw err;
            return res.redirect('back');

        }
        var query = {
            buyerId: id
        }
        console.log(query);
        db.collection("buyers").findOne(query, function(err, result) {
            if (err) {
                console.log("fineOne error ===========", err);
                return func(err, null)
            }
            if (result) {
                return func(null, result)
            }
        })
    })
}



function returnChecker(id, func) {
    MongoClient.connect(url, function(err, db) {
        if (err) {
            throw err;
            return res.redirect('back');

        }
        var query = {
            checkerId: id
        }
        console.log(query);
        db.collection("checkers").findOne(query, function(err, result) {
            if (err) {
                console.log("fineOne error ===========", err);
                return func(err, null)
            }
            if (result) {
                return func(null, result)
            }
        })
    })
}


function returnSupplier(id, func) {
    MongoClient.connect(url, function(err, db) {
        if (err) {
            throw err;
            return res.redirect('back');

        }
        var query = {
            SupplierId: id
        }
        console.log(query);
        db.collection("suppliers").findOne(query, function(err, result) {
            if (err) {
                console.log("fineOne error ===========", err);
                return func(err, null)
            }
            if (result) {
                return func(null, result)
            }
        })
    })
}





function returnBuyerByMail(id, func) {
    MongoClient.connect(url, function(err, db) {
        if (err) {
            throw err;
            return res.redirect('back');

        }
        var query = {
            emailId: id
        }
        console.log(query);
        db.collection("buyers").findOne(query, function(err, result) {
            if (err) {
                console.log("fineOne error ===========", err);
                return func(err, null)
            }
            if (result) {
                return func(null, result)
            }
        })
    })
}



function returnCheckerByMail(id, func) {
    MongoClient.connect(url, function(err, db) {
        if (err) {
            throw err;
            return res.redirect('back');

        }
        var query = {
            emailId: id
        }
        console.log(query);
        db.collection("checkers").findOne(query, function(err, result) {
            if (err) {
                console.log("fineOne error ===========", err);
                return func(err, null)
            }
            if (result) {
                return func(null, result)
            }
        })
    })
}


function returnSupplierByMail(id, func) {
    MongoClient.connect(url, function(err, db) {
        if (err) {
            throw err;
            return res.redirect('back');

        }
        var query = {
            emailId: id
        }
        console.log(query);
        db.collection("suppliers").findOne(query, function(err, result) {
            if (err) {
                console.log("fineOne error ===========", err);
                return func(err, null)
            }
            if (result) {
                return func(null, result)
            }
        })
    })
}





module.exports=router;

