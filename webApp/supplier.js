var express = require('express');
var app = express();
var router = express.Router();
var helper = require('../app/helper.js');
var invoke = require('../app/invoke-transaction.js');
var query = require('../app/query.js');
var config = require('../config.json');
var jwt = require('jsonwebtoken');
var fileManagement = require('./fileManagement');
var hfc = require('fabric-client');
var crypto = require('crypto');
var hashObj = require('object-hash');
var date = require('date-and-time');
var peers;
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/sofocap";
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/views'));
app.use(express.static(__dirname + '/assets'));

var configData = {
    "currency": "INR",
    "tax": 0,
    "timeout": 500,
    "invoiceStatusTimeout": 800
}


router.get('/', function(req, res) {
    console.log("in it here with the req")
    console.log("in supplier / route cookies", req.cookies);
    console.log("in supplier / route session ", req.session);
    MongoClient.connect(url, function(err, db) {
        if (err) {
            console.log("error in mongo creating", err);
            throw err;
            return res.redirect(301, 'back');

        }


        var query = {
            emailId: req.session.username
        }
        console.log("query to be searched", query);
        db.collection("suppliers").findOne(query, function(err, result) {
            if (err) {
                console.log("fineOne error ===========", err);
                return res.redirect(301, 'back');
            }
            console.log("result from the find one query", result);
            if (!result) {
                console.log("result not found")
                return res.redirect(301, 'back');
            }

            if (result.state === 1) {
                name = result.supplierName;
                email = result.emailId;
                phoneNumber = result.phone;
                fState = 1;



                return res.render('supplier/comp-detail', {
                    accData: {
                        supplierName: name,
                        emailId: email,
                        phoneNumber: phoneNumber
                    },
                    accInfo: {
                        state: fState,
                        phoneNumber: phoneNumber,
                    }
                });
            }

            if (result.state === 2) {
                return res.render('supplier/owner-detail');
            }
            if (result.state === 3) {
                return res.render('supplier/document-detail')
            }

            if (result.state === 4) {
                if (result.status === 'active') {
                    return res.render('supplier');
                } else {
                    return res.render('supplier/confirm-page')
                }
            }
        });




    })




});


router.post('/completeRegistration', function(req, res) {
    console.log("hel;llllkljkjjhjkhskjhjkh", req.body)
    MongoClient.connect(url, function(err, db) {
        if (err) {
            throw err;
            return res.redirect(301, 'back');

        }
        var query = {
            emailId: req.body.txtEmail
        }
        console.log(query);
        db.collection("suppliers").findOne(query, function(err, result) {
            if (err) {
                console.log("fineOne error ===========", err);
                return res.redirect(301, 'back');
            }
            console.log(result);
            result.CIN = req.body.cin
            result.businessType = req.body.businessType;
            result.industryType = req.body.industryType;
            result.landline = req.body.landline;
            result.pan = req.body.pan;
            result.street = req.body.street;
            result.city = req.body.city;
            result.state = ((result.state) + 1);
            result.cityState = req.body.state;
            result.pin = req.body.pin;
            result.c_street = req.body.c_street;
            result.c_city = req.body.c_city;
            result.c_pin = req.body.c_pin;
            result.status = result.status + 1;
            db.collection("suppliers").replaceOne(query, result, function(err, resp) {
                if (err) {
                    console.log("error in replacing the supplier 2nd form data", err);
                    return res.redirect(301, 'back');

                }
                console.log("1 document updated");
                db.close();
                console.log("directoruy============", __dirname + '../views/supplier/document-detail')
                return res.render(__dirname + '/../views/supplier/owner-detail')

            });
            //   res.json({message:result})
        });
    });

    //supplier/postcompanydocs  api cvall for the uopload of aadhar card grid fs
    //document-detail.ejs page to render 

})

