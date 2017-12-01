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
var co=require('co');
hfc.setLogger(logger);
var peers;

router.get('/readAcc',function(req,res){
    var args=[];
    query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'ReadAcc', req.username, req.orgname).then(function(message) {
	    res.json(message).send();
    });
});


router.get('/makePrivateKey',function(req,res){
    var key = new rsa({b:256});
    key.generateKeyPair(512);
    var pubKey = key.exportKey("public") ;
    var privKey = key.exportKey('pkcs1') ;
    var result={};
    result.privKey=privKey;
    result.pubKey=pubKey;
    res.json(result);
});

router.get('/makeMultiplePrivateKeys',function(req,res){
    var results=[];
    for (var i=0;i<req.query.number;i++){
        var key = new rsa({b:256});
        key.generateKeyPair(512);
        var pubKey = key.exportKey("public") ;
        var privKey = key.exportKey('pkcs1') ;
        var result={};
        result.privateKeyString=privKey;
        results.push(result);
    }
    res.json(results);
});

router.post('/initAccount',function(req,res){
    let name = req.body.username;
    let type= req.body.type;
    var placeAddress=req.body.address;
    var status=req.body.status;
    var org='org1';
	var password=req.body.password;
    var args=[req.username,type];
    
    args.push(placeAddress);
    args.push(status);
    console.log('args- ',args);
    var fcn='initUser'
    console.log(peers);
     invoke.invokeChaincode(peers, config.channelName, config.chaincodeName, fcn, args, req.username, req.orgname)
	.then(function(message) {
		res.send(message);
	});
    
});

router.post('/getAddress',function(req,res){
    var key = new rsa({b:256});
    key.importKey(req.body.privateKey, 'pkcs1');
    var pubKey = key.exportKey("public") ;
    var result={};
    var hash=crypto.createHash('sha256').update(pubKey).digest('hex');
    result.pubKey=pubKey;
    result.address=hash;
    res.json(result);
});

router.post('/getSmartcodeByPriv',function(req,res){
    var privKeystring=req.body.privkey;
    var key = new rsa({b:256});
    console.log('=========================PRIV KEY================================')
    console.log(privKeystring);
    key.importKey(privKeystring, 'pkcs1');
    var pubKey = key.exportKey("public") ;
    var hash=crypto.createHash('sha256').update(pubKey).digest('hex');
    var args=[hash];
    query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'readTrackCode', req.username, req.orgname).then(function(message) {
	    var jsonres=JSON.parse(message);
        res.json(jsonres).send();
    });


});

router.post('/register/warehouse',function(req,res){
    var warehouseName=req.body.name;
    var orgName="org1";
    var password=req.body.password;
    var placeAddress=req.body.address;
    var status=req.body.status;
    helper.getRegisteredUsers(warehouseName, orgName, true,password).then(function(response) {
		if (response && typeof response !== 'string') {
            var args=[];
            args.push(warehouseName);
            args.push('warehouse');
            args.push(placeAddress);
            args.push(status);
            var fcn='initUser'
            console.log(peers);
            invoke.invokeChaincode(peers, config.channelName, config.chaincodeName, fcn, args, warehouseName, orgName)
            .then(function(message) {
                res.send(message);
            });
			
		} else {
			res.json({
				success: false,
				message: response
			});
		}
	});
});

router.post('/register/distributor',function(req,res){
    var distributor=req.body.name;
    var orgName="org1";
    var placeAddress=req.body.address;
    var status=req.body.status;
    helper.getRegisteredUsers(distributor, orgName, true).then(function(response) {
		if (response && typeof response !== 'string') {
            var args=[];
            args.push(distributor);
            args.push('distributor');
            args.push(placeAddress);
            args.push(status);
            var fcn='initUser'
            console.log(peers);
            invoke.invokeChaincode(peers, config.channelName, config.chaincodeName, fcn, args, distributor, orgName)
            .then(function(message) {
                res.send(message);
            });
			
		} else {
			res.json({
				success: false,
				message: response
			});
		}
	});
});

router.get('/viewList',function(req,res){
    var type=req.query.type;
    var args=[type];
    query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'readAccList', req.username, req.orgname).then(function(message) {
	    res.json(message).send();
    });
});



