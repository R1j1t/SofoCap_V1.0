var invoke = require('../app/invoke-transaction.js');
var query = require('../app/query.js');
var config=require('../config.json');
var helper=require('../app/helper.js');

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/sofocap";
var org="org1";
var password="Password123"
var peers

// registerBuyer().then(function(info){
//     checkerInit().then()
// })
registerBuyer(function(info){
    //registerPO(info,function(info){
         checkerInit(info,function(){
             registerSupplier(function(){
                    registerBank(function(){
                            initSupplierState1();
            })

        })
    });
})
//})



//======================checker registration===============================

function checkerInit(info,func){


    name="verifier@prolitusMotors.com"
    password="Password123"
   

    helper.getRegisteredUsers(name, org, true,password).then(function(response) {
        fcn="initChecker"
        args=[info.buyerId,"checkerProlitus"]
        console.log("second invoke args",args);
        invoke.invokeChaincode(peers, config.channelName, config.chaincodeName, fcn, args, name, org)
        .then(function(message) {
            console.log("in registering verifier  invoker message  ---->",message)
            if(message.indexOf("Error")>0){
                index=message.indexOf("Error:");
                err = message.slice(index,(message.length)-1)
                console.log("error in registering verifier ",err)
                // req.session.sessionFlash = {
                //     type: 'failed',
                //     message: err
                //     }
                }
                else{
                    QueryArgs=[]
                    fcn="ReadAcc"
                    console.log("==========REACHING FOR QUERY--1============",name,org,peers,fcn,args);
                    query.queryChaincode(peers, config.channelName, config.chaincodeName, QueryArgs, fcn, name, org).then(function(CheckerMessage) {
                            console.log("======================================REACHING FOR QUERY--2==================---"+message);
                            try {
                                var checkerInfo = JSON.parse(CheckerMessage);
                                console.log(checkerInfo);
                                // MongoClient.connect(url, function(err, db) {
                                //     if (err) throw err;
                                //     console.log("heloooooooooooooooo",info);
                                    var myobjChecker = {
                                        checkerId:checkerInfo.checkerId ,
                                         checkerName:checkerInfo.employeeName,
                                         buyerName:checkerInfo.buyerName,
                                         buyerId:checkerInfo.buyerId,
                                         emailId:checkerInfo.emailId
                                        
                                    };

                                    MongoClient.connect(url, function(err, db) {
                                        if (err) throw err;
                                        console.log("heloooooooooooooooo",info);
                                        var myobj = {
                                            "buyerId":info.buyerId ,
                                             "buyerName":info.buyerName,
                                             "employeeName":info.employeeName,
                                             "emailId":info.emailId,
                                             "notifications":{"count":0,"notifications":[]}
                                            // phone:req.body.phone,
                                            // status:'Inactive',
                                            // state:1
                                        };
                                    db.collection("buyers").findOne({emailId:myobj.emailId},function(err,data){
                                        if(err){
                                            console.log("error in finding the buyer ")
                                        }else{
                                            if(data){
                                                console.log("the buyer  exist in our  database")
                                                db.collection("checkers").insertOne(myobjChecker, function(err, resp) {
                                                    if (err) throw err;
                                                    console.log("1 document in checkers inserted");
                                                    return func();
                                                   
                                                    
                                                  });
                                            }
                                            
                                        }
                                    })


                                });
                                    
                                }catch(e){
                                    console.log("error in catch of checker",e)
                                }





                               // name

   // });

                            }); // query checker
                            } // else checker
                            }); //invoke init  checker
                            }); // get registered checker



    }



//================generate POs for the buyer=======================

