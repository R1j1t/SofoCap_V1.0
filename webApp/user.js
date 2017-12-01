var express = require('express');
var app = express();
var router=express.Router();
var invoke = require('../app/invoke-transaction.js');
var query = require('../app/query.js');
var config=require('../config.json');
var crypto=require('crypto');
var config=require('../config.json');
var helper=require('../app/helper.js');
var jwt = require('jsonwebtoken');
var NodeRSA = require('node-rsa');
var log4js = require('log4js');
var logger = log4js.getLogger('Helper');
logger.setLevel('DEBUG');
var hfc = require('fabric-client');
var rsa = require('node-rsa');
var explorer=require('../explorer/explorer.js');
hfc.setLogger(logger);
var peers;


router.get('/',function(req,res){
    var args=[];
    query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'ReadAcc', req.username, req.orgname).then(function(message) {
        var info = JSON.parse(message);
            explorer.getExplorer(config.blockAmount,req.username,req.orgname,config.currentPeer,function(data){
                console.log('====================EXPLORER DATA====================');
                console.log(data);
                res.render('explorer',{data:data,user:info.type,state:1});   
            });
    });
    
});

router.get('/getSmartcodebyAddress',function(req,res){
    var args=[req.query.address];
    query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'readTrackCode', req.username, req.orgname).then(function(message) {
	    console.log("MESSAGE");
        console.log(message);
        if (message && message.indexOf("Error")>=0){
            console.log("reaching here 1")
                res.json({error:"true",errorMessage:message});
            }else{
                console.log("reaching here 2")
                var jsonres=JSON.parse(message);
                res.json(jsonres).send();
            }
        
    }, (err) => {
        console.log("reaching here 3")
		res.json({error:"true"});
	});
})

router.get('/claimOwnership',function(req,res){
    var args=[];
    query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'ReadAcc', req.username, req.orgname).then(function(message) {
        var info = JSON.parse(message);
        res.render('claimOwnership',{state:6,user:info.type});
    });
});

router.get('/createCarton',function(req,res){
    var args=[];
    query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'ReadAcc', req.username, req.orgname).then(function(message) {
        var info = JSON.parse(message);
        res.render('generate-carton',{state:5,user:info.type});
    });
    
});

router.get('/createContainer',function(req,res){
    var args=[];
    query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'ReadAcc', req.username, req.orgname).then(function(message) {
        var info = JSON.parse(message);
        res.render('generateContainer',{state:6,user:info.type});
    });
    
});

router.post('/claimOwnership',function(req,res){
    var args=req.body.args;
    console.log('args- ',args);
    var fcn='claimOwnership';
    invoke.invokeChaincode(peers, config.channelName, config.chaincodeName, fcn, args, req.username, req.orgname)
	.then(function(message) {
		res.send(message);
	});
})

router.post('/generatePopCode',function(req,res){
    console.log("================REACHING IN====================")
    var args=req.body.args;
    console.log('args- ',args);
    var fcn='generatePopCode'
    invoke.invokeChaincode(peers, config.channelName, config.chaincodeName, fcn, args, req.username, req.orgname)
	.then(function(message) {
		res.json({sucess:"true"});
	});

});

router.get('/unitManagement',function(req,res){
    var args=[];
    query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'ReadAcc', req.username, req.orgname).then(function(message) {
	    var info = JSON.parse(message);
        console.log(info);
        var unitsData=[];
        if (info.unitAddresses&&info.unitAddresses.length!=0){
        for (var i=0;i<info.unitAddresses.length;i++){
            var args=[info.unitAddresses[i]];
            query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'readTrackCode', req.username, req.orgname).then(function(unitMessage) {
                var unitInfo = JSON.parse(unitMessage);
                unitsData.push(unitInfo);
                if (unitsData.length==info.unitAddresses.length){
                    console.log(unitInfo);
                    res.render('manage-units',{units:unitsData,user:info.type,state:4});
                }
            });
        }
        }else {
            res.render('manage-units',{units:unitsData,user:info.type,state:4});
        }
        
    });
});

router.get('/cartonManagement',function(req,res){
    var args=[];
    query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'ReadAcc', req.username, req.orgname).then(function(message) {
	    var info = JSON.parse(message);
        console.log(info);
        var cartonsData=[];
        if (info.containerAddresses&&info.containerAddresses.length!=0){
            var counter=0;
        for (var i=0;i<info.containerAddresses.length;i++){
            var args=[info.containerAddresses[i]];
            
            query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'readTrackCode', req.username, req.orgname).then(function(cartonMessage) {
                var cartonInfo = JSON.parse(cartonMessage);
                if (cartonInfo.popcodeData.type=='carton'){
                    cartonsData.push(cartonInfo);
                }
                counter++;
                if (counter==info.containerAddresses.length){
                    console.log(cartonInfo);
                    res.render('manage-carton',{cartons:cartonsData,user:info.type,info:info,state:5});
                }
            });
        }
        }else {
            res.render('manage-carton',{cartons:cartonsData,user:info.type,info:info,state:5});
        }        
    });
});