router.post('/postCompanyDocs', function(req, res) {
    console.log(req.files);
    console.log("==========================================", req.files["Pan"]);
    console.log("==========================================", req.files.Pan);
    if (req.files["Pan"]) {
        var hash = crypto.createHash('md5').update('' + Date.now() + Math.random()).digest('hex');
        var doc = {
            id: '' + hash,
            docName: "Pan",
            fileName: req.files["Pan"].name
        }
        fileManagement.writeFile(req.files["Pan"], hash);
        MongoClient.connect(url, function(err, db) {
            if (err) {
                throw err;
                return res.redirect(301, 'back');

            }
            var query = {
                emailId: req.session.username
            };
            var updates = {
                $push: {
                    companyDocs: doc
                },
                $set: {
                    state: 4
                }
            }
            db.collection("suppliers").updateOne(query, updates, function(err, result) {
                if (err) {
                    console.log("updateOne error ===========", err);
                    return res.redirect('back');
                }

                // return res.redirect("/supplier");

            })


        })

    } else if (req.files["Address"]) {
        var hash = crypto.createHash('md5').update('' + Date.now() + Math.random()).digest('hex');
        var doc = {
            id: '' + hash,
            docName: "Address",
            fileName: req.files["Address"].name
        }
        fileManagement.writeFile(req.files["Address"], hash);
        MongoClient.connect(url, function(err, db) {
            if (err) {
                throw err;
                return res.redirect(301, 'back');

            }
            var query = {
                emailId: req.session.username
            };
            var updates = {
                $push: {
                    companyDocs: doc
                },
                $set: {
                    state: 4
                }
            }
            db.collection("suppliers").updateOne(query, updates, function(err, result) {
                if (err) {
                    console.log("updateOne error ===========", err);
                    return res.redirect(301, 'back');
                }

                // return res.redirect("/supplier");

            })


        })

    } else if (req.files["Incorporation"]) {
        var hash = crypto.createHash('md5').update('' + Date.now() + Math.random()).digest('hex');
        var doc = {
            id: '' + hash,
            docName: "Incorporation",
            fileName: req.files["Incorporation"].name
        }
        fileManagement.writeFile(req.files["Incorporation"], hash);
        MongoClient.connect(url, function(err, db) {
            if (err) {
                throw err;
                return res.redirect(301, 'back');

            }
            var query = {
                emailId: req.session.username
            };
            var updates = {
                $push: {
                    companyDocs: doc
                },
                $set: {
                    state: 4
                }
            }
            db.collection("suppliers").updateOne(query, updates, function(err, result) {
                if (err) {
                    console.log("updateOne error ===========", err);
                    return res.redirect(301, 'back');
                }

                //  return res.redirect("/supplier");

            })


        })

    } else if (req.files["MSME"]) {
        var hash = crypto.createHash('md5').update('' + Date.now() + Math.random()).digest('hex');
        var doc = {
            id: '' + hash,
            docName: "MSME",
            fileName: req.files["MSME"].name
        }
        fileManagement.writeFile(req.files["MSME"], hash);
        MongoClient.connect(url, function(err, db) {
            if (err) {
                throw err;
                return res.redirect(301, 'back');

            }
            var query = {
                emailId: req.session.username
            };
            var updates = {
                $push: {
                    companyDocs: doc
                },
                $set: {
                    state: 4
                }
            }
            db.collection("suppliers").updateOne(query, updates, function(err, result) {
                if (err) {
                    console.log("updateOne error ===========", err);
                    return res.redirect(301, 'back');
                }

                // return res.redirect("/supplier");

            })


        })

    } else if (req.files["Credit"]) {
        var hash = crypto.createHash('md5').update('' + Date.now() + Math.random()).digest('hex');
        var doc = {
            id: '' + hash,
            docName: "Credit",
            fileName: req.files["Credit"].name
        }
        fileManagement.writeFile(req.files["Credit"], hash);
        MongoClient.connect(url, function(err, db) {
            if (err) {
                throw err;
                return res.redirect(301, 'back');

            }
            var query = {
                emailId: req.session.username
            };
            var updates = {
                $push: {
                    companyDocs: doc
                },
                $set: {
                    state: 4
                }
            }
            db.collection("suppliers").updateOne(query, updates, function(err, result) {
                if (err) {
                    console.log("updateOne error ===========", err);
                    return res.redirect(301, 'back');
                }

                // return res.redirect("/supplier");

            })


        })

    }
    if (req.files["BankStatement[]"] && req.files["BankStatement[]"].constructor === Object) {
        var hash = crypto.createHash('md5').update('' + Date.now() + Math.random()).digest('hex');
        var doc = {
            id: '' + hash,
            docName: "bankStatement",
            fileName: req.files["BankStatement[]"].name
        }
        fileManagement.writeFile(req.files["BankStatement[]"], hash);
        MongoClient.connect(url, function(err, db) {
            if (err) {
                throw err;
                return res.redirect(301, 'back');

            }
            var query = {
                emailId: req.session.username
            };
            var updates = {
                $push: {
                    companyDocs: doc
                },
                $set: {
                    state: 4
                }
            }
            db.collection("suppliers").updateOne(query, updates, function(err, result) {
                if (err) {
                    console.log("updateOne error ===========", err);
                    return res.redirect(301, 'back');
                }

                //return res.redirect("/supplier");

            })


        })

    } else if (req.files["BankStatement[]"]) {
        var files = req.files["BankStatement[]"];
        for (var i = 0; i < req.files["BankStatement[]"].length; i++) {
            var hash = crypto.createHash('md5').update('' + Date.now() + Math.random()).digest('hex');
            var doc = {
                id: '' + hash,
                docName: "bankStatement",
                fileName: files[i].name
            }
            fileManagement.writeFile(files[i], hash);
            //companyCollection.findOneAndUpdate({id:req.cookies.userId},{$push:{companyDocs:doc},$set:{state:3}},function(err){   
            // });
            MongoClient.connect(url, function(err, db) {
                if (err) {
                    throw err;
                    return res.redirect(301, 'back');

                }
                var query = {
                    emailId: req.session.username
                };
                var updates = {
                    $push: {
                        companyDocs: doc
                    },
                    $set: {
                        state: 4
                    }
                }
                db.collection("suppliers").updateOne(query, updates, function(err, result) {
                    if (err) {
                        console.log("updateOne error ===========", err);
                        return res.redirect(301, 'back');
                    }

                    // return res.redirect("/supplier");

                })


            })
        }
        // return res.redirect('/supplier');
    }

    if (req.files["PL[]"] && req.files["PL[]"].constructor === Object) {
        var hash = crypto.createHash('md5').update('' + Date.now() + Math.random()).digest('hex');
        var doc = {
            id: '' + hash,
            docName: "pl",
            fileName: req.files["PL[]"].name
        }
        fileManagement.writeFile(req.files["PL[]"], hash);
        MongoClient.connect(url, function(err, db) {
            if (err) {
                throw err;
                return res.redirect(301, 'back');

            }
            var query = {
                emailId: req.session.username
            };
            var updates = {
                $push: {
                    companyDocs: doc
                },
                $set: {
                    state: 4
                }
            }
            db.collection("suppliers").updateOne(query, updates, function(err, result) {
                if (err) {
                    console.log("updateOne error ===========", err);
                    return res.redirect(301, 'back');
                }

                // return res.redirect("/supplier");

            })


        })

    } else if (req.files["PL[]"]) {
        var files = req.files["PL[]"];
        for (var i = 0; i < req.files["PL[]"].length; i++) {
            var hash = crypto.createHash('md5').update('' + Date.now() + Math.random()).digest('hex');
            var doc = {
                id: '' + hash,
                docName: "pl",
                fileName: files[i].name
            }
            fileManagement.writeFile(files[i], hash);
            //companyCollection.findOneAndUpdate({id:req.cookies.userId},{$push:{companyDocs:doc},$set:{state:3}},function(err){   
            // });
            MongoClient.connect(url, function(err, db) {
                if (err) {
                    throw err;
                    return res.redirect(301, 'back');

                }
                var query = {
                    emailId: req.session.username
                };
                var updates = {
                    $push: {
                        companyDocs: doc
                    },
                    $set: {
                        state: 4
                    }
                }
                db.collection("suppliers").updateOne(query, updates, function(err, result) {
                    if (err) {
                        console.log("updateOne error ===========", err);
                        return res.redirect(301, 'back');
                    }

                    //  return res.redirect("/supplier");

                })


            })
        }
    }


    return res.redirect("/supplier");




})


