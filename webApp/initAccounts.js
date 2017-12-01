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
    checkerInit(info,function(){
        registerSupplier(function(){
            registerBank(function(){
                initSupplierState1();
            })

        })
    });
})



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
    








                                    