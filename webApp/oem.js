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
var QRCode = require('qrcode');
var fs=require('fs');
var co=require('co');
var explorer=require('../explorer/explorer.js');

hfc.setLogger(logger);
var peers;



router.get('/',function(req,res){
    var args=[];
    query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'ReadAcc', req.username, req.orgname).then(function(message) {
        
            explorer.getExplorer(config.blockAmount,req.username,req.orgname,config.currentPeer,function(data){
                console.log('====================EXPLORER DATA====================');
                console.log(data);
                res.render('explorer',{data:data,user:'OEM',state:1});  
            });
    });
    
});

router.get('/claimOwnership',function(req,res){
    res.render('claimOwnership',{state:5,user:'OEM'});
});

router.get('/createCarton',function(req,res){
    res.render('generate-carton',{state:5,user:'OEM'});
});

router.get('/createContainer',function(req,res){
    res.render('generateContainer',{state:6,user:'OEM'});
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


router.get('/ProductMaster',function(req,res){
    var args=[];
     query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'ReadAcc', req.username, req.orgname).then(function(message) {
            var userData=JSON.parse(message);
            res.render('productMaster',{user:'OEM',userData:userData,state:2});
    });
    
});

router.get('/SkuMaster',function(req,res){
    var args=[];
    query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'ReadAcc', req.username, req.orgname).then(function(message) {
            var userData=JSON.parse(message);
            var products=userData.productMasters;
            var skus=userData.skuMasters;
            res.render('skumaster',{user:'OEM',products:products,skus:skus,state:3});
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
                console.log("================",message.indexOf("Error"))
                if (message.indexOf("Error")>=0){
                    var msg=message.slice(message.indexOf("chaincode::")+11,message.length-2);
                    
                    
                    console.log("=====================Reaching At failed state")
                    req.session.sessionFlash = {
						type: 'failedProductId',
						message: msg
					}
					return res.redirect(301, 'back');
                }
                res.redirect('back');
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
                console.log("================",message.indexOf("Error"))
                if (message.indexOf("Error")>=0){
                    var msg=message.slice(message.indexOf("chaincode::")+11,message.length-2);
                    
                    
                    console.log("=====================Reaching At failed state")
                    req.session.sessionFlash = {
						type: 'failedSkuId',
						message: msg
					}
					return res.redirect(301, 'back');
                }
                res.redirect('back');
                
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
            var total=""+req.body.total;


            args.push(BatchNo);
            args.push(skuId);
            args.push(ManufactureDate);
            args.push(ExpiryDate);
            args.push(total);
            var type='unit';
            var keys=[];
            var addresses=[];
            for (var i=0;i<parseInt(total);i++){
                var Key = new NodeRSA({ b: 512 });
                Key.generateKeyPair(512);
                var privKey = Key.exportKey('pkcs1') ;
                keys.push(privKey);
                
                var publicKeyString=Key.exportKey("public") ;
                var address=crypto.createHash('sha256').update(publicKeyString).digest('hex');
                addresses.push(address);
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
                res.render('unit-qr',{keys:keys,addresses:addresses,BatchNo:BatchNo,skuId:skuId,ManufactureDate:ManufactureDate,ExpiryDate:ExpiryDate,state:4});
      
            });
			
		
			
	});
});


router.get('/addUnit',function(req,res){
    res.render('add_unit',{state:4});
});



router.get('/getUnitData',function(req,res){
    var unitAddress=req.query.address;
    var args=[unitAddress];
    console.log(args);
    query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'readTrackCode', req.username, req.orgname).then(function(unitMessage) {
        var unitInfo = JSON.parse(unitMessage);
        res.render('unitData',{unitInfo:unitInfo,user:'OEM',state:4});
    });
});

router.get('/getCartonData',function(req,res){
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
                    res.render('cartonData',{cartonInfo:cartonInfo,units:subUnits,user:'OEM',state:5});
                }
            });
            
        }
        
    });
});

router.get('/getContainerData',function(req,res){
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
                    res.render('containerData',{containerInfo:containerInfo,cartons:cartons,user:'OEM',state:6});
                }
            });
            
        }
        
    });
});


router.get('/unitManagement',function(req,res){
    getUnitsListSync(req,res,function(units){
         var args=[];
        query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'ReadAcc', req.username, req.orgname).then(function(message) {
            var accData=JSON.parse(message);
            var products=accData.productMasters;
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
            var batches=accData.batches;
            res.render('unitBatchManagement',{units:units,user:'OEM',state:4,products:products,BatchNo:BatchNo,batches:batches});
        });
    });
    
    
});

function * getUnitsDataSync(req,res){
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
                            console.log("HERE==============");
                            console.log(units);
                            return units;
                        }
                    
            }
        }else {
            return units;
        }
    
}