router.get('/containerManagement',function(req,res){
    var args=[];
    query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'ReadAcc', req.username, req.orgname).then(function(message) {
	    var info = JSON.parse(message);
        console.log(info);
        var containerData=[];
        if (info.containerAddresses&&info.containerAddresses.length!=0){
            var counter=0;
        for (var i=0;i<info.containerAddresses.length;i++){
            var args=[info.containerAddresses[i]];
            
            query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'readTrackCode', req.username, req.orgname).then(function(ccontainerMessage) {
                var containerInfo = JSON.parse(ccontainerMessage);
                if (containerInfo.popcodeData.type=='container'){
                    containerData.push(containerInfo);
                }
                counter++;
                if (counter==info.containerAddresses.length){
                    console.log(containerInfo);
                    res.render('manage-container',{containers:containerData,info:info,user:info.type,state:6});
                }
            });
        }
        }else {
            res.render('manage-container',{containers:containerData,info:info,user:info.type,state:6});
        }        
    });
});

router.get('/getUnitData',function(req,res){

    var userArgs=[];
    query.queryChaincode(peers, config.channelName, config.chaincodeName, userArgs, 'ReadAcc', req.username, req.orgname).then(function(message) {
	    var info = JSON.parse(message);
        var unitAddress=req.query.address;
        var args=[unitAddress];
        console.log(args);
        query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'readTrackCode', req.username, req.orgname).then(function(unitMessage) {
            var unitInfo = JSON.parse(unitMessage);
            res.render('unitData',{unitInfo:unitInfo,user:info.type,state:4});
        });

    });

});

router.get('/getCartonData',function(req,res){
    var userArgs=[];
    query.queryChaincode(peers, config.channelName, config.chaincodeName, userArgs, 'ReadAcc', req.username, req.orgname).then(function(message) {
	    var info = JSON.parse(message);

        var cartonAddress=req.query.address;
        var args=[cartonAddress];
        console.log(args);
        query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'readTrackCode', req.username, req.orgname).then(function(cartonMessage) {
            var cartonInfo = JSON.parse(cartonMessage);
            var counter=0;
            for (var i=0;i<cartonInfo.popcodeData.smallerPops.length;i++){
                var subUnits=[];
                var unitArgs=[cartonInfo.popcodeData.smallerPops[i]];
                query.queryChaincode(peers, config.channelName, config.chaincodeName, unitArgs, 'readTrackCode', req.username, req.orgname).then(function(unitMessage) {
                    var unitInfo = JSON.parse(unitMessage);
                    subUnits.push(unitInfo);
                    counter++;
                    if (counter==cartonInfo.popcodeData.smallerPops.length){
                        res.render('cartonData',{cartonInfo:cartonInfo,units:subUnits,user:info.type,state:5});
                    }
                });
                
            }
            
        });
    });
});


router.get('/getContainerData',function(req,res){
    var userArgs=[];
    query.queryChaincode(peers, config.channelName, config.chaincodeName, userArgs, 'ReadAcc', req.username, req.orgname).then(function(message) {
	    var info = JSON.parse(message);
    var containerAddress=req.query.address;
    var args=[containerAddress];
    console.log(args);
    query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'readTrackCode', req.username, req.orgname).then(function(containerMessage) {
        var containerInfo = JSON.parse(containerMessage);
        var counter=0;
        for (var i=0;i<containerInfo.popcodeData.smallerPops.length;i++){
            var cartons=[];
            var cartonArgs=[containerInfo.popcodeData.smallerPops[i]];
            query.queryChaincode(peers, config.channelName, config.chaincodeName, cartonArgs, 'readTrackCode', req.username, req.orgname).then(function(cartonMessage) {
                var cartonInfo = JSON.parse(cartonMessage);
                cartons.push(cartonInfo);
                counter++;
                if (counter==containerInfo.popcodeData.smallerPops.length){
                    res.render('containerData',{containerInfo:containerInfo,cartons:cartons,user:info.type,state:6});
                }
            });
            
        }
        
    });
    });
});

module.exports=router;