// function registerPO(info,func){
//     var file={"name":"Untitled Document 1","data":{"type":"Buffer","data":[119,104,101,110,101,118,101,114,32,105,32,97,109,32,103,101,110,101,114,97,116,105,110,103,32,116,104,101,32,110,101,116,119,111,114,107,32,116,104,101,32,118,101,114,121,32,102,105,114,115,116,32,116,104,105,110,103,32,116,104,97,116,32,104,97,112,112,101,110,10,105,115,32,105,32,97,109,32,114,117,110,110,105,110,103,32,97,32,99,111,109,109,97,110,100,32,119,105,116,104,32,116,104,101,32,99,114,121,112,116,111,103,101,110,32,116,111,111,108,32,105,46,101,46,10,99,114,121,112,116,111,103,101,110,32,103,101,110,101,114,97,116,101,32,45,45,99,111,110,102,105,103,32,61,46,47,99,114,121,112,116,111,45,99,111,110,102,105,103,46,121,97,109,108,32,116,104,105,115,32,99,111,109,109,97,110,100,32,105,115,32,97,115,107,105,110,103,10,116,104,101,32,99,114,121,112,116,111,103,101,110,32,116,111,111,108,32,116,111,32,99,114,101,97,116,101,32,116,104,101,32,99,101,114,116,105,102,105,99,97,116,101,115,32,97,110,100,32,116,104,101,32,104,97,115,104,32,102,111,114,32,101,97,99,104,10,97,110,100,32,101,118,101,114,121,32,111,114,103,97,110,105,115,97,116,105,111,110,32,97,110,100,32,100,101,112,101,110,100,105,110,103,32,117,112,111,110,32,116,104,101,32,39,99,111,117,110,116,39,32,118,97,114,105,97,98,108,101,32,116,104,101,110,10,119,104,97,116,32,105,116,32,105,115,32,104,97,112,112,101,110,105,110,103,32,116,104,97,116,32,97,102,116,101,114,32,114,101,97,100,105,110,103,32,116,104,101,32,121,97,109,108,32,102,105,108,101,32,119,104,97,116,32,105,116,32,105,115,32,100,111,105,110,103,10,105,116,32,109,97,107,101,115,32,116,119,111,32,102,111,108,100,101,114,32,119,105,116,104,32,110,97,109,101,32,39,111,114,100,101,114,101,114,79,114,103,97,110,105,122,97,116,105,111,110,115,39,32,97,110,100,32,39,112,101,101,114,79,114,103,97,110,105,122,97,116,105,111,110,39,10,100,111,110,116,32,107,110,111,119,32,121,101,116,32,119,104,121,32,116,104,101,115,101,32,110,97,109,101,115,32,111,102,32,116,104,101,32,102,111,108,100,101,114,115,32,109,97,121,32,98,101,32,98,101,99,97,117,115,101,32,105,116,32,105,115,32,115,101,116,32,10,98,121,32,100,101,102,97,117,108,116,32,105,110,32,116,104,101,32,99,114,121,112,116,111,103,101,110,32,116,111,111,108,32,116,104,97,116,32,116,104,97,116,32,116,104,101,114,101,39,108,108,32,98,101,32,97,32,111,114,100,101,114,101,114,79,114,103,97,110,105,122,97,105,111,110,10,105,102,32,119,101,32,104,97,118,101,32,100,101,102,105,110,100,101,100,32,97,32,111,114,100,101,114,101,114,79,114,103,115,32,102,105,101,108,100,32,105,110,32,116,104,101,32,121,97,109,108,32,102,105,108,101,32,97,110,100,32,105,102,32,110,111,116,32,102,111,117,110,100,32,105,116,39,108,108,32,110,111,116,32,99,114,101,97,116,101,32,116,104,101,32,111,114,100,101,114,101,114,32,102,111,108,100,101,114,32,97,110,100,32,104,101,110,99,101,32,110,111,32,99,101,114,116,105,102,105,99,97,116,101,115,10,121,111,117,32,107,110,111,119,32,105,32,116,114,105,101,100,32,119,105,116,104,32,116,104,101,32,110,97,109,101,32,111,114,100,101,114,101,114,79,114,103,32,97,110,100,32,105,116,32,100,105,100,110,116,32,109,97,107,101,32,97,32,102,111,108,100,101,114,32,10,119,105,116,104,32,116,104,101,32,110,97,109,101,32,111,114,100,101,114,101,114,79,114,103,97,110,105,122,97,116,105,111,110,32,98,117,116,32,112,101,101,114,79,114,103,97,110,105,122,97,116,105,111,110,32,105,115,32,97,108,108,32,103,111,111,100,10,32,88,45,82,65,89,73,78,71,32,116,104,101,32,111,114,100,101,114,101,79,114,103,97,110,105,122,97,116,105,111,110,32,102,111,108,100,101,114,32,105,116,32,99,111,110,116,97,105,110,115,32,101,120,97,109,112,108,101,46,99,111,109,32,121,101,115,32,10,116,104,101,32,115,97,109,101,32,110,97,109,101,32,116,104,97,116,32,119,101,32,109,101,110,116,105,111,110,100,101,100,32,105,110,32,116,104,101,32,100,111,109,97,105,110,32,110,97,109,101,32,117,110,100,101,114,32,116,104,101,32,116,97,103,32,111,102,32,111,114,100,101,114,101,114,79,114,103,115,32,10]},"encoding":"7bit","mimetype":"application/octet-stream"}
    
