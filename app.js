/**
 * Copyright 2017 IBM All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an 'AS IS' BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
'use strict';
var log4js = require('log4js');
//var mongoose=require('mongoose');
var logger = log4js.getLogger('SampleWebApp');
var express = require('express');
var session = require('express-session');

var flash = require('express-flash');
var fileManagement=require('./webApp/fileManagement');
var sessionStore = new session.MemoryStore;
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var util = require('util');
var app = express();
var expressJWT = require('express-jwt');
var jwt = require('jsonwebtoken');
var bearerToken = require('express-bearer-token');
var cors = require('cors');
app.use(cookieParser());
require('./config.js');
var hfc = require('fabric-client');
var User = require('fabric-client/lib/User.js');
var helper = require('./app/helper.js');
var channels = require('./app/create-channel.js');
var join = require('./app/join-channel.js');
var install = require('./app/install-chaincode.js');
var instantiate = require('./app/instantiate-chaincode.js');
var invoke = require('./app/invoke-transaction.js');
var query = require('./app/query.js');
var api=require('./api/api.js');
var oem=require('./webApp/oem.js');
var user=require('./webApp/user.js');
var supplier=require('./webApp/supplier.js');
var buyer=require('./webApp/buyer.js');
var checker=require('./webApp/checker.js')


var admin=require('./webApp/admin.js');

app.use(function(req,res,next){
	if (req.originalUrl.indexOf('manage-supplier')>=0){
		console.log('================URL===================')
		console.log(req.originalUrl);
	}
	
	next();
})
app.use('/admin',admin)




var peers;
var config=require('./config.json');
var fs=require('fs');
var accountInitialization=require('./webApp/accountInitialize.js')
var explorer=require('./explorer/explorer.js');
var host = process.env.HOST || hfc.getConfigSetting('host');
var port = process.env.PORT || hfc.getConfigSetting('port');

const fileUpload = require('express-fileupload');
app.use(fileUpload());
///////////////////////////////////////////////////////////////////////////////
//////////////////////////////// SET CONFIGURATONS ////////////////////////////
///////////////////////////////////////////////////////////////////////////////
app.options('*', cors());
app.use(cors());
//support parsing of application/json type post data
app.use(bodyParser.json());
//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({
	extended: false
}));
// set secret variable
app.set('secret', config.authorizationSecret);
app.set('view engine', 'ejs');
//app.use(express.static("public"));
var QRCode = require('qrcode');



app.use(express.static("public"));
app.set('trust proxy', 1) // trust first proxy
app.get('/initAccounts',function(req,res){
	var initAccounts=require('./webApp/initAccounts');
	res.json({message:"all members you want to register registered successfully"});
})
app.use(session({
  secret: config.authorizationSecret,
  store: sessionStore,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}))
app.use(flash());

app.use(function(req, res, next){
    // if there's a flash message in the session request, make it available in the response, then delete it
    res.locals.sessionFlash = req.session.sessionFlash;
    delete req.session.sessionFlash;
    next();
});


app.use(function(req,res,next){
	console.log('================SESSION===================')
	console.log(req.session);
	console.log(req.originalUrl);
	next();
})

app.use('/register',accountInitialization);

//register user
app.post('/users', function(req, res) {
	logger.debug('Req .body : ' + req.body);
	var username = req.body.username;
	var orgName = req.body.orgName;
	var secret=req.body.password;
	logger.debug('End point : /users');
	logger.debug('User name : ' + username);
	logger.debug('Org name  : ' + orgName);
	if (!username) {
		res.json(getErrorMessage('\'username\''));
		return;
	}
	if (!orgName) {
		res.json(getErrorMessage('\'orgName\''));
		return;
	}
	var token = jwt.sign({
		exp: Math.floor(Date.now() / 1000) + parseInt(hfc.getConfigSetting('jwt_expiretime')),
		username: username,
		orgName: orgName
	}, app.get('secret'));
	helper.getRegisteredUsers(username, orgName, true,secret).then(function(response) {
		if (response && typeof response !== 'string') {
			response.token = token;
			res.cookie('access_token',token);
			res.json(response);
		} else {
			res.json({
				success: false,
				message: response
			});
		}
	});
});


app.get('/login',function(req,res){
	
	res.render("login",{ sessionFlash: res.locals.sessionFlash });
});

app.get('/',function(req,res){
	req.session.viewer=undefined
	res.render('index');
});

app.get('/logout',function(req,res){
	req.session.destroy(function(err){
		if (!err){
			res.redirect('/');
		}
	});
	
});

// app.post('/initAccount',function(req,res){
//     let name = req.body.username;
//     let type= req.body.type;
//     var placeAddress=req.body.address1+' '+req.body.address2+' '+req.body.address3+' '+req.body.address4;
//     var status='active';
//     var org='org1';
// 	var password=req.body.password;
//     var args=[name,type];
//     helper.getRegisteredUsers(name, org, true,password).then(function(response) {
    
//     args.push(placeAddress);
//     args.push(status);
		
		
// 		var fcn='initSupplier'
// 		console.log(peers);
// 		args=[name,"saan099@gmail.com","",""];
// 		console.log('args- ',args);
// 		invoke.invokeChaincode(peers, config.channelName, config.chaincodeName, fcn, args, name, org)
// 		.then(function(message) {
// 			console.log(message);
// 			res.json(message)
// 		});

// 		// invoke.invokeChaincode(peers, config.channelName, config.chaincodeName, fcn, args, name, org)
// 		// .then(function(message) {
// 		// 		return res.redirect('/login');
			
// 		// });
    
//     });
// });

app.post('/api/initAccount',function(req,res){
    let name = req.body.username;
    let type= req.body.type;
    var placeAddress=req.body.address;
    var status=req.body.status;
    var org='org1';
	var password=req.body.password;
    var args=[name,type];
    helper.getRegisteredUsers(name, org, true,password).then(function(response) {///////////////
    
    args.push(placeAddress);
    args.push(status);
	
		console.log('args- ',args);
		var fcn='initUser'
		console.log(peers);
		invoke.invokeChaincode(peers, config.channelName, config.chaincodeName, fcn, args, name, org)
		.then(function(message) {
			var token = jwt.sign({
                exp: Math.floor(Date.now() / 1000) + parseInt(hfc.getConfigSetting('jwt_expiretime')),
                username: name,
                orgName: org
            }, app.get('secret'));
            response.token=token;
			res.json(response);	
			
		});
    
    });
});




app.post('/login',function(req,res){

	var member;
    var secret=req.body.password;
    var userOrg='org1';
    var username=req.body.username;
	var client = helper.getClientForOrg(userOrg);
	var enrollmentSecret = null;

	if(username==="admin@admin.com" && secret==="Password123"){
	return	res.redirect('/admin');
	}

	return hfc.newDefaultKeyValueStore({
		path: getKeyStoreForOrg(helper.getOrgName(userOrg))
	}).then((store) => {
		client.setStateStore(store);
		// clearing the user context before switching
		client._userContext = null;
		return client.getUserContext(username, true).then((user) => {
			if (user && user.isEnrolled()) {
				logger.info('Successfully loaded member from persistence');
				return user;
				
			} else {
				let caClient = helper.caClients[userOrg];
				
				
					enrollmentSecret = secret;
					logger.debug(username + ' registered successfully');
					return caClient.enroll({
						enrollmentID: username,
						enrollmentSecret: secret
					}).then((message) => {
					if (message && typeof message === 'string' && message.includes(
							'Error:')) {
						logger.error(username + ' enrollment failed');
						return message;
					}
					logger.debug(username + ' enrolled successfully');

					member = new User(username);
					member._enrollmentSecret = enrollmentSecret;
					return member.setEnrollment(message.key, message.certificate, helper.getMspID(userOrg));
				}).then(() => {
					client.setUserContext(member);
					return member;
				}, (err) => {
					logger.error(util.format('%s enroll failed: %s', username, err.stack ? err.stack : err));
					return '' + err;
				});;
			}
		});
	}).then((user) => {
			if (typeof user !== 'string'){
				if (secret!=user._enrollmentSecret){
					req.session.sessionFlash = {
						type: 'failed',
						message: 'Invalid User Name And Password'
					}
					return res.redirect(301, 'back');
					//return res.redirect('back');
				}
				var response = {
				success: true,
				secret: user._enrollmentSecret,
				message: username + ' enrolled Successfully',
			};
			console.log(user);
				// var token = jwt.sign({
				// 	exp: Math.floor(Date.now() / 1000) + parseInt(hfc.getConfigSetting('jwt_expiretime')),
				// 	username: username,
				// 	orgName: userOrg
				// }, app.get('secret'));
				req.session.username=username;///////////////////////
				req.session.orgname=userOrg;
				
				var args=[];
				query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'ReadAcc', username, userOrg).then(function(message) {
					console.log("HERE---"+message);
					try {
						var info = JSON.parse(message);
					}catch(e){
						req.session.sessionFlash = {
						type: 'failed',
						message: 'Invalid Username And Password.'
						}
						return res.redirect(301, 'back');
					}
					
					
					req.info=info;
					
					return renderLogIn(req,res);
					
				});
				
			}else {
				req.session.sessionFlash = {
						type: 'failed',
						message: 'Invalid Username And Password.'
						}
						return res.redirect(301, 'back');
			}
            
			
		
	}, (err) => {
		logger.error(util.format('Failed to get registered user: %s, error: %s', username, err.stack ? err.stack : err));
		return '' + err;
	});
});







function renderLogIn(req,res){
	//console.log("peter ",req.info.kapil);
	console.log("it should contain buyer",req.info)
	if (req.info.supplierId){
		console.log("req me session",req.session)
		return res.redirect('/supplier');
	} else if(req.info.buyerId&&req.info.checkerId) {
		return res.redirect('/checker');
	} else if(req.info.buyerId) {
		return res.redirect('/buyer');
	} else if(req.info.type=='distributor') {
		return res.redirect('/distributor');
	} else if(req.info.type=='subdistributor') {
		return res.redirect('/subdistributor');
	}else if(req.info.type=='wholeseller') {
		return res.redirect('/wholeseller');
	}
}
app.use(function(req,res,next){
	console.log("===================Web App Verification==============================");
	console.log(req.originalUrl);
	if (req.originalUrl.indexOf('/getTxById') >= 0||req.originalUrl.indexOf('/getBlockByNumber') >= 0||req.originalUrl.indexOf('/supplier') >= 0||req.originalUrl.indexOf('/buyer') >= 0||req.originalUrl.indexOf('/checker') >= 0||req.originalUrl.indexOf('/subdistributor') >= 0||req.originalUrl.indexOf('/retailer') >= 0||req.originalUrl.indexOf('/wholeseller') >= 0) {
	console.log('!!!Session alotted username and orgname')
	if (!req.session.username||!req.session.orgname){
		return res.send("Your Session Has expired due to changes in code on server. Please Login again!");
	}
	req.username=req.session.username;
	req.orgname = req.session.orgname;
	return next();
}else {
	console.log("================CAME OUT",req.originalUrl.indexOf('/oem'),req.originalUrl.indexOf('/warehouse'))
		return next();
	}
});

app.get('/download-file',function(req,res,next){    
    if (req.query.type){
        name=req.query.name;
        console.log(name);
        fileManagement.existFile(name,function(f){
			
			console.log("=============upar===========>",f)
			
            if (!f||f==null){
            res.send('file does not exist');
            }else {
                fileManagement.readFile(req,res,name);
            }
            
        });
        
    }else {
        console.log(req.query.name);
        fileManagement.existFile(req.query.name,function(f){
			
			console.log("=============neeche===========>",f)
            if (!f||f==null){
            res.send('file does not exist');
            }else {
                fileManagement.readFile(req,res,req.query.name);
            }
            
        });
    }
    
});


app.get('/getBlockByNumber',function(req,res){
	console.log('========ARGS=====');
	console.log(req.username,req.orgname,config.currentPeer);
    explorer.getBlockByNumber(config.currentPeer,req.query.number,req.username,req.orgname,function(listData){
        console.log("Listing===",listData);
        res.json(listData);
    });
});
app.get('/getTxById',function(req,res){
	console.log('========ARGS=====');
	console.log(req.username,req.orgname,config.currentPeer);
    explorer.getTransactionById(req.query.txid,config.currentPeer,req.username,req.orgname,function(listData){
        console.log(listData);
        res.json(listData);
    });
});
app.use('/checker',checker);
app.use('/distributor',user);
app.use('/subdistributor',user);
app.use('/warehouse',user);
app.use('/retailer',user);
app.use('/wholeseller',user);
app.use('/supplier',supplier);
app.use('/buyer',buyer);

app.post('/apilogin',function(req,res){
	console.log('===============API LOGIn======================')
	var member;
    var secret=req.body.password;
    var userOrg='org1';
    var username=req.body.username;
	var client = helper.getClientForOrg(userOrg);
	var enrollmentSecret = null;
	return hfc.newDefaultKeyValueStore({
		path: getKeyStoreForOrg(helper.getOrgName(userOrg))
	}).then((store) => {
		client.setStateStore(store);
		// clearing the user context before switching
		client._userContext = null;
		return client.getUserContext(username, true).then((user) => {
			if (user && user.isEnrolled()) {
				logger.info('Successfully loaded member from persistence');
				return user;
				
			} else {
				let caClient = helper.caClients[userOrg];
				
				
					enrollmentSecret = secret;
					logger.debug(username + ' registered successfully');
					return caClient.enroll({
						enrollmentID: username,
						enrollmentSecret: secret
					}).then((message) => {
					if (message && typeof message === 'string' && message.includes(
							'Error:')) {
						logger.error(username + ' enrollment failed');
						return message;
					}
					logger.debug(username + ' enrolled successfully');

					member = new User(username);
					member._enrollmentSecret = enrollmentSecret;
					return member.setEnrollment(message.key, message.certificate, helper.getMspID(userOrg));
				}).then(() => {
					client.setUserContext(member);
					return member;
				}, (err) => {
					logger.error(util.format('%s enroll failed: %s', username, err.stack ? err.stack : err));
					return '' + err;
				});;
			}
		});
	}).then((user) => {
		console.log("====================="+user);
			if (typeof user !== 'string'){
				if (secret!=user._enrollmentSecret){
					return res.json({success:false});
				}
				var response = {
				success: true,
				secret: user._enrollmentSecret,
				message: username + ' enrolled Successfully',
			};
            var token = jwt.sign({
                exp: Math.floor(Date.now() / 1000) + parseInt(hfc.getConfigSetting('jwt_expiretime')),
                username: username,
                orgName: userOrg
            }, app.get('secret'));
            response.token=token;
			res.json(response);
			}else {
				res.json({success:false});
			}
			
		
	}, (err) => {
		logger.error(util.format('Failed to get registered user: %s, error: %s', username, err.stack ? err.stack : err));
		return '' + err;
	});
});
function getKeyStoreForOrg(org) {
	return hfc.getConfigSetting('keyValueStore') + '_' + org;
}

app.use(expressJWT({
	secret: config.authorizationSecret
}).unless({
	path: ['/users']
}));

app.use(bearerToken());


app.use(function(req, res, next) {
	if (req.originalUrl.indexOf('/users') >= 0) {
		return next();
	}
	console.log("----------------API Verification-----------------------")
	console.log(req.originalUrl);
	var token = req.token;
	jwt.verify(token, app.get('secret'), function(err, decoded) {
		if (err) {
			res.send({
				success: false,
				message: 'Failed to authenticate token. Make sure to include the ' +
					'token returned from /users call in the authorization header ' +
					' as a Bearer token'
			});
			return;
		} else {
			// add the decoded user name and org name to the request object
			// for the downstream code to use
			req.username = decoded.username;
			req.orgname = decoded.orgName;
			logger.debug(util.format('Decoded from JWT token: username - %s, orgname - %s', decoded.username, decoded.orgName));
			return next();
		}
	});
});

///////////////////////////////////////////////////////////////////////////////
//////////////////////////////// START SERVER /////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
var server = http.createServer(app).listen(port, function() {});
logger.info('****************** SERVER STARTED ************************');
logger.info('**************  http://' + host + ':' + port +
	'  ******************');
server.timeout = 240000;

function getErrorMessage(field) {
	var response = {
		success: false,
		message: field + ' field is missing or Invalid in the request'
	};
	return response;
}

app.use('/api',api);


///////////////////////////////////////////////////////////////////////////////
///////////////////////// REST ENDPOINTS START HERE ///////////////////////////
///////////////////////////////////////////////////////////////////////////////


// Create Channel
app.post('/channels', function(req, res) {
	logger.info('<<<<<<<<<<<<<<<<< C R E A T E  C H A N N E L >>>>>>>>>>>>>>>>>');
	logger.debug('End point : /channels');
	var channelName = req.body.channelName;
	var channelConfigPath = req.body.channelConfigPath;
	logger.debug('Channel name : ' + channelName);
	logger.debug('channelConfigPath : ' + channelConfigPath); //../artifacts/channel/mychannel.tx
	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!channelConfigPath) {
		res.json(getErrorMessage('\'channelConfigPath\''));
		return;
	}

	channels.createChannel(channelName, channelConfigPath, req.username, req.orgname)
	.then(function(message) {
		res.send(message);
	});
});
// Join Channel
app.post('/channels/:channelName/peers', function(req, res) {
	logger.info('<<<<<<<<<<<<<<<<< J O I N  C H A N N E L >>>>>>>>>>>>>>>>>');
	var channelName = req.params.channelName;
	var peers = req.body.peers;
	logger.debug('channelName : ' + channelName);
	logger.debug('peers : ' + peers);
	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!peers || peers.length == 0) {
		res.json(getErrorMessage('\'peers\''));
		return;
	}

	join.joinChannel(channelName, peers, req.username, req.orgname)
	.then(function(message) {
		res.send(message);
	});
});
// Install chaincode on target peers
app.post('/chaincodes', function(req, res) {
	logger.debug('==================== INSTALL CHAINCODE ==================');
	var peers = req.body.peers;
	var chaincodeName = req.body.chaincodeName;
	var chaincodePath = req.body.chaincodePath;
	var chaincodeVersion = req.body.chaincodeVersion;
	logger.debug('peers : ' + peers); // target peers list
	logger.debug('chaincodeName : ' + chaincodeName);
	logger.debug('chaincodePath  : ' + chaincodePath);
	logger.debug('chaincodeVersion  : ' + chaincodeVersion);
	if (!peers || peers.length == 0) {
		res.json(getErrorMessage('\'peers\''));
		return;
	}
	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	}
	if (!chaincodePath) {
		res.json(getErrorMessage('\'chaincodePath\''));
		return;
	}
	if (!chaincodeVersion) {
		res.json(getErrorMessage('\'chaincodeVersion\''));
		return;
	}

	install.installChaincode(peers, chaincodeName, chaincodePath, chaincodeVersion, req.username, req.orgname)
	.then(function(message) {
		res.send(message);
	});
});
// Instantiate chaincode on target peers
app.post('/channels/:channelName/chaincodes', function(req, res) {
	logger.debug('==================== INSTANTIATE CHAINCODE ==================');
	var chaincodeName = req.body.chaincodeName;
	var chaincodeVersion = req.body.chaincodeVersion;
	var channelName = req.params.channelName;
	var fcn = req.body.fcn;
	var args = req.body.args;
	logger.debug('channelName  : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);
	logger.debug('chaincodeVersion  : ' + chaincodeVersion);
	logger.debug('fcn  : ' + fcn);
	logger.debug('args  : ' + args);
	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	}
	if (!chaincodeVersion) {
		res.json(getErrorMessage('\'chaincodeVersion\''));
		return;
	}
	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!args) {
		res.json(getErrorMessage('\'args\''));
		return;
	}
	instantiate.instantiateChaincode(channelName, chaincodeName, chaincodeVersion, fcn, args, req.username, req.orgname)
	.then(function(message) {
		res.send(message);
	});
});
// Invoke transaction on chaincode on target peers
app.post('/channels/:channelName/chaincodes/:chaincodeName', function(req, res) {
	logger.debug('==================== INVOKE ON CHAINCODE ==================');
	var peers = req.body.peers;
	console.log("PEERS HERE-----------",peers)
	var chaincodeName = req.params.chaincodeName;
	var channelName = req.params.channelName;
	var fcn = req.body.fcn;
	var args = req.body.args;
	logger.debug('channelName  : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);
	logger.debug('fcn  : ' + fcn);
	logger.debug('args  : ' + args);
	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	}
	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!fcn) {
		res.json(getErrorMessage('\'fcn\''));
		return;
	}
	if (!args) {
		res.json(getErrorMessage('\'args\''));
		return;
	}

	invoke.invokeChaincode(peers, channelName, chaincodeName, fcn, args, req.username, req.orgname)
	.then(function(message) {
		res.send(message);
	});
});
// Query on chaincode on target peers
app.get('/channels/:channelName/chaincodes/:chaincodeName', function(req, res) {
	logger.debug('==================== QUERY BY CHAINCODE ==================');
	var channelName = req.params.channelName;
	var chaincodeName = req.params.chaincodeName;
	let args = req.query.args;
	let fcn = req.query.fcn;
	let peer = req.query.peer;

	logger.debug('channelName : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);
	logger.debug('fcn : ' + fcn);
	logger.debug('args : ' + args);

	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	}
	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!fcn) {
		res.json(getErrorMessage('\'fcn\''));
		return;
	}
	if (!args) {
		res.json(getErrorMessage('\'args\''));
		return;
	}
	args = args.replace(/'/g, '"');
	args = JSON.parse(args);
	logger.debug(args);

	query.queryChaincode(peer, channelName, chaincodeName, args, fcn, req.username, req.orgname)
	.then(function(message) {
		res.send(message);
	});
});
//  Query Get Block by BlockNumber
app.get('/channels/:channelName/blocks/:blockId', function(req, res) {
	logger.debug('==================== GET BLOCK BY NUMBER ==================');
	let blockId = req.params.blockId;
	let peer = req.query.peer;
	logger.debug('channelName : ' + req.params.channelName);
	logger.debug('BlockID : ' + blockId);
	logger.debug('Peer : ' + peer);
	if (!blockId) {
		res.json(getErrorMessage('\'blockId\''));
		return;
	}

	query.getBlockByNumber(peer, blockId, req.username, req.orgname)
		.then(function(message) {
			res.send(message);
		});
});
// Query Get Transaction by Transaction ID
app.get('/channels/:channelName/transactions/:trxnId', function(req, res) {
	logger.debug(
		'================ GET TRANSACTION BY TRANSACTION_ID ======================'
	);
	logger.debug('channelName : ' + req.params.channelName);
	let trxnId = req.params.trxnId;
	let peer = req.query.peer;
	if (!trxnId) {
		res.json(getErrorMessage('\'trxnId\''));
		return;
	}

	query.getTransactionByID(peer, trxnId, req.username, req.orgname)
		.then(function(message) {
			res.send(message);
		});
});
// Query Get Block by Hash
app.get('/channels/:channelName/blocks', function(req, res) {
	logger.debug('================ GET BLOCK BY HASH ======================');
	logger.debug('channelName : ' + req.params.channelName);
	let hash = req.query.hash;
	let peer = req.query.peer;
	if (!hash) {
		res.json(getErrorMessage('\'hash\''));
		return;
	}
	
	query.getBlockByHash(peer, hash, req.username, req.orgname).then(
		function(message) {
			res.send(message);
		});
});
//Query for Channel Information
app.get('/channels/:channelName', function(req, res) {
	logger.debug(
		'================ GET CHANNEL INFORMATION ======================');
	logger.debug('channelName : ' + req.params.channelName);
	let peer = req.query.peer;

	query.getChainInfo(peer, req.username, req.orgname).then(
		function(message) {
			res.send(message);
		});
});
// Query to fetch all Installed/instantiated chaincodes
app.get('/chaincodes', function(req, res) {
	var peer = req.query.peer;
	var installType = req.query.type;
	//TODO: add Constnats
	if (installType === 'installed') {
		logger.debug(
			'================ GET INSTALLED CHAINCODES ======================');
	} else {
		logger.debug(
			'================ GET INSTANTIATED CHAINCODES ======================');
	}

	query.getInstalledChaincodes(peer, installType, req.username, req.orgname)
	.then(function(message) {
		res.send(message);
	});
});
// Query to fetch channels
app.get('/channels', function(req, res) {
	logger.debug('================ GET CHANNELS ======================');
	logger.debug('peer: ' + req.query.peer);
	var peer = req.query.peer;
	if (!peer) {
		res.json(getErrorMessage('\'peer\''));
		return;
	}

	query.getChannels(peer, req.username, req.orgname)
	.then(function(
		message) {
		res.send(message);
	});
});

app.post('/readAccount',function(req,res){
	var args=[];
	var fcn="getAccount"
	jwt.verify(req.token, app.get('secret'), function(err, decoded) {
		if (err) {
			res.send({
				success: false,
				message: 'Failed to authenticate token. Make sure to include the ' +
					'token returned from /users call in the authorization header ' +
					' as a Bearer token'
			});
			return;
		} else {
			// add the decoded user name and org name to the request object
			// for the downstream code to use
			req.username = decoded.username;
			req.orgname = decoded.orgName;
			logger.debug(util.format('Decoded from JWT token: username - %s, orgname - %s', decoded.username, decoded.orgName));
			//return next();
		}
	});

	query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'ReadAcc', req.username, req.orgname).then(function(message) {
					console.log("HERE---"+message);
					try {
						var info = JSON.parse(message);
					}catch(e){
						req.session.sessionFlash = {
						type: 'failed',
						message: 'Invalid Username And Password.'
						}
					}})
});
