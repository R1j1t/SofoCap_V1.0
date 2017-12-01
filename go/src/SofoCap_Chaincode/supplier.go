package main

import (
	"crypto/sha256"
	"crypto/x509"
	"encoding/hex"
	"encoding/json"
	"encoding/pem"
	//"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/golang/protobuf/proto"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	mspprotos "github.com/hyperledger/fabric/protos/msp"
	pb "github.com/hyperledger/fabric/protos/peer"

)

//==============================initialization supplier=================
func (t *Supplychaincode) InitSupplier(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	//args[0]=SupplierName
	//args[1]=EmailId
	//args[2]=Role
	//args[3]=Department
	//args[4]=EmployeeName
	if len(args) != 5 {
		return shim.Error(fmt.Sprintf("chaincode:Initsupplier: wrong number of arguments expecting 5 "))
	}

	creator, err := stub.GetCreator()
	if err != nil {
		return shim.Error(fmt.Sprintf("chaincode:Initsupplier::couldn't get creator"))
	}
	id := &mspprotos.SerializedIdentity{}
	err = proto.Unmarshal(creator, id)

	if err != nil {
		return shim.Error(fmt.Sprintf("chaincode:Initsupplier::error unmarshalling"))
	}

	block, _ := pem.Decode(id.GetIdBytes())
	// if err !=nil {
	// 	return shim.Error(fmt.Sprintf("couldn decode"));
	// }
	cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return shim.Error("chaincode:Initsupplier::couldn pasre ParseCertificate")
	}

	supplierHash := sha256.Sum256([]byte(cert.Subject.CommonName + cert.Issuer.CommonName))
	supplierAddress := hex.EncodeToString(supplierHash[:])

	checksupplierAsBytes, err := stub.GetState(supplierAddress)
	if err != nil || len(checksupplierAsBytes) != 0 {
		return shim.Error(fmt.Sprintf("chaincode:Initsupplier::supplier already exist"))
	}
	
	var supplierAcc = supplier{}
	supplierAcc.SupplierId = supplierAddress
	supplierAcc.SupplierName = args[0]
	supplierAcc.EmployeeName = args[4]
	supplierAcc.EmailId = args[1]
	supplierAcc.Type = args[2]       //role
	supplierAcc.Affilation = args[3] //department
	var orders []purchaseOrder
	var invoices []invoice
	supplierAcc.Invoices = invoices
	supplierAcc.PurchaseOrders = orders
	supplierAsbytes, err := json.Marshal(supplierAcc)
	err = stub.PutState(supplierAddress, supplierAsbytes)
	if err != nil {
		return shim.Error(fmt.Sprintf("chaincode:Initsupplier:: account initialization failed  %s ",err))
	}
	var supplierList []string
	listAsbytes, _ := stub.GetState(supplierIdIndices)
	err = json.Unmarshal(listAsbytes, &supplierList)
	if err != nil {
		return shim.Error(fmt.Sprintf("chaincode:Initsupplier: Unmarshaling error  %s ",err))
	}
	supplierList = append(supplierList, supplierAddress)
	newListAsbytes, err := json.Marshal(supplierList)
	err = stub.PutState(supplierIdIndices, newListAsbytes)
	if err != nil {
		return shim.Error(fmt.Sprintf("chaincode:Initsupplier:error:putState supplier failed %s",err))
	}
	return shim.Success(nil)
}

//==========================updatePOStatus=============================

