var express = require('express');
var app = express();
var router=express.Router();
var helper=require('../app/helper.js');
var invoke = require('../app/invoke-transaction.js');
var query = require('../app/query.js');
var config=require('../config.json');
var jwt = require('jsonwebtoken');
var fileManagement=require('./fileManagement');
var hfc = require('fabric-client');
var crypto=require('crypto');
var peers;
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/sofocap";
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/views'));

router.get ('/',function(req,res){

    return res.render('admin');

});

router.get ('/manage-supplier',function(req,res){
    MongoClient.connect(url, function(err, db) {
        if (err) 
      {
        console.log("error in mongo creating",err);
        throw err;
        return res.redirect(301, 'back');
        
        }
    
       
        var query = { }
        console.log("query to be searched----------------------------",query);
        db.collection("suppliers").find({}).toArray(function(err, result) {
            if (err) throw err;
           // console.log(result);
            db.close();
            res.render('admin/admin-supplier',{data:result});
            
          });  
    })
    
})





router.get('/changeSupplierState',function(req,res){

    console.log("//////////////////////////in supplierchangestate /////////////////////////////")
    var supplierId=req.query.supplierId;
    query={emailId:supplierId};
    console.log("query to be searced",query);
   
    MongoClient.connect(url, function(err, db) {
        if (err) 
      {
        console.log("error in mongo creating",err);
        throw err;
        return res.redirect(301, 'back');
        
        }
        query={emailId:supplierId};
        console.log("query",query)
        db.collection("suppliers").findOne(query,function(err,result)
    {
        if(err)
        {   
            console.log("error in finding user",err);
            return res.redirect(301,'back');
        } 
        console.log("resultttttttttttttt",result);
        //res.send(result);
        if(result.status==="active"){
            query={emailId:supplierId};
            newValues= { $set: { status: "Inactive" } }
            db.collection("suppliers").updateOne(query, newValues, function(err, dbres) {
                if (err){
                    console.log(err);
                return   res.redirect(301,'back');
                }
                console.log("====================================1 document updated");
              return  res.redirect('/admin/manage-supplier');

        })
    }else {
        query={emailId:supplierId};
        console.log("=======>query in the else",query);
        newValues= { $set: { status: "active" } }
        db.collection("suppliers").updateOne(query, newValues, function(err, dbres) {
            if (err){
                console.log(err);
            return   res.redirect(301,'back');
            }
            console.log("====================================1 document updated");
            db.close();
            return  res.redirect('/admin/manage-supplier');
          });
    
    } 

    

       





    })
});
});



// router.get('/getSupplier',function(req,res){
//     var supplierId=req.query.supplierId;
//     var tabID=req.query.tab;
//     var buyerName=[];

//     MongoClient.connect(url, function(err, db) {
//         if (err) 
//       {
//         console.log("error in mongo creating",err);
//         throw err;
//         return res.redirect(301, 'back');
        
//         }

//         query={emailId:supplierId};
//         console.log("=====>query",query)
//         db.collection("suppliers").findOne(query,function(err,Record){

            

//         })
    




//     });


















// })


module.exports=router;