function getUnitsListSync(req,res,callBack){
    co(getUnitsDataSync,req,res).then((list)=>{
        console.log(list);
        callBack(list);
    });
}


router.get('/cartonManagement',function(req,res){
    var args=[];
    query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'ReadAcc', req.username, req.orgname).then(function(message) {
	    var info = JSON.parse(message);
        console.log(info);

        getCartonListSync(req,res,info,function(list){
            res.render('manage-carton',{cartons:list,info:info,user:'OEM',state:5});
        });
                
    });
});


function * getCartonDataSync(req,res,info){
    var cartonsData=[];
        if (info.containerAddresses&&info.containerAddresses.length!=0){
            var counter=0;
        for (var i=0;i<info.containerAddresses.length;i++){
            var args=[info.containerAddresses[i]];
            
            var cartonMessage=yield query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'readTrackCode', req.username, req.orgname);
                var cartonInfo = JSON.parse(cartonMessage);
                if (cartonInfo.popcodeData.type=='carton'){
                    cartonsData.push(cartonInfo);
                }
                counter++;
                if (counter==info.containerAddresses.length){
                    console.log(cartonInfo);
                    return cartonsData;
                }
            
        }
        }else {
            return cartonsData;
        } 
}

function getCartonListSync(req,res,info,callBack){
    co(getCartonDataSync,req,res,info).then((list)=>{
        console.log(list);
        callBack(list);
    });
}


router.get('/containerManagement',function(req,res){
    var args=[];
    query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'ReadAcc', req.username, req.orgname).then(function(message) {
	    var info = JSON.parse(message);
        console.log(info);

        getContainerListSync(req,res,info,function(list){
            res.render('manage-container',{containers:list,info:info,user:'OEM',state:6});
        });
        
          
    });
});

function * getContainerDataSync(req,res,info){
    var cartonsData=[];
        if (info.containerAddresses&&info.containerAddresses.length!=0){
            var counter=0;
        for (var i=0;i<info.containerAddresses.length;i++){
            var args=[info.containerAddresses[i]];
            
            var cartonMessage=yield query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'readTrackCode', req.username, req.orgname);
                var cartonInfo = JSON.parse(cartonMessage);
                if (cartonInfo.popcodeData.type=='container'){
                    cartonsData.push(cartonInfo);
                }
                counter++;
                if (counter==info.containerAddresses.length){
                    console.log(cartonInfo);
                    return cartonsData;
                }
            
        }
        }else {
            return cartonsData;
        } 
}

function getContainerListSync(req,res,info,callBack){
    co(getContainerDataSync,req,res,info).then((list)=>{
        console.log(list);
        callBack(list);
    });
}

router.get('/addWarehouse',function(req,res){
    res.render('addWarehouse',{state:7});
});

router.get('/addDistributor',function(req,res){
    res.render('addDistributor',{state:7});
});

router.post('/makeCartonClass',function(req,res){
    
    var Class=req.body.class;
    var size=req.body.size;
    var capacity=req.body.capacity;
    var ingredient=req.body.ingredient;
    var args=[Class,size,capacity,ingredient];
    var fcn='makeCartonType';

    invoke.invokeChaincode(peers, config.channelName, config.chaincodeName, fcn, args, req.username, req.orgname)
	.then(function(message) {
		res.redirect('back');
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
		res.redirect('back');
	});
});

router.post('/makeOpenCarton',function(req,res){
    var fcn='makeOpenCarton';
    var args=[req.body.cartonId,req.body.cartonClass];
    invoke.invokeChaincode(peers, config.channelName, config.chaincodeName, fcn, args, req.username, req.orgname)
	.then(function(message) {
		res.redirect('back');
	});


});

router.post('/makeOpenContainer',function(req,res){
    var fcn='makeOpenContainer';
    var args=[req.body.containerId,req.body.containerClass];
    invoke.invokeChaincode(peers, config.channelName, config.chaincodeName, fcn, args, req.username, req.orgname)
	.then(function(message) {
		res.redirect('back');
	});


});

router.post('/addWarehouse',function(req,res){
    var warehouse=req.body.name;
    var orgName="org1";
    var placeAddress=req.body.address1+' '+req.body.address2+' '+req.body.address3+' '+req.body.address4;
    var status='active';
    helper.getRegisteredUsers(warehouse, orgName, true,'Password123').then(function(response) {
		if (response && typeof response !== 'string') {
            var args=[];
            args.push(warehouse);
            args.push('warehouse');
            args.push(placeAddress);
            args.push(status);
            var fcn='initUser'
            console.log(peers);
            invoke.invokeChaincode(peers, config.channelName, config.chaincodeName, fcn, args, warehouse, orgName)
            .then(function(message) {
                res.redirect('/oem/channelManagement');
            });
			
		} else {
			res.json({
				success: false,
				message: response
			});
		}
	});
});