func (t *Supplychaincode) UpdatePOStatus (stub shim.ChaincodeStubInterface, args []string) pb.Response {

	//args[0]=poId
	//args[1]=status
	if len(args) != 2 {
		return shim.Error(fmt.Sprintf("chaincode:UpdatePOStatus:A06 wrong number of arguments"))
	}
	POid := args[0]
	creator, err := stub.GetCreator()
	if err != nil {
		return shim.Error(fmt.Sprintf("chaincode:UpdatePOStatus::couldn't get creator"))
	}
	id := &mspprotos.SerializedIdentity{}
	err = proto.Unmarshal(creator, id)

	if err != nil {
		return shim.Error(fmt.Sprintf("chaincode:UpdatePOStatus::error unmarshalling"))
	}

	block, _ := pem.Decode(id.GetIdBytes())
	// if err !=nil {
	// 	return shim.Error(fmt.Sprintf("couldn decode"));
	// }
	cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return shim.Error("chaincode:UpdatePOStatus::couldn pasre ParseCertificate")
	}

	supplierHash := sha256.Sum256([]byte(cert.Subject.CommonName + cert.Issuer.CommonName))
	supplierAddress := hex.EncodeToString(supplierHash[:])

	checksupplierAsBytes, err := stub.GetState(supplierAddress)
	if err != nil || len(checksupplierAsBytes) == 0 {
		return shim.Error(fmt.Sprintf("chaincode:UpdatePOStatus::supplier dont exist"))
	}







	supplierId := supplierAddress
	status := args[1]
	var buyerId string
	supplierAcc := supplier{}
	supplierAsbytes, err := stub.GetState(supplierId)
	if err != nil {
		return shim.Error("chaincode:supplier:UpdatePOStatus::getState supplier failed")
	}
	err = json.Unmarshal(supplierAsbytes, &supplierAcc)
	if err != nil {
		return shim.Error("chaincode:supplier:UpdatePOStatus:: unmashalling error")
	}
	for i := range supplierAcc.PurchaseOrders {
		if supplierAcc.PurchaseOrders[i].OrderId == POid {
			supplierAcc.PurchaseOrders[i].Status = status
			buyerId = supplierAcc.PurchaseOrders[i].Buyer
			break;

		}

	}
	supplierAsNewbytes, err := json.Marshal(supplierAcc)
	if err != nil {
		return shim.Error("chaincode:supplier:UpdatePOStatus:: marshalling error")
	}
	err = stub.PutState(supplierId, supplierAsNewbytes)

	buyerAcc := buyer{}
	buyerAsBytes, err := stub.GetState(buyerId)
	if err != nil {
		return shim.Error("chaincode:supplier:UpdatePOStatus:: wrong buyer ID")
	}
	err = json.Unmarshal(buyerAsBytes, &buyerAcc)
	if err != nil {
		return shim.Error("chaincode:supplier:UpdatePOStatus::buyer unmshalling error")
	}
	for i := range buyerAcc.PurchaseOrders {
		if buyerAcc.PurchaseOrders[i].OrderId == POid {
			buyerAcc.PurchaseOrders[i].Status = status
		}
	}
	buyerAsNewbytes, err := json.Marshal(buyerAcc)
	if err != nil {
		return shim.Error("chaincode:supplier:UpdatePOStatus:: couldnt put marshal buyer")
	}
	err = stub.PutState(buyerId, buyerAsNewbytes)
	if err != nil {
		return shim.Error("chaincode:supplier:UpdatePOStatus:: couldnt put state buyer")
	}
	return shim.Success(nil)
}

//======================================GenerateInvoice==================================

func (t *Supplychaincode) GenerateInvoice(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	//args[0]=invoiceID
	//args[1]=poID
	//args[2]=creditPeriod
	//args[3]=buyerAddress
	//args[4]=invoiceTaxes
	//args[5]=subtotal
	//args[6]=invoiceHash
	
if len(args) < 6 {
		return shim.Error("error:A07 wrong number of arguments")
	}

	Hash:=args[6];
	hash,err:=stub.GetState(Hash);
	if err!=nil{
		return shim.Error("chaincode:Supplier:GenerateInvoice:couldnt getsState invoice Hash")
	}
	if len(hash)!=0{
		return shim.Error("chaincode:Supplier:GenerateInvoice:invoiceAlreadyExist")
	}
	
	


	creator, err := stub.GetCreator()
	if err != nil {
		return shim.Error(fmt.Sprintf("chaincode:Supplier:GenerateInvoice:couldn't get creator"))
	}
	id := &mspprotos.SerializedIdentity{}
	err = proto.Unmarshal(creator, id)

	if err != nil {
		return shim.Error(fmt.Sprintf("chaincode:Supplier:GenerateInvoice::error unmarshalling"))
	}

	block, _ := pem.Decode(id.GetIdBytes())
	// if err !=nil {
	// 	return shim.Error(fmt.Sprintf("couldn decode"));
	// }
	cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return shim.Error("chaincode:Supplier:GenerateInvoice::couldn pasre ParseCertificate")
	}

	invokerHash := sha256.Sum256([]byte(cert.Subject.CommonName + cert.Issuer.CommonName))
	supplierAddress := hex.EncodeToString(invokerHash[:])

	checkSupplierAsBytes, err := stub.GetState(supplierAddress)
	if err != nil || len(checkSupplierAsBytes) == 0 {
		return shim.Error(fmt.Sprintf("chaincode:Supplier:GenerateInvoice::client don't exist"))
	}

	supplierAcc:=supplier{};