// }







//========================buyer registered with name=buyer@prolitusMotors.com and Password="Password123"========================
    function registerBuyer(func){
 var name="buyer@prolitusMotors.com"
 var org="org1"
 var password="Password123"
 var peers

 helper.getRegisteredUsers(name, org, true,password).then(function(response) {


 var fcn="initBuyer"


 var args=["","prolitus","prolitusBuyer",name]
 console.log("invoke 1st args",args);
 invoke.invokeChaincode(peers, config.channelName, config.chaincodeName, fcn, args, name, org)
 .then(function(message) {
     console.log("in registering buyer  invoker message  ---->",message)
    if(message.indexOf("Error")>0){
        index=message.indexOf("Error:");
        err = message.slice(index,(message.length)-1)
         console.log("error in registering  buyer ",err)
       // req.session.sessionFlash = {
       //     type: 'failed',
        //     message: err
        //     }
         }
         else{
            QueryArgs=[]
			fcn="ReadAcc"
			console.log("==========REACHING FOR QUERY--1============",name,org,peers,fcn,args);
			query.queryChaincode(peers, config.channelName, config.chaincodeName, QueryArgs, fcn, name, org).then(function(message) {
				console.log("======================================REACHING FOR QUERY--2==================---"+message);
					try {
						var info = JSON.parse(message);
						MongoClient.connect(url, function(err, db) {
							if (err) throw err;
							console.log("heloooooooooooooooo",info);
							var myobj = {
								"buyerId":info.buyerId ,
								 "buyerName":info.buyerName,
								 "employeeName":info.employeeName,
                                 "emailId":info.emailId,
                                 "notifications":{"count":0,"notifications":[]}
								// phone:req.body.phone,
								// status:'Inactive',
								// state:1
                            };
                            console.log("my object is myobj",myobj);
                            db.collection("buyers").findOne({emailId:myobj.emailId},function(err,data){
                                if(err){
                                    console.log("error in finding the buyer ")
                                }else{
                                    if(data){
                                        console.log("the buyer already exist in our  database")
                                    }
                                    else{
                                        db.collection("buyers").insertOne(myobj, function(err, resp) {
                                            if (err) throw err;
                                            console.log("1 document inserted in buyers ");
                                           console.log("in buyer registration --->")
                                           console.log(myobj);
                                           return func(myobj);
                                            
                                          });
                                    }
                                }
                            })
                            
							
						  }); //db

                    }  //try buyer
                    catch(e){
                    console.log("====> bahar wakle me error",e);
                    }
                          


                      });  // query chaincode buyer

                     } // else buyer
                       }) //init buyer

                          
            }) //get registered buyer
                        

        }//end function

    //============================bank  preregister =========================================================== 

function registerBank(func){
    
     name="bank@abcBank.com"
   password="Password123"
     args=["abcBank","abcEmployee"] 
    
            
    helper.getRegisteredUsers(name, org, true,password).then(function(response) {


 fcn="initBank"


//var args=["","prolitus","prolitusBuyer","buyer2@prolitusMotors.com"]
console.log("invoke 1st args",args);
invoke.invokeChaincode(peers, config.channelName, config.chaincodeName, fcn, args, name, org)
.then(function(message) {
    console.log("in registering buyer bank message  ---->",message)
    if(message.indexOf("Error")>0){
        index=message.indexOf("Error:");
        err = message.slice(index,(message.length)-1)
        console.log("error in registering bank",err)
        // req.session.sessionFlash = {
        //     type: 'failed',
        //     message: err
        //     }
        }
        else{
            QueryArgs=[]
			fcn="ReadAcc"
			console.log("==========REACHING FOR QUERY--1============",name,org,peers,fcn,args);
			query.queryChaincode(peers, config.channelName, config.chaincodeName, QueryArgs, fcn, name, org).then(function(message) {
					console.log("======================================REACHING FOR QUERY--2==================---"+message);
					try {
						var info = JSON.parse(message);
						MongoClient.connect(url, function(err, db) {
							if (err) throw err;
							console.log("heloooooooooooooooo",info);
							var myobj = {
								"bankId":info.bankId ,
                                "bankName":info.bankName,
								 "employeeName":info.employeeName,
                                 "emailId":info.emailId,
                                 "notifications":{"count":0,"notifications":[]}
								
                            };
                            console.log("my object is myobj",myobj);
                            db.collection("banks").findOne({emailId:myobj.emailId},function(err,data){
                                if(err){
                                    console.log("error in finding the buyer ")
                                }else{
                                    if(data){
                                        console.log("the buyer already exist in our  database")
                                    }
                                    else{
                                        db.collection("banks").insertOne(myobj, function(err, resp) {
                                            if (err) throw err;
                                            console.log("1 document inserted",resp);
                                            return func()
                                           
                                            
                                          });
                                    }
                                }
                            })
                        }); //db
                        
                                            }  //try buyer
                                            catch(e){
                                            console.log("====>  bank me error",e);
                                            }
                                          //         }
                        
                        
                                              });  // query chaincode buyer
                        
                                               }   // else buyer
                                               }) //init buyer
                        
                                                  
                                    }) //get registered buyer

                                }//register bank function end
      