router.get('/readSmartCode',function(req,res){
    var args=[req.query.address];
    query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'readTrackCode', req.username, req.orgname).then(function(message) {
	    res.json(message).send();
    });
});

router.get('/readCarton',function(req,res){
    var args=[req.query.address];
    query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'readTrackCode', req.username, req.orgname).then(function(message) {
        var cartonInfo=JSON.parse(message);
        if (cartonInfo.popcodeData.type!='carton'){
            return res.json({message:'not a carton'});
        }
        var counter=0;
        for (var i=0;i<cartonInfo.popcodeData.smallerPops.length;i++){
            var subUnits=[];
            var unitArgs=[cartonInfo.popcodeData.smallerPops[i]];
            query.queryChaincode(peers, config.channelName, config.chaincodeName, unitArgs, 'readTrackCode', req.username, req.orgname).then(function(unitMessage) {
                var unitInfo = JSON.parse(unitMessage);
                subUnits.push(unitInfo);
                counter++;
                if (counter==cartonInfo.popcodeData.smallerPops.length){
                    cartonInfo.units=subUnits
                    return res.json(cartonInfo);
                }
            });
            
        }

    });
});

router.get('/readContainer',function(req,res){
    var args=[req.query.address];
    query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'readTrackCode', req.username, req.orgname).then(function(message) {
       
        var containerInfo=JSON.parse(message);
        if (containerInfo.popcodeData.type!='container'){
            return res.json({message:'not a carton'});
        }
        var counter=0;
        for (var i=0;i<containerInfo.popcodeData.smallerPops.length;i++){
            var cartons=[];
            var unitArgs=[containerInfo.popcodeData.smallerPops[i]];
            query.queryChaincode(peers, config.channelName, config.chaincodeName, unitArgs, 'readTrackCode', req.username, req.orgname).then(function(cartonMessage) {
                var cartonInfo = JSON.parse(cartonMessage);
                cartons.push(cartonInfo);
                counter++;
                if (counter==containerInfo.popcodeData.smallerPops.length){
                    containerInfo.cartons=cartons
                    return res.json(containerInfo);
                }
            });
            
        }

    });
});

router.post('/generateProductMaster',function(req,res){
    
    
            var args=[];
            var ProductName=req.body.ProductName;
            var OemProductId=req.body.OemProductId;
            var Description=req.body.Description;
            args.push(ProductName);
            args.push(OemProductId);
            args.push(Description);
            var fcn='productMaster'
            console.log(peers);
            invoke.invokeChaincode(peers, config.channelName, config.chaincodeName, fcn, args, req.username, req.orgname)
            .then(function(message) {
                res.send(message);
            });
			
		

});

router.post('/generateSkuMaster',function(req,res){
    
    //helper.getRegisteredUsers(req.username, req.orgname, true).then(function(response) {
        
            var args=[];
            var OemSkuId=req.body.OemSkuId;
            var Size=req.body.Size;
            var SkuName=req.body.SkuName;
            var productId=req.body.productId;
            args.push(OemSkuId);
            args.push(Size);
            args.push(SkuName);
            args.push(productId);
            var fcn='createSkuMaster'
            console.log(peers);
            invoke.invokeChaincode(peers, config.channelName, config.chaincodeName, fcn, args, req.username, req.orgname)
            .then(function(message) {
                res.send(message);
            });
			


});