//var err error

err=json.Unmarshal(checkSupplierAsBytes,&supplierAcc)
if err!=nil {
	return shim.Error("chaincode:Supplier:GenerateInvoice:error unmarshalling supplier")
}

InvoiceHash:=invoiceHash{};

	InvoiceHash.Hash=Hash;
	InvoiceHash.SupplierId=supplierAddress
	InvoiceHash.InvoiceId=args[0]

	invoiceAsBytes,err:=json.Marshal(InvoiceHash);
	if err!=nil{
		return shim.Error("chaincode:Supplier:GenerateInvoice:couldnt marshal invoices")
	}
	err=stub.PutState(Hash,invoiceAsBytes);
	if err !=nil {
		return shim.Error("chaincode:Supplier:GenerateInvoice::error writing the ledger  invoicesHash")
	}



	
	invoiceId := args[0]

	inv := invoice{}

	order := purchaseOrder{}

	purchaseId := args[1]
	i:=0;
	flag:=0
	for i=0;i<len(supplierAcc.PurchaseOrders);i++ {
		if supplierAcc.PurchaseOrders[i].OrderId == purchaseId {
			flag=1;
			break;
		}
	}
	//numOfProducts, _ := strconv.Atoi(args[2])
	currentTime := time.Now().Local()
	if flag==1{
	order=supplierAcc.PurchaseOrders[i];
	} else{
		 return shim.Error("chaincode:Supplier:GenerateInvoice::couldnt find the P.O. with the provided ID")
	}
	//order.Date = currentTime.Format("02-01-2006")
	//order.OrderId = purchaseId
	//var i int = 3
	//var total float64
	//var products []product
	// for i = 3; i < numOfProducts+3; i++ {
	// 	pro := product{}
	// 	err := json.Unmarshal([]byte(args[i]), &pro)
	// 	if err != nil {
	// 		return shim.Error("error:U04 error unmarshalling")
	// 	}

	// 	total = total + pro.Value
	// 	products = append(products, pro)

	// }
	//order.Products = products


	



	//order.Supplier = supplierAddress
	inv.Supplier = supplierAddress
	// order.TotalValue = total
	// i = i + 1
	//order.CreditPeriod, _ = strconv.Atoi(args[2])
	//i = i + 1
		buyerDataAsBytes,err:=stub.GetState(args[3]);
		if err!=nil {
			return shim.Error("chaincode:Supplier:GenerateInvoice:couldnt get the buyer ")
		
		}

		buyerAcc:=buyer{};

		err=json.Unmarshal(buyerDataAsBytes,&buyerAcc);
		if err !=nil {
			return shim.Error("chaincode:Supplier:GenerateInvoice:error unmarshalling the buyer");
		}


	//order.Buyer = args[3]
	inv.Buyer = args[3]
	//order.Status = "processing"

	//i = i + 1
	// total,err:=strconv.ParseInt(args[5]);
	// if err !=nil {
	// 	return shim.Error("the total i.e. args[5] should be an integer type ")
	// }
	inv.Taxes, err = strconv.ParseFloat(args[4], 64)
	if err !=nil {
		return shim.Error("the taxes i.e. args[4] should be a number ")
	}
	inv.Subtotal,err =strconv.ParseFloat(args[5], 64)
	if err !=nil {
		return shim.Error("the total i.e. args[5] should be a number")
	}
	inv.Total =inv.Subtotal+ inv.Subtotal*inv.Taxes/100
	  
	inv.PurchaseOrders = append(inv.PurchaseOrders, order)
	inv.InvoiceId = invoiceId
	inv.Status = "in process"
	currentT := time.Now().Local()
	inv.Date = currentT.Format("02-01-2006")
	inv.Time = currentTime.Format("3:04PM")
	inv.Type = "indirect"
	//i++
	inv.Hash = args[6]
	//i++
	inv.SupplierName = supplierAcc.SupplierName;
	//i++
	inv.BuyerName = buyerAcc.BuyerName;

	invAsbytes, err := json.Marshal(inv)
	if err != nil {
		return shim.Error("chaincode:supplier:GenerateInvoice::couldnt marshal invoice")
	}
	// err= stub.PutState("checkI", []byte(invoiceId))
	// if err != nil {
	// 	return shim.Error("chaincode:supplier:GenerateInvoice:couldnt write state")
	// }
	err = stub.PutState(invoiceId, invAsbytes)
	if err != nil {
		return shim.Error("chaincode:supplier:GenerateInvoice:couldnt write state")
	}
	// buyerAcc := buyer{}
	// buyerAsbytes, err := stub.GetState(inv.Buyer)
	// if err != nil {
	// 	return shim.Error("chaincode:supplier:GenerateInvoice:couldnt get Buyer")
	// }
	// err = json.Unmarshal(buyerAsbytes, &buyerAcc)
	buyerAcc.Invoices = append(buyerAcc.Invoices, inv)
	newBuyerAsbytes, err := json.Marshal(buyerAcc)
	err = stub.PutState(inv.Buyer, newBuyerAsbytes)

	// supplierAcc := supplier{}
	// supplierAsbytes, err := stub.GetState(inv.Supplier)
	// err = json.Unmarshal(supplierAsbytes, &supplierAcc)
	supplierAcc.Invoices = append(supplierAcc.Invoices, inv)
	newSupplierAsbytes, err := json.Marshal(supplierAcc)
	err = stub.PutState(inv.Supplier, newSupplierAsbytes)

	if err != nil {
		return shim.Error("chaincode:supplier:GenerateInvoice:error during PutState")
	}
	return shim.Success(nil)
}