router.post('/uploadEmployeeDocs', function(req, res) {

    var employees = [];
    din = req.body["din[]"];
    console.log(din);
    aadhar = req.body["aadhar[]"];
    console.log(aadhar);
    dpan = req.body["dpan[]"];
    console.log(dpan);
    cibil = req.body["cibil[]"];
    console.log(cibil);
    name = req.body["name[]"];
    console.log(name);
    mobile = req.body["mobile[]"];
    console.log(mobile);
    email = req.body["email[]"];
    console.log(email);
    landline = req.body["landline[]"];
    console.log(landline);
    pan = req.files["Pan[]"];
    console.log(pan);
    address = req.files["Address[]"];
    console.log(address);
    photo = req.files["Photo[]"];
    console.log(photo);

    MongoClient.connect(url, function(err, db) {
        if (err) {
            console.log("error in mongo creating", err);
            throw err;
            return res.redirect(301, 'back');

        }




        if (name.constructor === Array) {
            for (var i = 0; i < name.length; i++) {
                var docs = [];

                var pan = "Pan-" + i;
                console.log("going inside");
                console.log(req.files[pan]);
                if (req.files[pan]) {
                    var hash = crypto.createHash('md5').update('' + Date.now() + Math.random()).digest('hex');
                    var pandoc = {
                        id: '' + hash,
                        docName: 'pan',
                        fileName: req.files[pan].name
                    }
                    fileManagement.writeFile(req.files[pan], hash);
                    docs.push(pandoc);
                }
                var address = "Address-" + i;
                if (req.files[address]) {
                    var hash = crypto.createHash('md5').update('' + Date.now() + Math.random()).digest('hex');
                    var pandoc = {
                        id: '' + hash,
                        docName: 'address',
                        fileName: req.files[address].name
                    }
                    fileManagement.writeFile(req.files[address], hash);
                    docs.push(pandoc);
                }
                var photo = "Photo-" + i;
                if (req.files[photo]) {
                    var hash = crypto.createHash('md5').update('' + Date.now() + Math.random()).digest('hex');
                    var pandoc = {
                        id: '' + hash,
                        docName: 'photo',
                        fileName: req.files[photo].name
                    }
                    fileManagement.writeFile(req.files[photo], hash);
                    docs.push(pandoc);
                }

                var employee = {
                    din: din[i],
                    aadhar: aadhar[i],
                    name: name[i],
                    mobile: mobile[i],
                    email: email[i],
                    dpan: dpan[i],
                    cibil: cibil[i],
                    landline: landline[i],
                    employeeDocs: docs
                };
                if (i == name.length - 1) {

                    var query = {
                        emailId: req.session.username
                    };
                    var updates = {
                        $push: {
                            owners: employee
                        },
                        $set: {
                            state: 3
                        }
                    }
                    db.collection("suppliers").updateOne(query, updates, function(err, result) {
                        if (err) {
                            console.log("updateOne error ===========", err);
                            return res.redirect(301, 'back');
                        } else
                            return res.redirect('/supplier');
                    });
                } else {
                    var query = {
                        emailId: req.session.username
                    };
                    var updates = {
                        $push: {
                            owners: employee
                        },
                        $set: {
                            state: 3
                        }
                    }
                    db.collection("suppliers").updateOne(query, updates, function(err, result) {
                        if (err) {
                            console.log("updateOne error ===========", err);
                            return res.redirect(301, 'back');
                        }

                        // return  res.redirect('/supplier');        
                    });
                }
            }

        } else {

            var docs = [];

            var pan = "Pan-0";
            console.log("going outside");
            console.log(req.files[pan]);
            if (req.files[pan]) {
                var hash = crypto.createHash('md5').update('' + Date.now() + Math.random()).digest('hex');
                var pandoc = {
                    _id: '' + hash,
                    docName: 'pan',
                    fileName: req.files[pan].name
                }
                fileManagement.writeFile(req.files[pan], hash);
                docs.push(pandoc);
            }
            var address = "Address-0";
            if (req.files[address]) {
                var hash = crypto.createHash('md5').update('' + Date.now() + Math.random()).digest('hex');
                var pandoc = {
                    _id: '' + hash,
                    docName: 'address',
                    fileName: req.files[address].name
                }
                fileManagement.writeFile(req.files[address], hash);
                docs.push(pandoc);
            }
            var photo = "Photo-0";
            if (req.files[photo]) {
                var hash = crypto.createHash('md5').update('' + Date.now() + Math.random()).digest('hex');
                var pandoc = {
                    _id: '' + hash,
                    docName: 'photo',
                    fileName: req.files[photo].name
                }
                fileManagement.writeFile(req.files[photo], hash);
                docs.push(pandoc);
            }

            var employee = {
                din: din,
                aadhar: aadhar,
                name: name,
                mobile: mobile,
                email: email,
                dpan: dpan,
                cibil: cibil,
                landline: landline,
                employeeDocs: docs
            };
            // companyCollection.findOneAndUpdate({id:req.cookies.userId},{$push:{owners:employee},$set:{state:3}},function(err){              
            //         res.redirect('/supplier');        
            // });

            var query = {
                emailId: req.session.username
            };
            var updates = {
                $push: {
                    owners: employee
                },
                $set: {
                    state: 3
                }
            }
            db.collection("suppliers").updateOne(query, updates, function(err, result) {
                if (err) {
                    console.log("updateOne error ===========", err);
                    return res.redirect(301, 'back');
                }

                return res.redirect('/supplier');
            });


        }

    });
});



