package main

import (
	"strconv"
	"time"
	"crypto/sha256"
	//"reflect"

	"fmt"
	"crypto/x509"
	"encoding/hex"
	"encoding/json"
	"encoding/pem"

		"github.com/golang/protobuf/proto"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	mspprotos "github.com/hyperledger/fabric/protos/msp"
	pb "github.com/hyperledger/fabric/protos/peer"

)

//creating account for buyer
func (t *Supplychaincode) InitBuyer(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	//args[0]=
	if len(args) < 2 {
		return shim.Error("chaincode: Buyer:: InitBuyer::wrong number of arguments")
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

	buyerHash := sha256.Sum256([]byte(cert.Subject.CommonName + cert.Issuer.CommonName))
	buyerAddress := hex.EncodeToString(buyerHash[:])

	checkBuyerAsBytes, err := stub.GetState(buyerAddress)
	if err != nil || len(checkBuyerAsBytes) != 0 {
		return shim.Error(fmt.Sprintf("chaincode:Initsupplier::supplier already exist"))
	}
	var buyerAcc = buyer{}
	buyerAcc.BuyerId = buyerAddress
	buyerAcc.BuyerName = args[1]
	buyerAcc.EmployeeName = args[2]
	buyerAcc.EmailId = args[3]
	var orders []purchaseOrder
	var invoices []invoice
	var Dinvoices []disbursementInvoice
	buyerAcc.DInvoices = Dinvoices
	buyerAcc.Invoices = invoices
	buyerAcc.PurchaseOrders = orders
	buyerAsbytes, err := json.Marshal(buyerAcc)
	if err != nil {
		return shim.Error("chaincode: Buyer:: InitBuyer:couldnt marshal buyerAcc")
	}
	err = stub.PutState(buyerAcc.BuyerId, buyerAsbytes)
	if err != nil {
		return shim.Error("chaincode: Buyer:: InitBuyer:account initialization failed")
	}

	return shim.Success(nil)
}




//====================================initChecker=======================


func (t *Supplychaincode) InitChecker(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	
		//args[0]=buyerAddress
		//args[1]=checkerEmployeeName
		
		
		creator, err := stub.GetCreator()
		if err != nil {
			return shim.Error(fmt.Sprintf("chaincode:Initchecker::couldn't get creator"))
		}
		id := &mspprotos.SerializedIdentity{}
		err = proto.Unmarshal(creator, id)
	
		if err != nil {
			return shim.Error(fmt.Sprintf("chaincode:InitChecker::error unmarshalling"))
		}
	
		block, _ := pem.Decode(id.GetIdBytes())
		// if err !=nil {
		// 	return shim.Error(fmt.Sprintf("couldn decode"));
		// }
		cert, err := x509.ParseCertificate(block.Bytes)
		if err != nil {
			return shim.Error("chaincode:InitChecker::couldn parse ParseCertificate")
		}
	
		checkerHash := sha256.Sum256([]byte(cert.Subject.CommonName + cert.Issuer.CommonName))
		checkerAddress := hex.EncodeToString(checkerHash[:])
	
		checkCheckerAsBytes, err := stub.GetState(checkerAddress)
		if err != nil || len(checkCheckerAsBytes) != 0 {
			return shim.Error(fmt.Sprintf("chaincode:Initchecker::checker already exist"))
		}
	
		checkBuyerAsBytes,err:= stub.GetState(args[0])
		if err!=nil || len(checkBuyerAsBytes) ==0 {
			return shim.Error(fmt.Sprintf("chaincode:Initchecker::buyer dont exist"))
		}

		buyer:=buyer{}

		err=json.Unmarshal(checkBuyerAsBytes,&buyer);
		if err!=nil {
			return shim.Error(fmt.Sprintf("chaincode:Initchecker::couldnt unmarshal buyer"))
		}

		checker:=checker{};
		checker.CheckerId=checkerAddress;
		checker.BuyerName=buyer.BuyerName;
		checker.EmployeeName=args[1];
		checker.InvoiceList=buyer.Invoices;
		checker.BuyerId= args[0];
		checker.EmailId=cert.Subject.CommonName;

		buyer.Checker=checkerAddress;

		finalBuyerAsBytes,err:=json.Marshal(buyer);
		if err !=nil {
			return shim.Error(fmt.Sprintf("chaincode:Initchecker::couldnt marshal buyer"))
		}

		err=stub.PutState(args[0],finalBuyerAsBytes);
		if err !=nil {
			return shim.Error(fmt.Sprintf("chaincode:Initchecker::couldnt putstate buyer"))
		}

		finalCheckerAsBytes,err:=json.Marshal(checker);
		if err !=nil {
			return shim.Error(fmt.Sprintf("chaincode:Initchecker::couldnt unmarshal checker"))
		}

		err=stub.PutState(checkerAddress,finalCheckerAsBytes);
		if err !=nil {
			return shim.Error(fmt.Sprintf("chaincode:Initchecker::couldnt Putstate checker"))
		}


	return shim.Success(nil);
	
	
	
	}
	
	


//========================CreatePO============================

func (t *Supplychaincode) CreatePO(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	//args[0]=poID
	
	
	//args[1]=SupplierAddress
	//args[2]=CreditPeriod
	//args[3]=file hash
	//args[4]=totalvalue

	//ignore below replaced with the getState data
	//args[4]=buyerAdd
	//args[5]=SupplierName
	//args[6]=BuyerName
	
	
	if len(args)!=5 {
		return shim.Error("chaincode: Buyer:: CreatePO:wrong number of arguments")
	}

	creator, err := stub.GetCreator()
	if err != nil {
		return shim.Error(fmt.Sprintf("chaincode: Buyer:: CreatePO::couldn't get creator"))
	}
	id := &mspprotos.SerializedIdentity{}
	err = proto.Unmarshal(creator, id)

	if err != nil {
		return shim.Error(fmt.Sprintf("chaincode: Buyer:: CreatePO::error unmarshalling"))
	}

	block, _ := pem.Decode(id.GetIdBytes())
	// if err !=nil {
	// 	return shim.Error(fmt.Sprintf("couldn decode"));
	// }
	cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return shim.Error("chaincode: Buyer:: CreatePO::couldn pasre ParseCertificate")
	}

	invokerHash := sha256.Sum256([]byte(cert.Subject.CommonName + cert.Issuer.CommonName))
	buyerAddress := hex.EncodeToString(invokerHash[:])

	checkBuyerAsBytes, err := stub.GetState(buyerAddress)
	if err != nil || len(checkBuyerAsBytes) == 0 {
		return shim.Error(fmt.Sprintf("chaincode: Buyer:: CreatePO::buyer doesnt exist"))
	}





	order := purchaseOrder{}

	

	purchaseId := args[0]
	//numOfProducts, _ := strconv.Atoi(args[1])
	currentTime := time.Now().Local()
	order.Date = currentTime.Format("02-01-2006")
	order.Time = currentTime.Format("3:04PM")
	order.OrderId = purchaseId


	order.Supplier = args[1]//supplierAddress

	//order.TotalValue = total
	//i = i + 1
	order.CreditPeriod, _ = strconv.Atoi(args[2])
	//i = i + 1
	order.Buyer = buyerAddress
	order.Status = "processing"
	//i++
	order.Hash = args[3]
	//i++
	// order.SupplierName = args[5]
	//i++
	//order.BuyerName = args[6]

	transaction:=transactions{}
	transaction.TxId=stub.GetTxID()
	if len(transaction.TxId)==0{
		return shim.Error("chaincode: Buyer:: CreatePO::couldnt set the transaction Id ")
	}
	samay := time.Now().Local()
	transaction.Timestamp=samay.Format("02-01-2006")+"-"+samay.Format("3:04PM")
	transaction.Message="PO Generated"
	order.TransactionHistory=append(order.TransactionHistory,transaction);

	buyerAsbytes, _ := stub.GetState(order.Buyer)
	supplierAsbytes, _ := stub.GetState(order.Supplier)
	buyerAcc := buyer{}
	supplierAcc := supplier{}
	err = json.Unmarshal(buyerAsbytes, &buyerAcc)
	if err != nil {
			return shim.Error("chaincode::buyer:CreatePO::unamrshalling error buyer")
		}

		order.BuyerName = buyerAcc.BuyerName;



	err = json.Unmarshal(supplierAsbytes, &supplierAcc)
	if err != nil {
			return shim.Error("chaincode::buyer:CreatePO::unamrshalling error supplier")
		}

		order.SupplierName = supplierAcc.SupplierName;
		order.TotalValue,err =  strconv.ParseFloat(args[4], 64)
		
		
		

	buyerAcc.PurchaseOrders = append(buyerAcc.PurchaseOrders, order)
	supplierAcc.PurchaseOrders = append(supplierAcc.PurchaseOrders, order)

	buyerAsNewbytes, err := json.Marshal(buyerAcc)
	if err != nil {
			return shim.Error("chaincode::buyer:CreatePO::marshalling error for buyer")
		}


		


	supplierAsNewbytes, err := json.Marshal(supplierAcc)
	if err != nil {
			return shim.Error("chaincode::buyer:CreatePO::unamrshalling error supplierAcc")
		}
	err = stub.PutState(order.Buyer, buyerAsNewbytes)
	if err != nil {
			return shim.Error("chaincode::buyer:CreatePO::PutState error")
		}
	err = stub.PutState(order.Supplier, supplierAsNewbytes)
	if err != nil {
			return shim.Error("chaincode::buyer:CreatePO::Putstate error")
		}

	// if err != nil {
	// 	return nil, err
	// }
	return shim.Success(nil);
}