router.post('/generateBatch',function(req,res){
    var args=[];
    query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'ReadAcc', req.username, req.orgname).then(function(message) {
            var accData=JSON.parse(message);
            
            var BatchNo;
            if (accData.batches){
                BatchNo=accData.batches.length+1;
                if (accData.batches.length+1<1000&&accData.batches.length+1>100){
                    BatchNo="0"+BatchNo;
                }else if (accData.batches.length+1<100&&accData.batches.length+1>10){
                    BatchNo="00"+BatchNo;
                }else if (accData.batches.length+1<10&&accData.batches.length+1>1){
                    BatchNo="000"+BatchNo;
                }
                BatchNo="batch-"+BatchNo;
            }else {
                BatchNo='batch-0001';
            }
            
            var args=[];
            //
            var skuId=req.body.skuId;
            var ManufactureDate=req.body.ManufactureDate;
            var ExpiryDate=req.body.ExpiryDate;
            var requests=req.body.requests;
            var total=""+requests.length;


            args.push(BatchNo);
            args.push(skuId);
            args.push(ManufactureDate);
            args.push(ExpiryDate);
            args.push(total);
            var type='unit';
            var responses=[];
            for (var i=0;i<requests.length;i++){
                var Key = new NodeRSA({ b: 512 });
                Key.importKey(requests[i].privateKeyString, 'pkcs1');
                var publicKeyString=Key.exportKey("public") ;
                var address=crypto.createHash('sha256').update(publicKeyString).digest('hex');
                var response={};
                response.address=address;
                response.privateKeyString=requests[i].privateKeyString;
                responses.push(response);
                args.push(address);
                args.push(publicKeyString);
                args.push(type);
                var Msg=address+publicKeyString+BatchNo+ExpiryDate+ManufactureDate+skuId;
                var Hash=crypto.createHash('sha256').update(Msg).digest('hex');
                var sign=Key.sign(Hash, 'base64');
                args.push(sign);
            }
            var fcn='makeBatches'
            console.log("args-",args);
            invoke.invokeChaincode(peers, config.channelName, config.chaincodeName, fcn, args, req.username, req.orgname)
            .then(function(message) {
                res.json(responses);
            });
			
		
			
	});
});

router.post('/generatePopCode',function(req,res){
    let name = req.username;
    let privateKeyString= req.body.privString;
    var args=[];
    var Key = new NodeRSA({ b: 512 });
    Key.importKey(privateKeyString, 'pkcs1');
    var publicKeyString=Key.exportKey("public") ;
    var address=crypto.createHash('sha256').update(publicKeyString).digest('hex');
    var numOfSubSmartCodes;
    if (!req.body.subSmartCodes||req.body.subSmartCodes.length==0){
        numOfSubSmartCodes='0';
    }else {
        numOfSubSmartCodes=''+req.body.subSmartCodes.length
    }
    

    var type=req.body.type;
    var date=req.body.date;
    var assetId=req.body.assetId;
    args.push(address);
    args.push(publicKeyString);
    args.push(numOfSubSmartCodes);
    var subS=req.body.subSmartCodes;
    var signaturesConcat='';
    for (var i=0;i<subS.length;i++){
        var subAddress=subS[i].Address
        var hashCounter=subS[i].hashCounter
        var subPrivKey=subS[i].subPrivKey
        var SubKey = new NodeRSA({ b: 512 });        
        SubKey.importKey(subPrivKey, 'pkcs1');
        var subMsg=address+publicKeyString+subAddress+hashCounter
        var subHash=crypto.createHash('sha256').update(subMsg).digest('hex');
        let subSig = SubKey.sign(subHash, 'base64');
        args.push(subAddress);
        args.push(subSig);
        signaturesConcat+=subSig;
    }

    args.push(type);
    
    var msg
    if (numOfSubSmartCodes=='0'){
        args.push(date);
        args.push(assetId);
        args.push(req.body.name);
        args.push(req.body.batchNo);
        msg=address+publicKeyString+date+assetId+req.body.name+req.body.batchNo+signaturesConcat;
    }else {
    
        msg=address+publicKeyString+signaturesConcat;
    }
    
    var hash=crypto.createHash('sha256').update(msg).digest('hex');
    console.log("hash-",hash)
    let result = Key.sign(hash, 'base64')
    args.push(result);
    console.log('args- ',args);
    var fcn='generatePopCode'
    invoke.invokeChaincode(peers, config.channelName, config.chaincodeName, fcn, args, req.username, req.orgname)
	.then(function(message) {
		res.send(message);
	});

});


router.get('/getUnitsList',function(req,res){
    var units=getUnitsList(req,res,function(units){
        res.json(units);
    });
    
});

function * getUnitsData(req,res){
    var args=[];
    var message=yield query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'ReadAcc', req.username, req.orgname);
	    var account = JSON.parse(message);
        var units=[];
        if (account.unitAddresses){
            for (var i=0;i<account.unitAddresses.length;i++){
                var smartCodeArgs=[account.unitAddresses[i]];
                    var unitMessage=yield query.queryChaincode(peers, config.channelName, config.chaincodeName, smartCodeArgs, 'readTrackCode', req.username, req.orgname);
                        var unit=JSON.parse(unitMessage);
                        units.push(unit);
                        if (units.length==account.unitAddresses.length){
                            return units
                        }
                    
            }
        }else {
            return [];
        }
    
}

