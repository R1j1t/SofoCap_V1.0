var express = require('express');
var app = express();
var router=express.Router();
var helper=require('../app/helper.js');
var invoke = require('../app/invoke-transaction.js');
var query = require('../app/query.js');
var config=require('../config.json');
var jwt = require('jsonwebtoken');
var hfc = require('fabric-client');
var peers
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/sofocap";
app.use(express.static(__dirname + '/public'));

router.post('/manage-supplier',function(req,res){
	console.log("======in manage-supplier ===========")
	console.log(req.body);
	let name = req.body.email;
	//let name = req.body.employee;
    let type= "";
    var placeAddress=req.body.address;
    var status=req.body.status;
    var email=req.body.email
    var org='org1';
	var password=req.body.password;
    var args=[name,email,type,"",req.body.employee];
    helper.getRegisteredUsers(name, org, true,password).then(function(response) {///////////////
    
    //args.push(placeAddress);
   // args.push(status);
   		console.log("RESPONSE",response);
	
		console.log('args- ',args);
		var fcn='initSupplier'
		//var peer1;
		console.log(peers);
		console.log("==========REACHING FOR QUERY--1============",name,org,peers,fcn,args);
		invoke.invokeChaincode(peers, config.channelName, config.chaincodeName, fcn, args, name, org)
		.then(function(message) {
			console.log("messgae of the invoke initSuppliers",message);
			if(message.indexOf("Error")>0){
				index=message.indexOf("Error:");
				err = message.slice(index,(message.length)-1)
				console.log("error in registering ",err)
				req.session.sessionFlash = {
					type: 'failed',
					message: err
					}
					return res.redirect(301, 'back');
			}
			//console.log("hhhhhhheeehehheheehehehhehehhehehhehehheheheheh",message)
			 
		args=[]
			fcn="ReadAcc"
			console.log("==========REACHING FOR QUERY--1============",name,org,peers,fcn,args);
			query.queryChaincode(peers, config.channelName, config.chaincodeName, args, fcn, name, org).then(function(message) {
					console.log("======================================REACHING FOR QUERY--2==================---"+message);
					try {
						var info = JSON.parse(message);
						MongoClient.connect(url, function(err, db) {
							if (err) throw err;
							console.log("heloooooooooooooooo",info);
							var myobj = {
								SupplierId:info.supplierId ,
								 supplierName:req.body.employee,
								 employeeName:info.employeeName,
								 emailId:info.emailId,
								phone:req.body.phone,
								status:'Inactive',
								state:1
							};
							db.collection("suppliers").insertOne(myobj, function(err, resp) {
							  if (err) throw err;
							  console.log("1 document inserted");
							  req.session.username=name;
							  req.session.orgname=org;
							  console.log(req.session);
							  //req.info=info;
							  //console.log(info);
							  db.close();
							  return res.render('supplier/comp-detail',{ accData: {supplierName:name,emailId:email,phoneNumber:req.body.phone}, accInfo:{state:req.body.state,phoneNumber:req.body.phone,} });
							  
							});
						  }); 

					}catch(e){
						req.session.sessionFlash = {
						type: 'failed',
						message: 'Invalid Username And Password.'
						}
						return res.redirect(301, 'back');
					}
					
					
					
					//return renderLogIn(req,res);
					
				});
			//res.json({work:"no"})

		})
			// var token = jwt.sign({
   //              exp: Math.floor(Date.now() / 1000) + parseInt(hfc.getConfigSetting('jwt_expiretime')),
   //              username: name,
   //              orgName: org
   //          }, app.get('secret'));


           // response.token=token;
			//res.json(response);	
			
		});
		

	// response.send(req.body);
})
// res.render('supplier/comp-detail',{ accData: {supplierName:name,emailId:email,phoneNumber:req.body.phone}, accInfo:{state:req.body.state,phoneNumber:req.body.phone,} });



module.exports=router;