//===============================register complete suppliers==============================
   
    function registerSupplier(func){

     name="supplier@smr.com"
    // password="Password123"
     args=["smrSupplier",name,"","","smrEmployee"] 

    
            
    helper.getRegisteredUsers(name, org, true,password).then(function(response) {


 fcn="initSupplier"


//var args=["","prolitus","prolitusBuyer","buyer2@prolitusMotors.com"]
console.log("invoke 1st args",args);
invoke.invokeChaincode(peers, config.channelName, config.chaincodeName, fcn, args, name, org)
.then(function(message) {
    if(message.indexOf("Error")>0){
        index=message.indexOf("Error:");
        err = message.slice(index,(message.length)-1)
        console.log("error in registering supplier state 4  --->",err)
        // req.session.sessionFlash = {
        //     type: 'failed',
        //     message: err
        //     }
        }
        else{
            QueryArgs=[]
			fcn="ReadAcc"
			console.log("==========REACHING FOR QUERY--1============",name,org,peers,fcn,QueryArgs);
			query.queryChaincode(peers, config.channelName, config.chaincodeName, QueryArgs, fcn, name, org).then(function(message) {
					console.log("======================================REACHING FOR QUERY--2==================---"+message);
					try {
                        var info = JSON.parse(message);
                        console.log("mesage from query",info)
						MongoClient.connect(url, function(err, db) {
							if (err) throw err;
							console.log("heloooooooooooooooo",info);
							var myobj =  {
                                
                                    "SupplierId":info.supplierId,
                                    "supplierName":args[1],
                                    "employeeName":"smrEmployee",
                                    "emailId":info.emailId,
                                    "phone":"9955441122",
                                    "notifications":{"count":0,"notifications":[]},
                                    "status":"active",
                                    "state":4,
                                    "CIN":"11321313",
                                    "businessType":"Private Limited Company",
                                    "industryType":"Agriculture",
                                    "landline":"22114455",
                                    "pan":"IVHPS8406J",
                                    "street":"121hhh",
                                    "city":"hjkhhk",
                                    "cityState":"ANDAMAN & NICOBAR ISLANDS",
                                    "pin":"110094",
                                    "c_street":"121hhh",
                                    "c_city":"hjkhhk",
                                    "c_pin":"110094",
                                    "owners":[
                                        {
                                            "din":"",
                                            "aadhar":"9988665533445",
                                            "name":"supplier3",
                                            "mobile":"9955441122",
                                            "email":"kapilatrey95@gmail.com",
                                            "dpan":"IVHPS8406J",
                                            "cibil":"",
                                            "landline":"3556447485",
                                            "employeeDocs":[
                                                {
                                                    "id":"69ec6ce974413d99873877b151d9606f",
                                                    "docName":"pan",
                                                    "fileName":"text"
                                                },
                                                {
                                                    "id":"465522e1d36e6e3efb4ca96df8a2e5ba",
                                                    "docName":"address",
                                                    "fileName":"text"
                                                },
                                                {
                                                    "id":"cb1265f8552fb019a082afbabf9e1ae9",
                                                    "docName":"photo",
                                                    "fileName":"text"
                                                }
                                            ]
                                        }
                                    ],
                                    "companyDocs":[
                                        {
                                            "id":"8db19d14f9f050d9cf2658a6c6aefe60",
                                            "docName":"pl",
                                            "fileName":"text"
                                        },
                                        {
                                            "id":"8db19d14f9f050d9cf2658a6c6aefe60",
                                            "docName":"pl",
                                            "fileName":"text"
                                        },
                                        {
                                            "id":"8db19d14f9f050d9cf2658a6c6aefe60",
                                            "docName":"pl",
                                            "fileName":"text"
                                        },
                                        {
                                            "id":"8db19d14f9f050d9cf2658a6c6aefe60",
                                            "docName":"pl",
                                            "fileName":"text"
                                        },
                                        {
                                            "id":"8db19d14f9f050d9cf2658a6c6aefe60",
                                            "docName":"pl",
                                            "fileName":"text"
                                        }
                                    ]
                                
          }

                           // console.log("my object is myobj",myobj);
                            db.collection("suppliers").findOne({emailId:myobj.emailId},function(err,data){
                                if(err){
                                    console.log("error in finding the buyer ")
                                }else{
                                    if(data){
                                        console.log("the supplier already exist in our  database")
                                    }
                                    else{
                                        db.collection("suppliers").insertOne(myobj, function(err, resp) {
                                            if (err) throw err;
                                            console.log("1 document inserted",resp);
                                            return func();
                                           
                                            
                                          });
                                    }
                                }
                            })
                        }); //db
                        
                                            }  //try buyer
                                            catch(e){
                                            console.log("====>  bank me error",e);
                                            }
                                          //         }
                        
                        
                                              });  // query chaincode buyer
                        
                                             } // else buyer
                                               }) //init buyer
                        
                                                  
                                    }) //get registered buyer
      

                                }//end fucntion


