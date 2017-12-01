
var helper=require('../app/helper.js');
var query = require('../app/query.js');
var log4js = require('log4js');
var logger = log4js.getLogger('SampleWebApp');
var co=require('co')

function * getExplorerData(number,username,orgname,peer){
    var blockList=[];
    var txArray=[];
    console.log('reaching inide this');
    var currentStateData=yield query.getChainInfo(peer,  username, orgname);
    var currentBlockHash=currentStateData.currentBlockHash.toString('hex');
    var previousBlockHash=currentStateData.previousBlockHash.toString('hex');
    var blockHeight=currentStateData.height.low;
    var currentState={};
    currentState.currentBlockHash=currentBlockHash;
    currentState.previousBlockHash=previousBlockHash;
    currentState.blockHeight=blockHeight;
    
        for (var i=1;i<=number;i++){
            let message=yield query.getBlockByNumber(peer, blockHeight-i, username, orgname);
            var block={};
                            
            block.number=blockHeight-i;
            block.previous_hash=message.header.previous_hash;
            block.dataHash=message.header.data_hash;
            block.transactionNum=message.data.data.length;
            block.transactions=[];
            for (var j=0;j<message.data.data.length;j++){
                var txMessage=yield query.getTransactionByID(peer, message.data.data[j].payload.header.channel_header.tx_id, username, orgname);
                var tx={};
                tx.id=txMessage.transactionEnvelope.payload.header.channel_header.tx_id;
                tx.timeStamp=txMessage.transactionEnvelope.payload.header.channel_header.timestamp;
                tx.nonce=txMessage.transactionEnvelope.payload.header.signature_header.nonce.toString('hex');
                tx.certificate=txMessage.transactionEnvelope.payload.header.signature_header.creator.IdBytes;
                tx.signature=txMessage.transactionEnvelope.signature.toString('hex');
                block.transactions.push(tx);
                txArray.push(tx);
            }
            blockList.push(block);
        }
    return {blockList,txArray,currentState};
};

function getExplorer(number,username,orgname,peer,callBack){
    co(getExplorerData,number,username,orgname,peer).then((list)=>{
        console.log(list);
        callBack(list);
    });
}


function * getBlock(peer, blockNum, username, orgname){
    var block={};
    var message=yield query.getBlockByNumber(peer, blockNum, username, orgname)
	console.log("===================",message);
    if (!message.header){
        block.error="true";
        return block;
    }
                            
    block.number=message.header.number.low;
    block.previous_hash=message.header.previous_hash;
    block.dataHash=message.header.data_hash;
    block.transactionNum=message.data.data.length;
    block.error="false";
    block.transactions=[];
    for (var j=0;j<message.data.data.length;j++){
        var txMessage=yield query.getTransactionByID(peer, message.data.data[j].payload.header.channel_header.tx_id, username, orgname);
        var tx={};
        tx.id=txMessage.transactionEnvelope.payload.header.channel_header.tx_id;
        tx.timeStamp=txMessage.transactionEnvelope.payload.header.channel_header.timestamp;
        tx.nonce=txMessage.transactionEnvelope.payload.header.signature_header.nonce.toString('hex');
        tx.certificate=txMessage.transactionEnvelope.payload.header.signature_header.creator.IdBytes;
        tx.signature=txMessage.transactionEnvelope.signature.toString('hex');
        block.transactions.push(tx);
                
    }
    return block;
		
}

function getBlockByNumber(peer,number,username,orgname,callBack){
    logger.debug('==================== GET BLOCK BY NUMBER ==================');
	logger.debug('BlockID : ' + number);
	logger.debug('Peer : ' + peer);
	if (!number) {
		res.json(getErrorMessage('\'blockId\''));
		return;
	}
    co(getBlock,peer,number,username,orgname).then((list)=>{
        console.log(list);
        callBack(list);
    });
}

function getTransactionById(trxnId,peer,username,orgname,callBack){
    logger.debug('================ GET TRANSACTION BY TRANSACTION_ID ======================');
	if (!trxnId) {
		res.json(getErrorMessage('\'trxnId\''));
		return callBack({error:"error"});
	}
    
	query.getTransactionByID(peer, trxnId, username, orgname)
		.then(function(txMessage) {
            var tx={};
            if (!txMessage.transactionEnvelope){
                tx.error='true';
                return callBack(tx);
            }
			
            
            tx.id=txMessage.transactionEnvelope.payload.header.channel_header.tx_id;
            tx.timeStamp=txMessage.transactionEnvelope.payload.header.channel_header.timestamp;
            tx.nonce=txMessage.transactionEnvelope.payload.header.signature_header.nonce.toString('hex');
            tx.certificate=txMessage.transactionEnvelope.payload.header.signature_header.creator.IdBytes;
            tx.signature=txMessage.transactionEnvelope.signature.toString('hex');
            tx.error='false';
            callBack(tx);
		});
}

exports.getExplorer=getExplorer;
exports.getBlockByNumber=getBlockByNumber;
exports.getTransactionById=getTransactionById;