//========================UploadApprovedInvoice =======================================

func (t *Supplychaincode) UploadApprovedInvoice(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 12 {
		return shim.Error("chaincode:supplier:UploadApprovedInvoice::wrong number of arguments")
	}
	supplierId := args[0]
	invoiceId := args[1]
	poId := args[2]
	poDate := args[3]
	buyer := args[4]
	POValue, err := strconv.ParseFloat(args[5], 64)
	if err != nil {
		return shim.Error("chaincode:supplier:UploadApprovedInvoice:::expected float value parsing arg[5]")
	}
	creditPeriod, err := strconv.Atoi(args[6])
	if err != nil {
		return shim.Error("chaincode:supplier:UploadApprovedInvoice::expected integer value args[6]")
	}
	invoiceDate := args[7]
	invoiceSubTotal, err := strconv.ParseFloat(args[8], 64)
	if err != nil {
		return shim.Error("chaincode:supplier:UploadApprovedInvoice::expected float value args[8]")
	}
	invoiceRate, err := strconv.ParseFloat(args[9], 64)
	if err != nil {
		return shim.Error("chaincode:supplier:UploadApprovedInvoice::expected float value args[9]")
	}
	fmt.Println(creditPeriod, invoiceDate, invoiceSubTotal, invoiceRate, poId, poDate, buyer, POValue, creditPeriod, invoiceId)

	order := purchaseOrder{}
	order.Buyer = buyer
	order.CreditPeriod = creditPeriod
	order.Date = poDate
	order.OrderId = poId
	order.Supplier = supplierId
	order.TotalValue = POValue
	order.Hash = args[11]

	inv := invoice{}
	inv.InvoiceId = invoiceId
	inv.PurchaseOrders = append(inv.PurchaseOrders, order)
	inv.Subtotal = invoiceSubTotal
	inv.Taxes = invoiceRate
	inv.Date = invoiceDate
	inv.Total = invoiceSubTotal + inv.Subtotal*inv.Taxes/100
	inv.Supplier = supplierId
	inv.Buyer = buyer
	currentT := time.Now().Local()
	inv.Time = currentT.Format("3:04PM")
	inv.Status = "approved"
	inv.Type = "direct"
	inv.Hash = args[10]

	invAsbytes, err := json.Marshal(inv)
	if err != nil {
		return shim.Error("chaincode:supplier:UploadApprovedInvoice::couldnt marshal invoice")
	}
	err = stub.PutState(invoiceId, invAsbytes)

	if err != nil {
		return shim.Error("chaincode:supplier:UploadApprovedInvoice::can't PutState invoice")
	}

	var bankInvoices []invoice
	bankInvoicesAsbytes, err := stub.GetState(bankInvoicesKey)

	if err != nil {
		return shim.Error("chaincode:supplier:UploadApprovedInvoice::couldnt GetState invoice")
	}

	err = json.Unmarshal(bankInvoicesAsbytes, &bankInvoices)

	if err != nil {
		return shim.Error("chaincode:supplier:UploadApprovedInvoice::couldnt GetState invoice")
	}

	bankInvoices = append(bankInvoices, inv)
	newBankInvoicesAsbytes, _ := json.Marshal(bankInvoices)
	err = stub.PutState(bankInvoicesKey, newBankInvoicesAsbytes)
	if err != nil {
		if err != nil {
			return shim.Error("chaincode:supplier:UploadApprovedInvoice::couldnt GetState invoice")
		}
	}
	supplierAcc := supplier{}
	supplierAsbytes, _ := stub.GetState(supplierId)
	err = json.Unmarshal(supplierAsbytes, &supplierAcc)
	if err != nil {
		return shim.Error("chaincode:supplier:UploadApprovedInvoice::expected float value")
	}
	supplierAcc.Invoices = append(supplierAcc.Invoices, inv)

	newSupplierAsbytes, err := json.Marshal(supplierAcc)
	if err != nil {
		return shim.Error("chaincode:supplier:UploadApprovedInvoice::couldnt marshal supplierAcc")
	}

	err = stub.PutState(supplierId, newSupplierAsbytes)
	if err != nil {
		return shim.Error("chaincode:supplier:UploadApprovedInvoice::couldnt PutState supplier")
	}

	return shim.Success(nil)
}

