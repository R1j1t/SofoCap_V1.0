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



router.get('/', function(req, res) {
    console.log("in it here with the req")
    console.log("in supplier / route cookies", req.cookies);
    console.log("in supplier / route session ", req.session);
    queryMongo = {
        emailId: req.session.username
    };
    MongoClient.connect(url, function(err, db) {
        if (err) {
            console.log("error in mongo creating", err);
            throw err;
            return res.redirect('back');

        }

        db.collection("buyers").findOne(queryMongo, function(notifyError, notifyResult) {
            if (notifyError) {
                console.log("error in notify", error)
                return res.redirect('back');
            } else {
                notifydoc = notifyResult.notifications;
                console.log("===================ifdoc / wala ==============", notifydoc);
                return res.render('buyer', {
                    notifydoc: notifydoc,
                    configData: configData
                })
            }
        })


    })
});


router.get('/manage-po', function(req, res) {
    console.log("==============================hgeljkhfdfkohjklfhjklhjkfHUIOHJkdfui====================hi===========")
    var suppliers
    var notifydoc
        // console.log(req.session);
    name = req.session.username;
    org = req.session.orgname;
    fcn = "readAllSuppliers"
    console.log("hi there ==========>", name, org);
    console.log(query);
    // peer, channelName, chaincodeName, args, fcn, username, org
    query.queryChaincode(peers, config.channelName, config.chaincodeName, [], fcn, name, org).then(function(rawSuppliersData) {
        if (rawSuppliersData) {
            // console.log(rawSuppliersData);
            //console.log(typeof(rawSuppliersData));
            // console.log(JSON.parse(rawSuppliersData));
            suppliers = JSON.parse(rawSuppliersData)
            fcn = "ReadAcc"
            query.queryChaincode(peers, config.channelName, config.chaincodeName, [], fcn, name, org).then(function(rawBuyerData) {
                console.log("hi there", rawBuyerData);
                buyerInfo = JSON.parse(rawBuyerData);
                console.log("the data from the query ", buyerInfo);
                MongoClient.connect(url, function(err, db) {
                    if (err) {
                        console.log("error in mongo creating", err);
                        throw err;
                        return res.redirect('back');

                    }
                    if (buyerInfo.purchaseOrders != null) {
                        if (buyerInfo.purchaseOrders.length < 10) {
                            num = '000' + (buyerInfo.purchaseOrders.length + 1);
                        } else if (buyerInfo.purchaseOrders.length < 100) {
                            num = '00' + (buyerInfo.purchaseOrders.length + 1);
                        } else if (buyerInfo.purchaseOrders.length < 1000) {
                            num = '0' + (buyerInfo.purchaseOrders.length + 1);
                        } else {
                            num = (buyerInfo.purchaseOrders.length + 1);
                        }

                        poNumber = '#PO' + '2017' + buyerInfo.buyerName.slice(0, 3) + num;
                    } else {
                        poNumber = '#PO' + '2017' + buyerInfo.buyerName.slice(0, 3).toUpperCase() + '0001';
                    }
                    var supplierName = [];
                    if (buyerInfo.purchaseOrders != null) {
                        console.log("length", buyerInfo.purchaseOrders.length);
                        for (var i = 0; i < buyerInfo.purchaseOrders.length; i++) {
                            if (i == buyerInfo.purchaseOrders.length - 1) {
                                queryMongo = {
                                    SupplierId: buyerInfo.purchaseOrders[i].supplier
                                }
                                console.log()
                                console.log()
                                console.log()
                                console.log()
                                console.log("data in query mongo", queryMongo);
                                db.collection("suppliers").findOne(queryMongo, function(err, result) {
                                    console.log()
                                    console.log()
                                    console.log()
                                    console.log()
                                    console.log("result from in mongoquery", result);
                                    if (result) {

                                        console.log('result man-');
                                        console.log(result);
                                        supplierName.push(result.supplierName);
                                        console.log(i);
                                        console.log(buyerInfo.purchaseOrders.length);

                                        console.log('suppliers-')
                                        console.log(supplierName);
                                        queryMongo = {
                                            emailId: name
                                        };
                                        db.collection("buyers").findOne(queryMongo, function(notifyError, notifyResult) {
                                            if (notifyError) {
                                                console.log("error in notify", error)
                                                return res.redirect('back');
                                            } else {
                                                notifydoc = notifyResult.notifications;
                                                console.log("===================ifdoc==============", notifydoc);
                                                console.log(supplierName);
                                                console.log("===============", suppliers);
                                                return res.render('buyer-po', {
                                                    data: suppliers,
                                                    notifydoc: notifydoc,
                                                    buyerInfo: buyerInfo,
                                                    poNumber: poNumber,
                                                    suppliers: supplierName,
                                                    accData: buyerInfo,
                                                    configData: configData
                                                });
                                            }
                                        })


                                    } else {
                                        return res.redirect('back');
                                    }


                                });




                            } else {
                                queryMongo = {
                                    SupplierId: buyerInfo.purchaseOrders[i].supplier
                                }
                                console.log()
                                console.log()
                                console.log()
                                console.log()
                                console.log("data in query mongo", queryMongo);
                                db.collection("suppliers").findOne(queryMongo, function(err, result) {
                                    console.log()
                                    console.log()
                                    console.log()
                                    console.log()
                                    console.log("result from in mongoquery", result);
                                    if (result) {

                                        console.log('result man-');
                                        console.log(result);
                                        supplierName.push(result.supplierName);
                                        console.log(i);
                                        console.log(buyerInfo.purchaseOrders.length);
                                    }
                                });




                                //
                            }




                        }




                    } else {
                        queryMongo = {
                            emailId: name
                        };
                        db.collection("buyers").findOne(queryMongo, function(notifyError, notifyResult) {
                            if (notifyError) {
                                console.log("error in notify", error)
                                return res.redirect('back');
                            } else {
                                notifydoc = notifyResult.notifications;
                                console.log("===================doc==============", notifydoc);
                                return res.render('buyer-po', {
                                    data: suppliers,
                                    notifydoc: notifydoc,
                                    buyerInfo: buyerInfo,
                                    poNumber: poNumber,
                                    suppliers: supplierName,
                                    accData: buyerInfo,
                                    configData: configData
                                });
                            }
                        })


                    }


                })

            })

        } else {
            return res.redirect('back')
        }
    });

});