function getUnitsList(req,res,callBack){
    co(getUnitsData,req,res).then((list)=>{
        console.log(list);
        callBack(list);
    });
}

router.post('/makeCartonClass',function(req,res){
    
    var Class=req.body.class;
    var size=req.body.size;
    var capacity=req.body.capacity;
    var ingredient=req.body.ingredient;
    var args=[Class,size,capacity,ingredient];
    var fcn='makeCartonType';

    invoke.invokeChaincode(peers, config.channelName, config.chaincodeName, fcn, args, req.username, req.orgname)
	.then(function(message) {
		res.send(message);
	});
});

router.post('/makeContainerClass',function(req,res){
    
    var Class=req.body.class;
    var size=req.body.size;
    var capacity=req.body.capacity;
    var ingredient=req.body.ingredient;
    var args=[Class,size,capacity,ingredient];
    var fcn='makeContainerType';

    invoke.invokeChaincode(peers, config.channelName, config.chaincodeName, fcn, args, req.username, req.orgname)
	.then(function(message) {
		res.send(message);
	});
});

router.post('/makeOpenCarton',function(req,res){
    var fcn='makeOpenCarton';
    var args=[req.body.cartonId,req.body.cartonClass];
    invoke.invokeChaincode(peers, config.channelName, config.chaincodeName, fcn, args, req.username, req.orgname)
	.then(function(message) {
		res.send(message);
	});


});

router.post('/makeOpenContainer',function(req,res){
    var fcn='makeOpenContainer';
    var args=[req.body.containerId,req.body.containerClass];
    invoke.invokeChaincode(peers, config.channelName, config.chaincodeName, fcn, args, req.username, req.orgname)
	.then(function(message) {
		res.send(message);
	});


});

router.get('/getCartonList',function(req,res){
    var args=[];
    query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'ReadAcc', req.username, req.orgname).then(function(message) {
	    var account = JSON.parse(message);
        var cartons=[];
        if (account.containerAddresses){
            var counter=0;
            for (var i=0;i<account.containerAddresses.length;i++){
                var smartCodeArgs=[account.containerAddresses[i]];
                    query.queryChaincode(peers, config.channelName, config.chaincodeName, smartCodeArgs, 'readTrackCode', req.username, req.orgname).then(function(cartonMessage) {
                        var carton=JSON.parse(cartonMessage);
                        counter++;
                        if (carton.popcodeData.type=='carton'){
                            cartons.push(carton);
                        }
                        
                        if (counter==account.containerAddresses.length){
                            return res.json(cartons);
                        }
                    });
            }
        }else {
            return res.json([]);
        }
    });
});

router.get('/getContainerList',function(req,res){
    var args=[];
    query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'ReadAcc', req.username, req.orgname).then(function(message) {
	    var account = JSON.parse(message);
        var containers=[];
        if (account.containerAddresses){
            var counter=0;
            for (var i=0;i<account.containerAddresses.length;i++){
                var smartCodeArgs=[account.containerAddresses[i]];
                    query.queryChaincode(peers, config.channelName, config.chaincodeName, smartCodeArgs, 'readTrackCode', req.username, req.orgname).then(function(containerMessage) {
                        var container=JSON.parse(containerMessage);
                        counter++;
                        if (container.popcodeData.type=='container'){
                            containers.push(container);
                        }
                        
                        if (counter==account.containerAddresses.length){
                            return res.json(containers);
                        }
                    });
            }
        }else {
            return res.json([]);
        }
    });
});


router.post('/claimOwnership',function(req,res){
    var args=[];
    var fcn='claimOwnership';
    var address=req.body.address;
    var privKeyString=req.body.privKey;
    var hashCounter=req.body.hashCounter;
    var Key = new NodeRSA({ b: 512 });
    Key.importKey(privKeyString, 'pkcs1');
    var msg=hashCounter+address;
    var hash=crypto.createHash('sha256').update(msg).digest('hex');
    let signature = Key.sign(hash, 'base64');
    args.push(address);
    args.push(signature);


    invoke.invokeChaincode(peers, config.channelName, config.chaincodeName, fcn, args, req.username, req.orgname)
	.then(function(message) {
		res.send(message);
	});
});

module.exports=router;