//============================================UpdateOfferStatus=======================

func (t *Supplychaincode) UpdateOfferStatus(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 3 {
		return shim.Error("chaincode:supplier:UpdateOfferStatus:expected 3 args")
	}
	supplierId := args[0]
	offerId := args[1]
	status := args[2]
	var bankId string
	var supplierAcc supplier
	supplierAsbytes, err := stub.GetState(supplierId)
	if err != nil {
		return shim.Error("chaincode:supplier:UpdateOfferStatus:couldnt get supplier")
	}
	err = json.Unmarshal(supplierAsbytes, &supplierAcc)
	if err != nil {
		return shim.Error("chaincode:supplier:UpdateOfferStatus:couldnt unmarshal supplier")
	}
	var invoiceId string
	for i := range supplierAcc.Offers {
		if supplierAcc.Offers[i].Id == offerId {
			supplierAcc.Offers[i].Status = status
			bankId = supplierAcc.Offers[i].Details.Bank
			invoiceId = supplierAcc.Offers[i].Details.Details.InvoiceId
		}
	}
	if status == `approved` {
		var bankIds []string
		for z := range supplierAcc.Offers {
			if supplierAcc.Offers[z].Details.Details.InvoiceId == invoiceId && supplierAcc.Offers[z].Id != offerId {
				supplierAcc.Offers[z].Status = `rejected`
				bankIds = append(bankIds, supplierAcc.Offers[z].Details.Bank)
			}
		}

		for x := range bankIds {
			localBankAcc := bank{}
			localBankAsbytes, _ := stub.GetState(bankIds[x])
			e := json.Unmarshal(localBankAsbytes, &localBankAcc)
			if e != nil {
				return shim.Error("chaincode:supplier:UpdateOfferStatus:couldnt unmarshal bank")
			}
			for c := range localBankAcc.Offers {
				if localBankAcc.Offers[c].Details.Details.InvoiceId == invoiceId {
					localBankAcc.Offers[c].Status = `rejected`
				}
			}
			newLocalBankAsbytes, err := json.Marshal(localBankAcc)
			if err != nil {
				return shim.Error("chaincode:supplier:UpdateOfferStatus:couldnt unmarshal localBankACC")
			}
			err = stub.PutState(bankIds[x], newLocalBankAsbytes)
			if err != nil {
				return shim.Error("chaincode:supplier:UpdateOfferStatus:couldnt putState localBankACC")
			}
		}
	}
	newSupplierAsbytes, err := json.Marshal(supplierAcc)
	if err != nil {
		return shim.Error("chaincode:supplier:UpdateOfferStatus:couldnt Marshal localBankACC")
	}
	err = stub.PutState(supplierId, newSupplierAsbytes)

	if err != nil {
		return shim.Error("chaincode:supplier:UpdateOfferStatus:couldnt putstate supplier")
	}

	var bankAcc bank
	bankAsbytes, err := stub.GetState(bankId)
	if err != nil {
		return shim.Error("chaincode:supplier:UpdateOfferStatus:couldnt get Bank")
	}
	err = json.Unmarshal(bankAsbytes, &bankAcc)

	if err != nil {
		return shim.Error("chaincode:supplier:UpdateOfferStatus:couldnt Unmarshal BankACC")
	}

	for i := range bankAcc.Offers {
		if bankAcc.Offers[i].Id == offerId {
			bankAcc.Offers[i].Status = status
		}
	}

	newBankAsbytes, err := json.Marshal(bankAcc)

	if err != nil {
		return shim.Error("chaincode:supplier:UpdateOfferStatus:couldnt Marshal BankACC")
	}

	err = stub.PutState(bankId, newBankAsbytes)

	if err != nil {
		return shim.Error("chaincode:supplier:UpdateOfferStatus:couldnt PutState newBankAsbytes")
	}

	if status == `approved` {
		var invoiceStack []invoice
		invoiceStackAsbytes, err := stub.GetState(bankInvoicesKey)
		if err != nil {
			return shim.Error("chaincode:supplier:UpdateOfferStatus:couldnt get invoiceStack")
		}
		err = json.Unmarshal(invoiceStackAsbytes, &invoiceStack)
		if err != nil {
			return shim.Error("chaincode:supplier:UpdateOfferStatus:couldnt Unmarshal invoice stack")
		}
		for invoiceIndex := range invoiceStack {
			if invoiceStack[invoiceIndex].InvoiceId == invoiceId {
				invoiceStack[invoiceIndex].Status = `completed`
			}
		}
		newInvoiceStackAsbytes, err := json.Marshal(invoiceStack)
		if err != nil {
			return shim.Error("chaincode:supplier:UpdateOfferStatus:couldnt Marshal INvoice stack")
		}
		err = stub.PutState(bankInvoicesKey, newInvoiceStackAsbytes)
		if err != nil {
			return shim.Error("chaincode:supplier:UpdateOfferStatus:couldnt Putstate Invoice stack")
		}
	}
	return shim.Success(nil)
}