// router.get('/LAKSAHY',function(req,res){
//     res.send("hello");
// });

router.post('/manage-po/generatePO', function(req, res) {
    console.log(req.body);
    console.log(req.session);
    var name = req.session.username;
    var org = 'org1';

    var args0 = req.body.poNumber;
    var args1 = req.body.supplier;
    var args2 = req.body.creditDays;
    var args4 = req.body.poValue;
    //var args3//filehash
    if (req.files.file)
        var args3 = hashObj(req.files.file);
    console.log("hash for the doc", args3);

    //args3=hash;
    console.log("type of ", typeof(args0));
    console.log("value of ", args0);
    console.log("type of ", typeof(args1));
    console.log("value of ", args1);
    console.log("type of ", typeof(args2));
    console.log("value of ", args2);
    console.log("type of ", typeof(args3));
    console.log("value of ", args3);
    console.log("type of ", typeof(args4));
    console.log("value of ", args4);


    var args = [args0.toString(), args1.toString(), args2.toString(), args3.toString(), args4.toString()]
    console.log("args for the invoke", args);

    fcn = "createPO"
    invoke.invokeChaincode(peers, config.channelName, config.chaincodeName, fcn, args, name, org)
        .then(function(message) {
            console.log("in registering verifier  invoker message  ---->", message)
            if (message.indexOf("Error") > 0) {
                index = message.indexOf("Error:");
                err = message.slice(index, (message.length) - 1)
                console.log("error in registering verifier ", err)
                return res.redirect(301, 'back');

            }
            if (req.files.file) {
                var hash = args3
                var doc = {
                    id: '' + hash,
                    docName: "PO",
                    fileName: req.files.file.name
                }
                fileManagement.writeFile(req.files.file, hash);
            }
            return res.redirect('/buyer/manage-po')

        })




    //         // MongoClient.connect(url, function(err, db) {
    //         //   if (err) 
    //         // {
    //         //   throw err;
    //         //   return res.redirect(301, 'back');

    //         //   }
    //         //   var query = { emailId: req.session.username};
    //         //   var updates ={$push:{companyDocs:doc},$set:{state:4}}
    //         //   db.collection("suppliers").updateOne(query,updates,function(err, result) {
    //         //     if (err) {
    //         //       console.log("updateOne error ===========",err);
    //         //     return res.redirect(301, 'back');
    //         //     }

    //         //    // return res.redirect("/supplier");

    //         //   })


    //         // })




})