router.post('/addDistributor',function(req,res){
    var distributor=req.body.name;
    var orgName="org1";
    var placeAddress=req.body.address1+' '+req.body.address2+' '+req.body.address3+' '+req.body.address4;
    var status='active';
    helper.getRegisteredUsers(distributor, orgName, true,'Password123').then(function(response) {
		if (response && typeof response !== 'string') {
            var args=[];
            args.push(distributor);
            args.push('distributor');
            args.push(placeAddress);
            args.push(status);
            console.log(args)
            var fcn='initUser';
            console.log(peers);
            invoke.invokeChaincode(peers, config.channelName, config.chaincodeName, fcn, args, distributor, orgName)
            .then(function(message) {
                //res.json(message).send();
                res.redirect('/oem/channelManagement');
            });
			
		} else {
			res.json({
				success: false,
				message: response
			});
		}
	});
});

router.get('/channelManagement',function(req,res){
        query.queryChaincode(peers, config.channelName, config.chaincodeName, ['warehouse'], 'readAccList', req.username, req.orgname).then(function(warehouseMessage) {
            query.queryChaincode(peers, config.channelName, config.chaincodeName, ['distributor'], 'readAccList', req.username, req.orgname).then(function(distributorMessage) {
                query.queryChaincode(peers, config.channelName, config.chaincodeName, ['subdistributor'], 'readAccList', req.username, req.orgname).then(function(subdistributorMessage) {
                    query.queryChaincode(peers, config.channelName, config.chaincodeName, ['retailer'], 'readAccList', req.username, req.orgname).then(function(retailerMessage) {
                        query.queryChaincode(peers, config.channelName, config.chaincodeName, ['wholeseller'], 'readAccList', req.username, req.orgname).then(function(wholesellerMessage) {
                            var lists={};
                            lists.warehouses=JSON.parse(warehouseMessage);
                            lists.distributors=JSON.parse(distributorMessage);
                            lists.subdistributors=JSON.parse(subdistributorMessage);
                            lists.retailers=JSON.parse(retailerMessage);
                            lists.wholesellers=JSON.parse(wholesellerMessage);
                            res.render('channel-management',{lists:lists,state:7});
                            // res.json(lists).send();
                        });
                    });
                });
            
            });
        
        });
});

router.get('/getUserAssets',function(req,res){
    var userAddress=req.query.address;
    var type=req.query.type;
    query.queryChaincode(peers, config.channelName, config.chaincodeName, [type], 'readAccList', req.username, req.orgname).then(function(userListMessage) {
        var list=JSON.parse(userListMessage);
        for (var i=0;i<list.length;i++){
            if(userAddress==list[i].address){
                var userObj=list[i];
                getUnitsList(req,res,userObj,function(units){
                    getCartonList(req,res,userObj,function(cartons){
                        getContainerList(req,res,userObj,function(containers){
                            var lists={};
                            lists.units=units;
                            lists.cartons=cartons;
                            lists.containers=containers;
                            console.log('=======================lists Info============================');
                            console.log(lists);
                            return res.render('userAssets',{lists:lists,state:7});
                            // return res.json(lists);
                        });
                    });
                });

                
            }
        }
        if (!list||list.length==0){
            var lists={};
            lists.units=[];
            lists.cartons=[];
            lists.containers=[];
            return res.render('userAssets',{lists:lists,state:4});
        }
        
    });

});

function getUnitsList(req,res,info,callback){
    var args=[];
        console.log("=========================Inside Units================================");
        console.log(info);
        var unitsData=[];
        if (info.unitAddresses&&info.unitAddresses.length!=0){
        for (var i=0;i<info.unitAddresses.length;i++){
            var args=[info.unitAddresses[i]];
            query.queryChaincode(peers, config.channelName, config.chaincodeName, args, 'readTrackCode', req.username, req.orgname).then(function(unitMessage) {
                var unitInfo = JSON.parse(unitMessage);
                unitsData.push(unitInfo);
                if (unitsData.length==info.unitAddresses.length){
                    console.log('=======================Unit Info============================')
                    console.log(unitsData);
                    callback(unitsData);
                }
            });
        }
    }else {
        callback(unitsData);
        }
        
}

function getCartonList(req,res,info,callback){
    var args=[];
        console.log("=========================Inside carton================================");
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
                    callback(cartonsData);
                }
            });
        }
    }else {
        callback(cartonsData);
            
        }        
    
}

function getContainerList(req,res,info,callback){
        var args=[];
        console.log("=========================Inside container================================");
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
                    callback(containerData);
                }
            });
        }
    }else {
            callback(containerData);
        }        
    
}

module.exports=router;