//========================================AddBuyerToList=================================

func (t *Supplychaincode) AddBuyerToList(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 6 {
		return shim.Error("chaincode:supplier:AddBuyerToList::wrong number of arguments")
	}
	supplierId := args[0]
	BuyerId := args[1]
	BuyerName := args[2]
	EmailId := args[3]
	EmployeeName := args[4]
	PhoneNo := args[5]

	var SBuyer SuppliersBuyer
	SBuyer.BuyerId = BuyerId
	SBuyer.BuyerName = BuyerName
	SBuyer.EmailId = EmailId
	SBuyer.EmployeeName = EmployeeName
	SBuyer.PhoneNo = PhoneNo
	supplierAcc := supplier{}
	supplierAsBytes, err := stub.GetState(supplierId)
	if err != nil {
		return shim.Error("chaincode:supplier:AddBuyerToList::supplier not found")
	}
	err = json.Unmarshal(supplierAsBytes, &supplierAcc)
	if err != nil {
		return shim.Error("chaincode:supplier:AddBuyerToList:: couldnt unmarshal supplier")
	}
	supplierAcc.Buyers = append(supplierAcc.Buyers, SBuyer)

	newSupplierAsBytes, err := json.Marshal(supplierAcc)
	if err != nil {
		return shim.Error("chaincode:supplier:AddBuyerToList:: couldnt supplier")
	}
	err = stub.PutState(supplierId, newSupplierAsBytes)
	if err != nil {
		return shim.Error("chaincode:supplier:AddBuyerToList:: couldnt marshal supplier")
	}
	return shim.Success(nil)
}