router.get('/view-po', function(req, res) {
    name = req.session.username;
    org = req.session.orgname;

    QueryArgs = []
    fcn = "ReadAcc"
    console.log("==========REACHING FOR QUERY--1============", name, org, peers, fcn);
    query.queryChaincode(peers, config.channelName, config.chaincodeName, QueryArgs, fcn, name, org).then(function(dataBuyer) {
        var invoiceId = req.query.poid;
        var buyerInfo = JSON.parse(dataBuyer);
        if (buyerInfo.purchaseOrders != null) {
            for (var i = 0; i < buyerInfo.purchaseOrders.length; i++) {
                if (invoiceId == buyerInfo.purchaseOrders[i].orderId) {
                    var inv = buyerInfo.purchaseOrders[i];
                    returnSupplier(buyerInfo.purchaseOrders[i].supplier, function(err, supplier) {
                        if (err) {
                            return res.redirect('back');
                        }
                        if (supplier) {
                            var d = date.parse(inv.date, 'DD-MM-YYYY');
                            d1 = date.format(d, 'MMMM DD YYYY');
                            creditDate = date.addDays(d, inv.creditPeriod);
                            newCreditDate = date.format(creditDate, 'MMMM DD YYYY');
                            notifydoc = supplier.notifications;
                            // getNotifications()
                            console.log(inv);
                            return res.render('view-po', {
                                invoice: inv,
                                notifydoc: notifydoc,
                                supplier: supplier.supplierName,
                                buyer: buyerInfo.buyerName,
                                creditDate: newCreditDate,
                                invoiceDate: d1,
                                accData: buyerInfo,
                                viewer: 'buyer',
                                configData: configData
                            });
                        } else {
                            return res.redirect('back');
                        }
                        //  res.render('view-po',{invoice:inv,notifydoc:notifydoc,supplier:supplier.name,buyer:req.cookies.name,creditDate:newCreditDate,invoiceDate:d1,accData: buyerInfo,viewer:'buyer',configData:configData});
                    });
                }
            }
        }




    });
})

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

router.get('/manage-invoice', function(req, res) {
    name = req.session.username
    org = req.session.orgname;
    
    if(req.session.viewer){
    viewer=req.session.viewer;
}
    else{
    viewer='maker'
    }
   // req.session.viewer=undefined;
    QueryArgs = []
    fcn = "ReadAcc"
    console.log("==========REACHING FOR QUERY--1============", name, org, peers, fcn);
    query.queryChaincode(peers, config.channelName, config.chaincodeName, QueryArgs, fcn, name, org).then(function(dataBuyer) {
        var invoiceId = req.query.poid;
        var buyerInfo = JSON.parse(dataBuyer);
        console.log()
        console.log()
        console.log()
        console.log(buyerInfo);
        console.log()
        console.log()
        console.log()

        var supplierName = [];
        if (buyerInfo.invoices != null) {
            console.log(buyerInfo.invoices.length);
            for (var i = 0; i < buyerInfo.invoices.length; i++) {
                if (i == buyerInfo.invoices.length - 1) {
                    returnSupplier(buyerInfo.invoices[i].supplier, function(err, result) {
                        if (err)
                            return res.redirect('back');
                        if (result) {
                            supplierName.push(result.supplierName);

                            returnBuyer(buyerInfo.buyerId, function(err, buyerData) {
                                if (err) {
                                    return res.redirect('back');
                                }
                                if (buyerData) {

                                    notifydoc = buyerData.notifications
                                        //buyerDoc
                                    return res.render('buyer-invoice', {
                                        buyerInvoice: buyerInfo.invoices,
                                        notifydoc: notifydoc,
                                        supplier: supplierName,
                                        accData: buyerInfo,
                                        configData: configData,
                                        viewer: viewer
                                    });


                                }

                            })




                        }
                    })


                } else {
                    returnSupplier(buyerInfo.invoices[i].supplier, function(err, result) {
                        if (err)
                            return res.redirect('back');
                        if (result) {
                            supplierName.push(result.supplierName);
                        }
                    });
                }

            }
        } else {
            returnBuyer(buyerInfo.buyerId, function(err, buyerData) {
                if (err) {
                    return res.redirect('back');
                }
                if (buyerData) {

                    notifydoc = buyerData.notifications
                    notifydoc = buyerInfo.notifications;
                    res.render('buyer-invoice', {
                        buyerInvoice: buyerInfo.invoices,
                        notifydoc: notifydoc,
                        supplier: supplierName,
                        accData: buyerInfo,
                        configData: configData,
                        viewer: 'maker'
                    });
                }
            });
        }




        // res.send(buyerInfo);
    });
})