router.get('/manage-po', function(req, res) {
    name = req.session.username;
    org = req.session.orgname;

    QueryArgs = []
    fcn = "ReadAcc"
    console.log("==========REACHING FOR QUERY--1============", name, org, peers, fcn);
    query.queryChaincode(peers, config.channelName, config.chaincodeName, QueryArgs, fcn, name, org).then(function(supplierMessage) {
        //  console.log("======================================REACHING FOR QUERY--2==================---"+message);

        var supplierInfo = JSON.parse(supplierMessage);
        console.log(supplierInfo);
        MongoClient.connect(url, function(err, db) {
            if (err) {
                console.log("error in mongo creating", err);
                throw err;
                return res.redirect(301, 'back');

            }
            var buyerName = [];
            if (supplierInfo.purchaseOrders != null) {
                console.log("length", supplierInfo.purchaseOrders.length);
                for (var i = 0; i < supplierInfo.purchaseOrders.length; i++) {
                    if (i == supplierInfo.purchaseOrders.length - 1) {
                        queryMongo = {
                            buyerId: supplierInfo.purchaseOrders[i].buyer
                        }
                        console.log()
                        console.log()
                        console.log()
                        console.log()
                        console.log("data in query mongo", queryMongo);
                        db.collection("buyers").findOne(queryMongo, function(err, result) {
                            console.log()
                            console.log()
                            console.log()
                            console.log()
                            console.log("result from in mongoquery", result);
                            if (result) {

                                console.log('result man-');
                                console.log(result);
                                buyerName.push(result.buyerName);
                                console.log(i);
                                console.log(supplierInfo.purchaseOrders.length);

                                console.log('suppliers-')
                                console.log(buyerName);
                                queryMongo = {
                                    emailId: name
                                };
                                db.collection("suppliers").findOne(queryMongo, function(notifyError, notifyResult) {
                                    if (notifyError) {
                                        console.log("error in notify", error)
                                        return res.redirect('back');
                                    } else {
                                        notifydoc = notifyResult.notifications;
                                        console.log("===================ifdoc==============", notifydoc);
                                        console.log(supplierInfo)
                                        console.log(buyerName)
                                        console.log(supplierInfo);


                                        res.render('supplier-po', {
                                            supplierInfo: supplierInfo,
                                            notifydoc: notifydoc,
                                            buyers: buyerName,
                                            accData: supplierInfo,
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
                            buyerId: supplierInfo.purchaseOrders[i].buyer
                        }
                        console.log()
                        console.log()
                        console.log()
                        console.log()
                        console.log("data in query mongo", queryMongo);
                        db.collection("buyers").findOne(queryMongo, function(err, result) {
                            console.log()
                            console.log()
                            console.log()
                            console.log()
                            console.log("result from in mongoquery", result);
                            if (result) {

                                console.log('result man-');
                                console.log(result);
                                buyerName.push(result.buyerName);
                                console.log(i);
                                console.log(supplierInfo.purchaseOrders.length);

                                console.log('suppliers-')
                                console.log(buyerName);


                            }
                        })




                        //
                    }

                }




            } else {
                queryMongo = {
                    emailId: name
                };
                db.collection("suppliers").findOne(queryMongo, function(notifyError, notifyResult) {
                    if (notifyError) {
                        console.log("error in notify", error)
                        return res.redirect('back');
                    } else {
                        notifydoc = notifyResult.notifications;
                        console.log("===================ifdoc==============", notifydoc);
                        console.log(supplierInfo)
                        console.log(buyerName)
                        console.log(supplierInfo);

                        // res.render('supplier-po', {supplierInfo: supplierInfo,notifydoc:notifydoc,buyers:buyerName, accData: supplierInfo,configData:configData});
                        res.render('supplier-po', {
                            supplierInfo: supplierInfo,
                            notifydoc: notifydoc,
                            buyers: buyerName,
                            accData: supplierInfo,
                            configData: configData
                        });
                    }
                })

            }
        });
    });
})



router.get('/generate-invoice', function(req, res) {
    console.log(req.session);
    name = req.session.username;
    org = req.session.orgname;
    //name=req.session.username;
    // org=req.session.orgname;

    QueryArgs = []
    fcn = "ReadAcc"
    console.log("==========REACHING FOR QUERY--1============", name, org, peers, fcn);
    query.queryChaincode(peers, config.channelName, config.chaincodeName, QueryArgs, fcn, name, org).then(function(supplierMessage) {
        //  console.log("======================================REACHING FOR QUERY--2==================---"+message);

        var supplierInfo = JSON.parse(supplierMessage);
        console.log("supplierInfo",supplierInfo);
        var invoiceNumber, num;
        if (supplierInfo.invoices != null) {
            if (supplierInfo.invoices.length < 10) {
                num = '000' + (supplierInfo.invoices.length + 1);
            } else if (supplierInfo.invoices.length < 100) {
                num = '00' + (supplierInfo.invoices.length + 1);
            } else if (supplierInfo.invoices.length < 1000) {
                num = '0' + (supplierInfo.invoices.length + 1);
            } else {
                num = (supplierInfo.invoices.length + 1);
            }

            invoiceNumber = '#IN' + '2017' + supplierInfo.supplierName.slice(0, 3).toUpperCase() + num;
        } else {
            invoiceNumber = '#IN' + '2017' + supplierInfo.supplierName.slice(0, 3).toUpperCase() + '0001';
        }
        var POID = req.query.poid;
        var order;
        for (var i = 0; i < supplierInfo.purchaseOrders.length; i++) {
            if (supplierInfo.purchaseOrders[i].orderId === POID) {
                order = supplierInfo.purchaseOrders[i];
                break;
            }
        }

        MongoClient.connect(url, function(err, db) {
            if (err) {
                console.log("error in mongo creating", err);
                throw err;
                return res.redirect(301, 'back');

            }


            queryMongo = {
                emailId: name
            };
            db.collection("suppliers").findOne(queryMongo, function(notifyError, notifyResult) {
                if (notifyError) {
                    console.log("error in notify", error)
                    return res.redirect('back');
                } else {
                    notifydoc = notifyResult.notifications;
                    console.log("===================ifdoc==============", notifydoc);


                    // res.render('supplier-po', {supplierInfo: supplierInfo,notifydoc:notifydoc,buyers:buyerName, accData: supplierInfo,configData:configData});
                    res.render("supplier-invoice", {
                        supplierInfo: supplierInfo,
                        notifydoc: notifydoc,
                        order: order,
                        invoiceNumber: invoiceNumber,
                        accData: notifyResult,
                        configData: configData
                    });
                }
            })
        });



    });



})




router.post('/createInvoice', function(req, res) {
    console.log(req.body);

    console.log(req.files);
    name = req.session.username;
    org = req.session.orgname;

    args0 = req.body.invoiceNumber
    args1 = req.body.purchaseId
    args2 = req.body.creditDays
    args3 = req.body.buyerId
    args4 = configData.tax
    args5 = req.body.totalValue
    var args6 = ""
    if (req.files.file)
        args6 = hashObj(req.files.file)
    var args = [args0.toString(), args1.toString(), args2.toString(), args3.toString(), args4.toString(), args5.toString(), args6.toString()]
    console.log(args);
    fcn = "generateInvoice"
    invoke.invokeChaincode(peers, config.channelName, config.chaincodeName, fcn, args, name, org)
        .then(function(message) {
            console.log("in registering buyer  invoker message  ---->", message)
            if (message.indexOf("Error") > 0) {
                index = message.indexOf("Error:");
                err = message.slice(index, (message.length) - 1)
                console.log("error in registering  buyer ", err)
                return res.redirect('back');
            }

            if (req.files.file) {
                // var hash =crypto.createHash('md5').update(''+Date.now()+Math.random()).digest('hex');
                var doc = {
                    id: '' + args6,
                    docName: "invoice",
                    fileName: args6
                }
                fileManagement.writeFile(req.files.file, args6);
            }

            args = [args1.toString(), "Completed"]
            fcn = "updatePOStatus"
            invoke.invokeChaincode(peers, config.channelName, config.chaincodeName, fcn, args, name, org)
                .then(function(message) {
                    console.log("in registering buyer  invoker message  ---->", message)
                    if (message.indexOf("Error") > 0) {
                        index = message.indexOf("Error:");
                        err = message.slice(index, (message.length) - 1)
                        console.log("error in registering  buyer ", err)
                        return res.redirect('back');
                    }

                    return res.redirect('/supplier/manage-invoice')

                });




        })
});


router.get('/manage-invoice', function(req, res) {
    name = req.session.username;
    org = req.session.orgname;

    QueryArgs = []
    fcn = "ReadAcc"
    console.log("==========REACHING FOR QUERY--1============", name, org, peers, fcn);
    query.queryChaincode(peers, config.channelName, config.chaincodeName, QueryArgs, fcn, name, org).then(function(supplierMessage) {
        //  console.log("======================================REACHING FOR QUERY--2==================---"+message);

        var supplierInfo = JSON.parse(supplierMessage);
        console.log(supplierInfo);
        MongoClient.connect(url, function(err, db) {
            if (err) {
                console.log("error in mongo creating", err);
                throw err;
                return res.redirect(301, 'back');

            }
            var buyerName = [];
            if (supplierInfo.invoices != null) {
                console.log("length", supplierInfo.invoices.length);
                for (var i = 0; i < supplierInfo.invoices.length; i++) {
                    if (i == supplierInfo.invoices.length - 1) {
                        queryMongo = {
                            buyerId: supplierInfo.invoices[i].buyer
                        }
                        console.log()
                        console.log()
                        console.log()
                        console.log()
                        console.log("data in query mongo", queryMongo);
                        db.collection("buyers").findOne(queryMongo, function(err, result) {
                            console.log()
                            console.log()
                            console.log()
                            console.log()
                            console.log("result from in mongoquery", result);
                            if (result) {

                                console.log('result man-');
                                console.log(result);
                                buyerName.push(result.buyerName);
                                console.log(i);
                                console.log(supplierInfo.invoices.length);

                                console.log('suppliers-')
                                console.log(buyerName);
                                queryMongo = {
                                    emailId: name
                                };
                                returnSupplier(supplierInfo.supplierId,function(err,accData){
                                    if(err){
                                        return res.redirect('back');
                                      } else {
                                        notifydoc = accData.notifications;
                                        console.log("===================ifdoc==============", notifydoc);
                                        console.log(supplierInfo)
                                        console.log(buyerName)
                                        console.log(supplierInfo);

                                        //bankName=[]
                                        renderWithBank(req, res, supplierInfo, notifydoc, buyerName, configData);

                                        // res.render('supplier-manage-invoice', {supplierInvoices: supplierInfo.invoices,notifydoc:notifydoc,buyers:buyerName,accData:supplierInfo,configData:configData,banks:bankName});
                                        // res.render('supplier-po', {supplierInfo: supplierInfo,notifydoc:notifydoc,buyers:buyerName, accData: supplierInfo,configData:configData});
                                    }
                                })


                            } else {
                                return res.redirect('back');
                            }


                        });




                    } else {


                        queryMongo = {
                            buyerId: supplierInfo.invoices[i].buyer
                        }
                        console.log()
                        console.log()
                        console.log()
                        console.log()
                        console.log("data in query mongo", queryMongo);
                        db.collection("buyers").findOne(queryMongo, function(err, result) {
                            console.log()
                            console.log()
                            console.log()
                            console.log()
                            console.log("result from in mongoquery", result);
                            if (result) {

                                console.log('result man-');
                                console.log(result);
                                buyerName.push(result.buyerName);
                                console.log(i);
                                console.log(supplierInfo.invoices.length);

                                console.log('suppliers-')
                                console.log(buyerName);


                            }
                        })




                        //
                    }

                }




            } else {
                queryMongo = {
                    emailId: name
                };
                returnSupplier(supplierInfo.supplierId,function(notifyError,notifyResult){
                    if (notifyError) {
                        console.log("error in notify", error)
                        return res.redirect('back');
                    } 
                    if(notifyResult) {
                        notifydoc = notifyResult.notifications;
                        console.log("===================ifdoc==============", notifydoc);
                        console.log(supplierInfo)
                        console.log(buyerName)
                        console.log(supplierInfo);
                       return  res.render('supplier-manage-invoice', {
                            supplierInvoices: supplierInfo.invoices,
                            notifydoc: notifydoc,
                            accData: supplierInfo,
                            buyers: buyerName,
                            configData: configData
                        });
                        // res.render('supplier-po', {supplierInfo: supplierInfo,notifydoc:notifydoc,buyers:buyerName, accData: supplierInfo,configData:configData});
                        // res.render('supplier-po', {supplierInfo: supplierInfo,notifydoc:notifydoc,buyers:buyerName, accData: supplierInfo,configData:configData});
                    }
                    return res.redirect('back');
                })

            }
        });
    });
})

function renderWithBank(req, res, supplierInfo, notifydoc, buyerName, configData) {
    bankName = []
    if (supplierInfo.offers != null) {
        console.log(supplierInfo.offers.length);
        for (var i = 0; i < supplierInfo.offers.length; i++) {
            if (i == supplierInfo.offers.length - 1) {

                // console.log('result man-');
                //console.log(result);
                bankName.push(supplierInfo.offers[i].details.bankName);
                // console.log(i);
                // console.log(supplierInfo.offers.length);

                // console.log('bankers-');
                console.log("final", bankName);
                //getDinvBuyerSupplier(req,res,bankInfo,invoices,buyerName,supplierName);

                console.log('again checking');
                console.log(buyerName);
                res.render('supplier-manage-invoice', {
                    supplierInvoices: supplierInfo.invoices,
                    notifydoc: notifydoc,
                    buyers: buyerName,
                    accData: supplierInfo,
                    configData: configData,
                    banks: bankName
                });

                //return supplierName;


            } else {

                // console.log('result man-');
                // console.log(result);
                bankName.push(supplierInfo.offers[i].details.bankName);
                console.log(i);


            }

        }
    } else {
        //return supplierName;

        res.render('supplier-manage-invoice', {
            supplierInvoices: supplierInfo.invoices,
            notifydoc: notifydoc,
            buyers: buyerName,
            accData: supplierInfo,
            configData: configData
        });
    }


}

router.get('/view-po',function(req,res){
  name = req.session.username;
  org = req.session.orgname;

  QueryArgs = []
  fcn = "ReadAcc"
  console.log("==========REACHING FOR QUERY--1============", name, org, peers, fcn);
  query.queryChaincode(peers, config.channelName, config.chaincodeName, QueryArgs, fcn, name, org).then(function(dataSupplier) {
    var invoiceId=req.query.poid;
    var supplierInfo = JSON.parse(dataSupplier);
    if (supplierInfo.purchaseOrders!=null){
        for (var i=0;i<supplierInfo.purchaseOrders.length;i++){
            if (invoiceId==supplierInfo.purchaseOrders[i].orderId){
                var inv=supplierInfo.purchaseOrders[i];
                returnBuyer(supplierInfo.purchaseOrders[i].buyer,function(err,buyer){
                  if(err){
                    return res.redirect('back');
                  }
                    var d=date.parse(inv.date,'DD-MM-YYYY');
                    d1=date.format(d,'MMMM DD YYYY');
                    creditDate=date.addDays(d,inv.creditPeriod);
                    newCreditDate=date.format(creditDate,'MMMM DD YYYY');
                    notifydoc=buyer.notifications;
                   // getNotifications()
                   console.log(inv);
                       return res.render('view-po',{invoice:inv,notifydoc:notifydoc,buyer:buyer.BuyerName ,supplier:supplierInfo.supplierName,creditDate:newCreditDate,invoiceDate:d1,accData: supplierInfo,viewer:'supplier',configData:configData});
                     // return res.render('view-po',{invoice:inv,notifydoc:notifydoc,supplier:req.cookies.name,buyer:buyer.name,creditDate:newCreditDate,invoiceDate:d1,accData: supplierInfo,viewer:'supplier',configData:configData});
                });
            }
        }
    }
   



  });
})

function returnBuyer(id,func){
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
            return func(err,null)
        }
        if (result){
          return func(null,result)
        }
        })
      })
    }

router.get('/view-invoice',function(req,res){
    name = req.session.username;
    org = req.session.orgname;
  
    QueryArgs = []
    fcn = "ReadAcc"
    console.log("==========REACHING FOR QUERY--1============", name, org, peers, fcn);
    query.queryChaincode(peers, config.channelName, config.chaincodeName, QueryArgs, fcn, name, org).then(function(dataSupplier) {

    var invoiceId=''+req.query.poid;
    if (dataSupplier){
    var SupplierInfo = JSON.parse(dataSupplier);
    console.log(SupplierInfo);
    console.log('---------------------');
    console.log(invoiceId);
    console.log('---------------------');
    if (SupplierInfo.invoices!=null){
    for (var i=0;i<SupplierInfo.invoices.length;i++){
        console.log('coming here');
        if (invoiceId==SupplierInfo.invoices[i].invoiceId){
            console.log('coming here also');
            var inv=SupplierInfo.invoices[i];
            returnBuyer(SupplierInfo.invoices[i].buyer,function(err,buyer){
                if(err){
                    return res.redirect('back');
                  }
                var d=date.parse(inv.date,'DD-MM-YYYY');
                d1=date.format(d,'MMMM DD YYYY');
                creditDate=date.addDays(d,inv.purchaseOrders[0].creditPeriod);
                newCreditDate=date.format(creditDate,'MMMM DD YYYY');
                returnSupplier(SupplierInfo.supplierId,function(err,accData){
                    if(err){
                        return res.redirect('back');
                      }
                      if(accData){
                    notifydoc=accData.notifications
                        console.log(notifydoc);
                        invoiceTrail=[]//hardcoded for future use
                           return  res.render('view-invoice',{invoice:inv,notifydoc:notifydoc,invoiceTrail:invoiceTrail,accData:accData,supplier:req.cookies.name,buyer:buyer.name,creditDate:newCreditDate,invoiceDate:d1,viewer:'supplier',employee:buyer.employeeName,configData:configData});
                        
                      }
                      else{
                          res.redirect('back');
                      }
                });
            });
            
            console.log('outside');
            console.log(SupplierInfo.invoices[i]); 
            //res.render('view-invoice',{invoice:SupplierInfo.invoices[i]});
            

       }
    }
} else {
    console.log(SupplierInfo.invoices);
       return res.render('view-invoice',{configData:configData});
    }
}else {res.redirect('back');}
})
})



function returnSupplier(id,func){
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
                  return func(err,null)
              }
              if (result){
                return func(null,result)
              }
              })
            })
          
}
module.exports = router