func (t *Supplychaincode) UpdateInvoiceStatus(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	
	//args[0]=invoiceId
	//args[1]=status

											//args[0]=buyerId    obtained by certificates dont need

	if len(args) != 2 {
		return shim.Error("chaincode::buyer:UpdateInvoiceStatus: wrong number of arguments")
	}

	creator, err := stub.GetCreator()
	if err != nil {
		return shim.Error(fmt.Sprintf("chaincode: Buyer:: UpdateInvoiceStatus::couldn't get creator"))
	}
	id := &mspprotos.SerializedIdentity{}
	err = proto.Unmarshal(creator, id)

	if err != nil {
		return shim.Error(fmt.Sprintf("chaincode: Buyer:: UpdateInvoiceStatus::error unmarshalling"))
	}

	block, _ := pem.Decode(id.GetIdBytes())
	// if err !=nil {
	// 	return shim.Error(fmt.Sprintf("couldn decode"));
	// }
	cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return shim.Error("chaincode: Buyer:: UpdateInvoiceStatus::couldn pasre ParseCertificate")
	}

	invokerHash := sha256.Sum256([]byte(cert.Subject.CommonName + cert.Issuer.CommonName))
	buyerAddress := hex.EncodeToString(invokerHash[:])

	buyerAsbytes, err := stub.GetState(buyerAddress)
	if err != nil || len(buyerAsbytes) == 0 {
		return shim.Error(fmt.Sprintf("chaincode: Buyer:: UpdateInvoiceStatus::buyer doesnt exist"))
	}




	var supplierId string
	buyerId := buyerAddress;
	invoiceId := args[0]
	status := args[1]
	buyerAcc := buyer{}
	inv := invoice{}
	supplierAcc := supplier{}
	// buyerAsbytes, err := stub.GetState(buyerId)
	// if err != nil {
	// 		return shim.Error("chaincode::buyer:UpdateInvoiceStatus::couldnt GetState")
	// 	}
	err = json.Unmarshal(buyerAsbytes, &buyerAcc)
	if err != nil {
			return shim.Error("chaincode::buyer:UpdateInvoiceStatus::unamrshalling error")
		}

	for i := range buyerAcc.Invoices {
		if invoiceId == buyerAcc.Invoices[i].InvoiceId {
			supplierId = buyerAcc.Invoices[i].Supplier
			buyerAcc.Invoices[i].Status = status
			transaction:=transactions{}
			transaction.TxId=stub.GetTxID()
			if len(transaction.TxId)==0{
				return shim.Error("chaincode: Buyer:: UpdateInvoiceStatus::couldnt set the transaction Id ")
			}
			samay:=time.Now().Local();
			transaction.Timestamp=samay.Format("02-01-2006")+"-"+samay.Format("3:04PM")
			transaction.Message="Status updated to "+status;
			buyerAcc.Invoices[i].TransactionHistory=append(buyerAcc.Invoices[i].TransactionHistory,transaction);
			inv = buyerAcc.Invoices[i]
		}
	}
	newBuyerAsbytes, err := json.Marshal(buyerAcc)
	if err != nil {
			return shim.Error("chaincode::buyer:UpdateInvoiceStatus::marshalling error")
		}
	err = stub.PutState(buyerId, newBuyerAsbytes)
	if err != nil {
			return shim.Error("chaincode::buyer:UpdateInvoiceStatus::coukldnt PutState buyer")
		}
	supplierAsbytes, err := stub.GetState(supplierId)
	if err != nil {
			return shim.Error("chaincode::buyer:UpdateInvoiceStatus:: couldnt get supplier")
		}
	err = json.Unmarshal(supplierAsbytes, &supplierAcc)
	if err != nil {
			return shim.Error("chaincode::buyer:UpdateInvoiceStatus::Unmarshalling error supplier")
		}
	for i := range supplierAcc.Invoices {
		if invoiceId == supplierAcc.Invoices[i].InvoiceId {
			transaction:=transactions{}
			transaction.TxId=stub.GetTxID()
			if len(transaction.TxId)==0{
				return shim.Error("chaincode: Buyer:: UpdateInvoiceStatus::couldnt set the transaction Id ")
			}
			samay:=time.Now().Local();
			transaction.Timestamp=samay.Format("02-01-2006")+"-"+samay.Format("3:04PM")
			transaction.Message="Status updated to "+status;
			supplierAcc.Invoices[i].TransactionHistory=append(supplierAcc.Invoices[i].TransactionHistory,transaction);
			supplierAcc.Invoices[i].Status = status

		}
	}
	newSupplierAsbytes, err := json.Marshal(supplierAcc)
	if err != nil {
			return shim.Error("chaincode::buyer:UpdateInvoiceStatus::Unmarshalling Supplier")
		}
	err = stub.PutState(supplierId, newSupplierAsbytes)
	if err != nil {
			return shim.Error("chaincode::buyer:UpdateInvoiceStatus::PutState error")
		}
	if status == "approved" {
		var bankInvoices []invoice
		bankInvoicesAsbytes, err := stub.GetState(bankInvoicesKey)
		if err != nil {
			return shim.Error("chaincode::buyer:UpdateInvoiceStatus::couldnt get bankInvoicearray error")
		}
		err = json.Unmarshal(bankInvoicesAsbytes, &bankInvoices)
		if err != nil {
			return shim.Error("chaincode::buyer:UpdateInvoiceStatus::Unmarshalling error")
		}
		bankInvoices = append(bankInvoices, inv)
		newBankInvoicesAsbytes, err := json.Marshal(bankInvoices)
		if err != nil {
			return shim.Error("chaincode::buyer:UpdateInvoiceStatus::marshal error bankInvoices")
		}
		err = stub.PutState(bankInvoicesKey, newBankInvoicesAsbytes)
		if err != nil {
			return shim.Error("chaincode::buyer:UpdateInvoiceStatus::Couldnt Putstate  bankInvoices")
		}
	}
	/*var banks []bank
	banks = t.readAllBankers(stub, args)
	for i := range bank {
		banks[i].Invoices = append(banks[i].Invoices, inv)
	}*/
	return shim.Success(nil)
}