router.get('/view-invoice', function(req, res) {
    name = req.session.username;
    org = req.session.orgname;

    QueryArgs = []
    fcn = "ReadAcc"
    console.log("==========REACHING FOR QUERY--1============", name, org, peers, fcn);
    query.queryChaincode(peers, config.channelName, config.chaincodeName, QueryArgs, fcn, name, org).then(function(dataBuyer) {

        var invoiceId = '' + req.query.poid;
        if (dataBuyer) {
            var buyerInfo = JSON.parse(dataBuyer);
            console.log(buyerInfo);
            console.log('---------------------');
            console.log(invoiceId);
            console.log('---------------------');
            if (buyerInfo.invoices != null) {
                for (var i = 0; i < buyerInfo.invoices.length; i++) {
                    console.log('coming here');
                    if (invoiceId == buyerInfo.invoices[i].invoiceId) {
                        console.log('coming here also');
                        var inv = buyerInfo.invoices[i];
                        returnSupplier(buyerInfo.invoices[i].supplier, function(err, supplier) {
                            if (err) {
                                return res.redirect('back');
                            }
                            if (supplier) {
                                var d = date.parse(inv.date, 'DD-MM-YYYY');
                                d1 = date.format(d, 'MMMM DD YYYY');
                                creditDate = date.addDays(d, inv.purchaseOrders[0].creditPeriod);
                                newCreditDate = date.format(creditDate, 'MMMM DD YYYY');
                                returnBuyer(buyerInfo.buyerId, function(err, accData) {
                                    if (err) {
                                        return res.redirect('back');
                                    }
                                    if (accData) {
                                        notifydoc = accData.notifications
                                        console.log(notifydoc);
                                        invoiceTrail = [] //hardcoded for future use
                                        return res.render('view-invoice', {
                                            invoice: inv,
                                            notifydoc: notifydoc,
                                            invoiceTrail: invoiceTrail,
                                            accData: accData,
                                            supplier: supplier.supplierName,
                                            buyer: accData.buyerName,
                                            creditDate: newCreditDate,
                                            invoiceDate: d1,
                                            viewer: 'buyer',
                                            employee: accData.buyerName,
                                            configData: configData
                                        });
                                    } else {
                                        return res.redirect('back');
                                    }

                                });
                            }
                        });

                        console.log('outside');
                        console.log(SupplierInfo.invoices[i]);
                        //res.render('view-invoice',{invoice:SupplierInfo.invoices[i]});


                    }
                }
            } else {
                console.log(SupplierInfo.invoices);
                return res.render('view-invoice', {
                    configData: configData
                });
            }
        } else {
            res.redirect('back');
        }
    })
})


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


router.post('/qualityCheck', function(req, res) {
    name = req.session.username;
    org = req.session.orgname;
    console.log(req.files);
    var GfileId = 'G' + req.body.invID;
    var QfileId = 'Q' + req.body.invID;
    console.log('==================');
    console.log(GfileId);
    console.log(QfileId);
    console.log('==================');

    if (req.files.file_goods) {
        if (req.files.file_quality) {

            fcn = "updateInvoiceStatus"
            args2 = "Quality Check"
            args1 = "" + req.body.invID;
            args = [args1, args2];
            console.log("going to invoke", fcn, args, name, org)
            invoke.invokeChaincode(peers, config.channelName, config.chaincodeName, fcn, args, name, org)
                .then(function(message) {
                    if (message.indexOf("Error") > 0) {
                        index = message.indexOf("Error:");
                        err = message.slice(index, (message.length) - 1)
                        console.log("error in registering verifier ", err)
                        return res.redirect('back');



                    }

                    fileManagement.writeFile(req.files.file_quality, QfileId);
                    fileManagement.writeFile(req.files.file_goods, GfileId);

                    return res.redirect('back');


                });



        } else {
            res.redirect('back');
        }

    } else {
        res.redirect('back');
    }

});

router.get('/approveInvoice',function(req,res){
    var name=req.session.username
    var org=req.session.orgname
    args0=req.query.invoiceId
    args1='approved'
    args=[args0.toString(),args1.toString()];
    fcn="updateInvoiceStatus"

             invoke.invokeChaincode(peers, config.channelName, config.chaincodeName, fcn, args, name, org).then(function(message) {
                if (message.indexOf("Error") > 0) {
                    index = message.indexOf("Error:");
                    err = message.slice(index, (message.length) - 1)
                    console.log("error in registering verifier ", err)
                    return res.redirect('back');



                }
                else{
                    req.session.viewer='verifier'
                  return  res.redirect('/buyer/manage-invoice');
                }

            });



})

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

module.exports = router;