//=================================supplier registration state 1====================

function initSupplierState1(){

console.log("======in manage-supplier ===========")

var name = "supplier@galaxy.com"
 type= "";
//email="supplier@galaxy.com"


var args=["galaxySupplier",name,"","","galaxyEmployee"] 
helper.getRegisteredUsers(name, org, true,password).then(function(response) {///////////////

//args.push(placeAddress);
// args.push(status);
       console.log("RESPONSE",response);

    console.log('args- ',args);
    var fcn='initSupplier'
    console.log(peers);
    console.log("==========REACHING FOR QUERY--1============",name,org,peers,fcn,args);
    invoke.invokeChaincode(peers, config.channelName, config.chaincodeName, fcn, args, name, org)
    .then(function(message) {
        console.log("in registering state1  invoker message  ---->",message)
        if(message.indexOf("Error")>0){
            index=message.indexOf("Error:");
            err = message.slice(index,(message.length)-1)
            console.log("error in registering  in state 1",err)
           
        }
        //console.log("hhhhhhheeehehheheehehehhehehhehehhehehheheheheh",message)
         else{
   // args=[]
        fcn="ReadAcc"
        console.log("==========REACHING FOR QUERY--1============",name,org,peers,fcn,args);
        query.queryChaincode(peers, config.channelName, config.chaincodeName, [], fcn, name, org).then(function(message) {
                console.log("======================================REACHING FOR QUERY--2==================---"+message);
                try {
                    var info = JSON.parse(message);
                   // console.log("supplier json data from the query ",info)
                    MongoClient.connect(url, function(err, db) {
                        if (err) throw err;
                        console.log("heloooooooooooooooo",info);
                        var myobj = 
                            {"SupplierId" : info.supplierId,
                            "supplierName" : args[1],
                            "employeeName" : args[5],
                            "emailId" : name,
                            "phone" : "9955441122",
                            "status" : "Inactive",
                            "state" : 1,
                            "notifications":{"count":0,"notifications":[]}
                        
                        };
                        db.collection("suppliers").findOne({emailId:myobj.emailId},function(err,data){
                            if(err){
                                console.log("error in finding the buyer ")
                            }else{
                                if(data){
                                    console.log("the supplier already exist in our  database")
                                }
                                else{
                        db.collection("suppliers").insertOne(myobj, function(err, resp) {
                          if (err) throw err;
                          console.log("all document inserted");
                        //   req.session.username=name;
                        //   req.session.orgname=org;
                        //   console.log(req.session);
                          //req.info=info;
                          //console.log(info);
                          db.close();
                         // return res.render('supplier/comp-detail',{ accData: {supplierName:name,emailId:email,phoneNumber:req.body.phone}, accInfo:{state:req.body.state,phoneNumber:req.body.phone,} });
                        });
                    }
                }
                        });
                      }); 

                }catch(e){
                    console.log("error in state 1 supllier ",e);
                }
                
                
                
                //return renderLogIn(req,res);
                
            });
        }
        //res.json({work:"no"})

    })
        	
        
    });
}
    








                                    