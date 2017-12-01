package main

import (
	"encoding/json"
	"fmt"
	"strconv"
	"crypto/sha256"
	//"reflect"
	"crypto/x509"
	"encoding/hex"
	
	"encoding/pem"
	"time"

	"github.com/golang/protobuf/proto"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	mspprotos "github.com/hyperledger/fabric/protos/msp"
	pb "github.com/hyperledger/fabric/protos/peer"
)

//==============================InitBank===========================================

func (t *Supplychaincode) InitBank(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	//args[0]=BankName
	//args[1]=EmployeeName
	


	if len(args) < 2 {
		return shim.Error("chaincode:bank:InitBank::wrong number of arguments")
	}

		creator, err := stub.GetCreator()
	if err != nil {
		return shim.Error(fmt.Sprintf("chaincode:InitBank::couldn't get creator"))
	}
	id := &mspprotos.SerializedIdentity{}
	err = proto.Unmarshal(creator, id)

	if err != nil {
		return shim.Error(fmt.Sprintf("chaincode:InitBank::error unmarshalling"))
	}

	block, _ := pem.Decode(id.GetIdBytes())
	// if err !=nil {
	// 	return shim.Error(fmt.Sprintf("couldn decode"));
	// }
	cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return shim.Error("chaincode:InitBank::couldn parse ParseCertificate")
	}

	bankHash := sha256.Sum256([]byte(cert.Subject.CommonName + cert.Issuer.CommonName))
	bankAddress := hex.EncodeToString(bankHash[:])

	checkbankAsBytes, err := stub.GetState(bankAddress)
	if err != nil || len(checkbankAsBytes) != 0 {
		return shim.Error(fmt.Sprintf("chaincode:Initbank::supplier already exist"))
	}






	bankAcc := bank{}
	bankAcc.BankId = bankAddress
	bankAcc.BankName = args[0]
	bankAcc.EmployeeName = args[1]
	bankAcc.EmailId = cert.Subject.CommonName
	var Dinvoices []disbursementInvoice
	bankAcc.DInvoices = Dinvoices
	bankAsbytes, err := json.Marshal(bankAcc)
	if err != nil {
		return shim.Error("chaincode:bank:InitBank::couldnt marshal bankAcc")
	}
	err = stub.PutState(bankAddress, bankAsbytes)
	if err != nil {
		return shim.Error("chaincode:bank:InitBank::couldnt put state bank")
	}
	var bankIds []string
	bankIndicesAsbytes, err := stub.GetState(bankIdIndices)
	if err != nil {
		return shim.Error("chaincode:bank:InitBank::couldnt get bankId indices")
	}
	err = json.Unmarshal(bankIndicesAsbytes, &bankIds)
	if err != nil {
		return shim.Error("chaincode:bank:InitBank::couldnt Unmarshal  bankIndicesAs Bytes")
	}
	bankIds = append(bankIds, bankAddress)
	newBankIdIndices, _ := json.Marshal(bankIds)
	err = stub.PutState(bankIdIndices, newBankIdIndices)
	if err != nil {
		return shim.Error("chaincode:bank:InitBank::couldnt put state bank")

	}
	return shim.Success(nil)
}

//=============================MakeOffer========================================

func (t *Supplychaincode) MakeOffer(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	//args[0]=invoiceId
	//args[1]=bankId
	//args[2]=days
	//args[3]=rate




	if len(args) < 2 {
		return shim.Error("chaincode:bank:MakeOffer::wrong number of arguments")
	}
	invoiceId := args[0]
	bankId := args[1]
	days := args[2]
	rate := args[3]
	err := stub.PutState("here", []byte(args[3]))
	if err != nil {
		return shim.Error("chaincode:bank:MakeOffer:couldnt putstate rate")
	}
	err = stub.PutState("now", []byte(rate))
	if err != nil {
		return shim.Error("chaincode:bank:MakeOffer:couldnt putstate now rate")
	}




	offerId := stub.GetTxID()
	err = stub.PutState("then", []byte(offerId))
	if err != nil {
		return shim.Error("chaincode:bank:MakeOffer:couldnt putstate then rate")
	}
	invoiceFunding, err := strconv.ParseFloat(args[5], 64)
	if err != nil {
		return shim.Error("chaincode:bank:MakeOffer::expecting float invoicefunding per day")
	}
	method := args[6]
	var supplierId string
	var invoices []invoice
	invoicesAsbytes, err := stub.GetState(bankInvoicesKey)
	if err != nil {
		return shim.Error("chaincode:bank:MakeOffer::couldnt GetState bankInvoicesKey")
	}
	err = json.Unmarshal(invoicesAsbytes, &invoices)
	if err != nil {
		return shim.Error("chaincode:bank:MakeOffer::couldnt unmarshal invoices")
	}

	bankAcc := bank{}
	bankAsbytes, err := stub.GetState(bankId)
	if err != nil {
		return shim.Error("chaincode:bank:MakeOffer::couldnt get bank with the provided id")
	}
	err = json.Unmarshal(bankAsbytes, &bankAcc)
	if err != nil {
		return shim.Error("chaincode:bank:MakeOffer::couldnt marshal bank ")
	}

	var disInv disbursementInvoice
	currentTime := time.Now().Local()
	for i := range invoices {
		if invoices[i].InvoiceId == invoiceId {
			disInv.Bank = bankId
			disInv.Date = currentTime.Format("02-01-2006")
			disInv.Time = currentTime.Format("3:04PM")
			disInv.Days, _ = strconv.Atoi(days)
			disInv.Details = invoices[i]

			transaction:=transactions{}
			transaction.TxId=stub.GetTxID()
			if len(transaction.TxId)==0{
				return shim.Error("chaincode::bank:MakeOffer::couldnt set the transaction Id ")
			}
			samay := time.Now().Local()
			transaction.Timestamp=samay.Format("02-01-2006")+"-"+samay.Format("3:04PM")
			transaction.Message="Offer made by "+bankAcc.BankName;
			//order.TransactionHistory=append(order.TransactionHistory,transaction);
			invoices[i].TransactionHistory=append(invoices[i].TransactionHistory,transaction)
			//disInv.TransactionHistory=append(disInv.TransactionHistory,invoices[i].TransactionHistory)
			disInv.Details = invoices[i]
			disInv.BankName=bankAcc.BankName
			disInv.DisRate, _ = strconv.ParseFloat(rate, 64)
			disInv.InvoiceFunding = invoiceFunding
			disInv.DisAmount = disInv.DisRate * disInv.Details.Total / 100
			disInv.DisAmount = disInv.DisRate * (disInv.Details.Total * invoiceFunding / 100) / 100
			disInv.Method = method
			if method == `Upfront` {
				disInv.DisbursedAmount = disInv.Details.Total - disInv.DisAmount
			} else {
				disInv.DisbursedAmount = disInv.Details.Total
			}

			supplierId = invoices[i].Supplier
		}
	}
	off := offer{}
	off.Details = disInv
	off.Status = "pending"
	off.Id = offerId

	bankAcc.Offers = append(bankAcc.Offers, off)
	newBankAsbytes, err := json.Marshal(bankAcc)
	if err != nil {
		return shim.Error("chaincode:bank:MakeOffer::couldnt marshal bankAcc ")
	}
	err = stub.PutState(bankId, newBankAsbytes)
	if err != nil {
		return shim.Error("chaincode:bank:MakeOffer::couldnt putstate bank ")
	}

	supplierAcc := supplier{}
	supplierAsbytes, err := stub.GetState(supplierId)
	if err != nil {
		return shim.Error("chaincode:bank:MakeOffer::couldnt get Supplier ")
	}
	err = json.Unmarshal(supplierAsbytes, &supplierAcc)
	if err != nil {
		return shim.Error("chaincode:bank:MakeOffer::couldnt Unmarshal Supplier ")
	}
	supplierAcc.Offers = append(supplierAcc.Offers, off)
	newSupplierAsbytes, err := json.Marshal(supplierAcc)
	if err != nil {
		return shim.Error("chaincode:bank:MakeOffer::couldnt marshal supplier ")
	}
	err = stub.PutState(supplierId, newSupplierAsbytes)

	if err != nil {
		return shim.Error("chaincode:bank:MakeOffer::couldnt marshal Supplier ")
	}

	return shim.Success(nil)

}

func (t *Supplychaincode) DisburseInvoice(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 8 {
		return shim.Error("chaincode:bank:DisburseInvoice::wrong number of arguments")
	}

	invoiceId := args[0]
	bankId := args[1]
	days := args[2]
	rate := args[3]
	penaltyPerDay, err := strconv.ParseFloat(args[4], 64)

	if err != nil {
		return shim.Error("chaincode:bank:DisburseInvoice:expecting float penalty per day")
	}
	recourse := args[5]
	invoiceFunding, err := strconv.ParseFloat(args[6], 64)
	if err != nil {
		return shim.Error("chaincode:bank:DisburseInvoiceexpecting float invoicefunding per day")
	}
	method := args[7]
	bankAcc := bank{}
	bankAsbytes, err := stub.GetState(bankId)
	if err != nil {
		return shim.Error("chaincode:bank:DisburseInvoice couldnt get bank with the provided Id")
	}

	err = json.Unmarshal(bankAsbytes, &bankAcc)
	if err != nil {
		return shim.Error("chaincode:bank:DisburseInvoice:couldnt unmarshal bank")
	}
	var Dinv = disbursementInvoice{}
	var invoices []invoice
	var supplierId, Type string
	var buyerId string
	invoicesAsbytes, err := stub.GetState(bankInvoicesKey)
	if err != nil {
		return shim.Error("chaincode:bank:DisburseInvoice:couldnt get invoice stack")
	}
	err = json.Unmarshal(invoicesAsbytes, &invoices)
	if err != nil {
		return shim.Error("chaincode:bank:DisburseInvoice:couldnt Unmarshal invoice stack")
	}
	currentTime := time.Now().Local()
	for i := range invoices {
		if invoices[i].InvoiceId == invoiceId {
			if invoices[i].InvoiceId == `disbursed` {
				return shim.Success(nil)
			}
			invoices[i].Status = `disbursed`

			transaction:=transactions{}
			transaction.TxId=stub.GetTxID()
			if len(transaction.TxId)==0{
				return shim.Error("chaincode: :bank:DisburseInvoice::couldnt set the transaction Id ")
			}
			samay:=time.Now().Local()
			transaction.Timestamp=samay.Format("02-01-2006")+"-"+samay.Format("3:04PM")
			transaction.Message="Status updated to disbursed";
			invoices[i].TransactionHistory=append(invoices[i].TransactionHistory,transaction);
		






			Dinv.Details = invoices[i]
			Dinv.Bank = bankId
			Dinv.Date = currentTime.Format("02-01-2006")
			Dinv.Time = currentTime.Format("3:04PM")
			Dinv.Days, err = strconv.Atoi(days)
			if err != nil {
				return shim.Error("chaincode:bank:DisburseInvoice:couldnt convert days")
			}
			Dinv.DisRate, err = strconv.ParseFloat(rate, 64)
			if err != nil {
				return shim.Error("chaincode:bank:DisburseInvoice:couldnt convert rate")
			}
			Dinv.InvoiceFunding = invoiceFunding
			Dinv.DisAmount = Dinv.DisRate * (Dinv.Details.Total * invoiceFunding / 100) / 100
			if method == `Upfront` {
				Dinv.DisbursedAmount = Dinv.Details.Total - Dinv.DisAmount
			} else {
				Dinv.DisbursedAmount = Dinv.Details.Total
			}
			Dinv.PenaltyPerDay = penaltyPerDay
			Dinv.Recourse = recourse
			Dinv.BankName  = bankAcc.BankName
			bankAcc.DInvoices = append(bankAcc.DInvoices, Dinv)
			supplierId = invoices[i].Supplier
			buyerId = invoices[i].Buyer
			Type = invoices[i].Type
		}
	}
	newBankAsbytes, err := json.Marshal(bankAcc)
	if err != nil {
		return shim.Error("chaincode:bank:DisburseInvoice:couldnt marshal bankAcc")
	}

	err = stub.PutState(bankId, newBankAsbytes)

	if err != nil {
		return shim.Error("chaincode:bank:DisburseInvoice:couldnt Putstate bank")
	}

	newBankInvoicesAsbytes, err := json.Marshal(invoices)
	if err != nil {
		return shim.Error("chaincode:bank:DisburseInvoice:couldnt marshal invoices")
	}
	err = stub.PutState(bankInvoicesKey, newBankInvoicesAsbytes)
	if err != nil {
		return shim.Error("chaincode:bank:DisburseInvoice:couldnt PutState bankInvoices")
	}

	var supplierAcc = supplier{}
	supplierAsbytes, err := stub.GetState(supplierId)
	if err != nil {
		return shim.Error("chaincode:bank:DisburseInvoice:couldnt get supplier")
	}
	err = json.Unmarshal(supplierAsbytes, &supplierAcc)
	if err != nil {
		return shim.Error("chaincode:bank:DisburseInvoice:couldnt Unmarshal supplier")
	}
	for i := range supplierAcc.Invoices {
		if supplierAcc.Invoices[i].InvoiceId == invoiceId {
			supplierAcc.Invoices[i].Status = `disbursed`
			transaction:=transactions{}
			transaction.TxId=stub.GetTxID()
			if len(transaction.TxId)==0{
				return shim.Error("chaincode: :bank:DisburseInvoice::couldnt set the transaction Id ")
			}
			samay:=time.Now().Local()
			transaction.Timestamp=samay.Format("02-01-2006")+"-"+samay.Format("3:04PM")
			transaction.Message="Status updated to disbursed";
			supplierAcc.Invoices[i].TransactionHistory=append(supplierAcc.Invoices[i].TransactionHistory,transaction);
		}
	}
	supplierAcc.DInvoices = append(supplierAcc.DInvoices, Dinv)
	newSupplierAsbytes, err := json.Marshal(supplierAcc)
	if err != nil {
		return shim.Error("chaincode:bank:DisburseInvoice:couldnt marshal supplier")
	}
	err = stub.PutState(supplierId, newSupplierAsbytes)
	if err != nil {
		return shim.Error("chaincode:bank:DisburseInvoice:couldnt PutState Supplier")
	}
	if Type == "indirect" {

		var buyerAcc = buyer{}
		buyerAsbytes, err := stub.GetState(buyerId)
		if err != nil {
			return shim.Error("chaincode:bank:DisburseInvoice:couldnt get buyer")
		}
		err = json.Unmarshal(buyerAsbytes, &buyerAcc)
		if err != nil {
			return shim.Error("chaincode:bank:DisburseInvoice:couldnt Unmarshal buyerAcc")
		}

		for i := range buyerAcc.Invoices {
			if buyerAcc.Invoices[i].InvoiceId == invoiceId {
				buyerAcc.Invoices[i].Status = `disbursed`
				transaction:=transactions{}
				transaction.TxId=stub.GetTxID()
				if len(transaction.TxId)==0{
					return shim.Error("chaincode: :bank:DisburseInvoice::couldnt set the transaction Id ")
				}
				samay:=time.Now().Local()
				transaction.Timestamp=samay.Format("02-01-2006")+"-"+samay.Format("3:04PM")
				transaction.Message="Status updated to disbursed";
				buyerAcc.Invoices[i].TransactionHistory=append(buyerAcc.Invoices[i].TransactionHistory,transaction);

			}
		}
		buyerAcc.DInvoices = append(buyerAcc.DInvoices, Dinv)
		newBuyerAcc, err := json.Marshal(buyerAcc)
		if err != nil {
			return shim.Error("chaincode:bank:DisburseInvoice:couldnt marshal buyerAcc")
		}
		err = stub.PutState(buyerId, newBuyerAcc)
		if err != nil {
			return shim.Error("chaincode:bank:DisburseInvoice:couldnt PutState BuyerAcc")
		}
	}
	return shim.Success(nil)
}

//====================MarkRepayment===============================

func (t *Supplychaincode) MarkRepayment(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 2 {
		return shim.Error("chaincode:bank:MarkRepayment:wrong number of arguments expecting 2")
	}
	bankId := args[0]
	invId := args[1]

	bankAcc := bank{}
	bankAsbytes, err := stub.GetState(bankId)
	if err != nil {
		return shim.Error("chaincode:bank:MarkRepayment:couldnt get bank ")
	}
	err = json.Unmarshal(bankAsbytes, &bankAcc)
	if err != nil {
		return shim.Error("chaincode:bank:MarkRepayment:couldnt Unmarshal  bank ")
	}
	var supplierId, buyerId, Type string
	for i := range bankAcc.DInvoices {
		if bankAcc.DInvoices[i].Details.InvoiceId == invId {
			bankAcc.DInvoices[i].Details.Status = `repayed`
			transaction:=transactions{}
			transaction.TxId=stub.GetTxID()
			if len(transaction.TxId)==0{
				return shim.Error("chaincode: :bank:MarkRepayment::couldnt set the transaction Id ")
			}
			samay:=time.Now().Local()
			transaction.Timestamp=samay.Format("02-01-2006")+"-"+samay.Format("3:04PM")
			transaction.Message="Status updated to repayed";
			bankAcc.DInvoices[i].Details.TransactionHistory=append(bankAcc.DInvoices[i].Details.TransactionHistory,transaction);

			

			buyerId = bankAcc.DInvoices[i].Details.Buyer
			supplierId = bankAcc.DInvoices[i].Details.Supplier
			Type = bankAcc.DInvoices[i].Details.Type
		}
	}
	newbankAsbytes, err := json.Marshal(bankAcc)
	if err != nil {
		return shim.Error("chaincode:bank:MarkRepayment:couldnt Marshal bankacc ")
	}
	err = stub.PutState(bankId, newbankAsbytes)
	if err != nil {
		return shim.Error("chaincode:bank:MarkRepayment:couldnt Putstate bank ")
	}
	if Type == "indirect" {
		buyerAcc := buyer{}
		buyerAsbytes, err := stub.GetState(buyerId)
		if err != nil {
			return shim.Error("chaincode:bank:MarkRepayment:couldnt get buyer ")
		}
		err = json.Unmarshal(buyerAsbytes, &buyerAcc)
		if err != nil {
			return shim.Error("chaincode:bank:MarkRepayment:couldnt Unmarshal  buyer ")
		}
		for j := range buyerAcc.DInvoices {
			if buyerAcc.DInvoices[j].Details.InvoiceId == invId {
				buyerAcc.DInvoices[j].Details.Status = `repayed`

				transaction:=transactions{}
				transaction.TxId=stub.GetTxID()
				if len(transaction.TxId)==0{
					return shim.Error("chaincode: :bank:MarkRepayment::couldnt set the transaction Id ")
				}
				samay:=time.Now().Local()
				transaction.Timestamp=samay.Format("02-01-2006")+"-"+samay.Format("3:04PM")
				transaction.Message="Status updated to repayed";
				buyerAcc.DInvoices[j].Details.TransactionHistory=append(buyerAcc.DInvoices[j].Details.TransactionHistory,transaction);
	
				
				
			}
		}
		newBuyerAsbytes, err := json.Marshal(buyerAcc)
		if err != nil {
			return shim.Error("chaincode:bank:MarkRepayment:couldnt Marshal buyerAcc ")
		}
		err = stub.PutState(buyerId, newBuyerAsbytes)
		if err != nil {
			return shim.Error("chaincode:bank:MarkRepayment:couldnt Putstate bytes ")
		}
	}
	supplierAcc := supplier{}
	supplierasbytes, err := stub.GetState(supplierId)
	if err != nil {
		return shim.Error("chaincode:bank:MarkRepayment:couldnt get Supplier ")
	}
	err = json.Unmarshal(supplierasbytes, &supplierAcc)
	if err != nil {
		return shim.Error("chaincode:bank:MarkRepayment:couldnt Unmarshal Supplier ")
	}
	for k := range supplierAcc.DInvoices {
		if supplierAcc.DInvoices[k].Details.InvoiceId == invId {
			supplierAcc.DInvoices[k].Details.Status = `repayed`
			transaction:=transactions{}
			transaction.TxId=stub.GetTxID()
			if len(transaction.TxId)==0{
				return shim.Error("chaincode: :bank:MarkRepayment::couldnt set the transaction Id ")
			}
			samay:=time.Now().Local()
			transaction.Timestamp=samay.Format("02-01-2006")+"-"+samay.Format("3:04PM")
			transaction.Message="Status updated to repayed";
			supplierAcc.DInvoices[k].Details.TransactionHistory=append( supplierAcc.DInvoices[k].Details.TransactionHistory,transaction);


		}
	}
	newSupplierAsbytes, err := json.Marshal(supplierAcc)
	if err != nil {
		return shim.Error("chaincode:bank:MarkRepayment:couldnt Marshal SupplierAcc ")
	}
	err = stub.PutState(supplierId, newSupplierAsbytes)
	if err != nil {
		return shim.Error("chaincode:bank:MarkRepayment:couldnt Putstate supplier ")
	}

	return shim.Success(nil)
}

//===================================  read All Banker ===================================

func (t *Supplychaincode) readAllBankers(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var banks []bank
	var bankIds []string
	bankIdsAsbytes, err := stub.GetState(bankIdIndices)
	if err != nil {
		return shim.Error("chaincode:bank:readAllBankers:couldnt get bankIdIndices ")
	}
	err = json.Unmarshal(bankIdsAsbytes, &bankIds)
	if err != nil {
		return shim.Error("chaincode:bank:readAllBankers:couldnt Unmarshal bankId ")
	}
	for i := 0; i < len(bankIds); i++ {
		var b = bank{}
		accBytes, err := stub.GetState(bankIds[i])
		if err != nil {
			return shim.Error(fmt.Sprintf("chaincode:bank:readAllBankers:couldnt get %dth bank ", i))
		}
		err = json.Unmarshal(accBytes, &b)
		if err != nil {
			return shim.Error("chaincode:bank:readAllBankers:couldnt Unmarshal accBytes ")
		}
		banks = append(banks, b)
	}
	data, err := json.Marshal(banks)
	if err != nil {
		return shim.Error("chaincode:bank:readAllBankers:couldnt Marshal banks ")
	}
	err = stub.PutState("banks", data)
	if err != nil {
		return shim.Error("chaincode:bank:readAllBankers:couldnt PutState bankasData ")
	}

	return shim.Success(data)

}

//===========================================   AddSupplierLimit ======================

func (t *Supplychaincode) AddSupplierLimit(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 3 {
		return shim.Error("chaincode:bank:AddSupplierLimit :: wrong number of arguments")
	}

	bankId := args[0]
	supplierId := args[1]
	supplierTotalLimit, err := strconv.ParseFloat(args[2], 64)
	if err != nil {
		return shim.Error("chaincode:bank:AddSupplierLimit :: expected float argument for total limit")
	}
	bankAcc := bank{}
	bankAsbytes, err := stub.GetState(bankId)
	if err != nil {
		return shim.Error("chaincode:bank:AddSupplierLimit :: can't get state for bank id")
	}

	err = json.Unmarshal(bankAsbytes, &bankAcc)
	if err != nil {
		return shim.Error("chaincode:bank:AddSupplierLimit ::couldnt Unmarshal bankacc")
	}
	var count int
	count = 0
	for i := range bankAcc.SupplierLimits {
		if bankAcc.SupplierLimits[i].SupplierId == supplierId {
			bankAcc.SupplierLimits[i].TotalLimit = supplierTotalLimit
			count = 1
		}
	}
	if count == 0 {
		supplierLim := supplierLimit{}
		supplierLim.TotalLimit = supplierTotalLimit
		supplierLim.SupplierId = supplierId
		bankAcc.SupplierLimits = append(bankAcc.SupplierLimits, supplierLim)
	}

	newBankAsbytes, err := json.Marshal(bankAcc)
	if err != nil {
		return shim.Error("chaincode:bank:AddSupplierLimit ::couldnt marshal bankacc")
	}
	err = stub.PutState(bankId, newBankAsbytes)
	if err != nil {
		return shim.Error("chaincode:bank:AddSupplierLimit ::couldnt PutState bankacc")
	}

	return shim.Success(nil)
}

//======================AddSupplierInvoiceLimit===========================================

func (t *Supplychaincode) AddSupplierInvoiceLimit(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 3 {
		return shim.Error("chaincode:bank:AddSupplierInvoiceLimit:: wrong number of arguments")
	}
	bankId := args[0]
	supplierId := args[1]
	invoiceLimit, err := strconv.ParseFloat(args[2], 64)
	if err != nil {
		return shim.Error("chaincode:bank:AddSupplierInvoiceLimit::expected float for invoice limit")
	}
	bankAcc := bank{}
	bankAsbytes, err := stub.GetState(bankId)
	if err != nil {
		return shim.Error("chaincode:bank:AddSupplierInvoiceLimit::Couldnt get state bank with the provided ID")
	}
	err = json.Unmarshal(bankAsbytes, &bankAcc)
	if err != nil {
		return shim.Error("chaincode:bank:AddSupplierInvoiceLimit::couldnt unmarshal")
	}
	count := 0
	for i := range bankAcc.SupplierLimits {
		if bankAcc.SupplierLimits[i].SupplierId == supplierId {
			bankAcc.SupplierLimits[i].InvoiceLimit = invoiceLimit
			count = 1
		}
	}
	if count == 0 {
		supplierLim := supplierLimit{}
		supplierLim.SupplierId = supplierId
		supplierLim.InvoiceLimit = invoiceLimit
		bankAcc.SupplierLimits = append(bankAcc.SupplierLimits, supplierLim)
	}

	newBankAsbytes, err := json.Marshal(bankAcc)
	if err != nil {
		return shim.Error("chaincode:bank:AddSupplierInvoiceLimit::couldnt marshal bank acc")
	}
	err = stub.PutState(bankId, newBankAsbytes)
	if err != nil {
		return shim.Error("chaincode:bank:AddSupplierInvoiceLimit::couldnt putstate bank")
	}

	return shim.Success(nil)
}

//==============================Limit BUyer=============================

func (t *Supplychaincode) LimitBuyer(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) < 5 {
		return shim.Error("Chaincode:bank:LimitBuyer:: wrong number of arguments")
	}
	bankId := args[0]
	supplierId := args[1]
	numOfBuyers, err := strconv.Atoi(args[2])
	if err != nil {
		return shim.Error("Chaincode:bank:LimitBuyer :: expected integer")
	}
	bankAsbytes, err := stub.GetState(bankId)
	if err != nil {
		return shim.Error("Chaincode:bank:LimitBuyer:couldnt get bank")
	}
	bankAcc := bank{}
	err = json.Unmarshal(bankAsbytes, &bankAcc)
	if err != nil {
		return shim.Error("Chaincode:bank:LimitBuyer: couldnt unmarshal bank")
	}
	var buyerLimits []buyerLimit
	for j := 3; j < (2*numOfBuyers)+3; j += 2 {
		buyerLim := buyerLimit{}
		buyerLim.BuyerName = args[j]
		buyerLim.BuyerLimit, err = strconv.ParseFloat(args[j+1], 64)
		if err != nil {
			return shim.Error("Chaincode:bank:LimitBuyer: expected float for buyer limit")
		}
		buyerLimits = append(buyerLimits, buyerLim)
	}
	count := 0
	for i := range bankAcc.SupplierLimits {
		if bankAcc.SupplierLimits[i].SupplierId == supplierId {
			bankAcc.SupplierLimits[i].BuyerLimits = buyerLimits

			count = 1
		}
	}
	if count == 0 {
		supplierLim := supplierLimit{}
		supplierLim.SupplierId = supplierId
		supplierLim.BuyerLimits = buyerLimits
		bankAcc.SupplierLimits = append(bankAcc.SupplierLimits, supplierLim)
	}
	newBankAsbytes, err := json.Marshal(bankAcc)
	if err != nil {
		return shim.Error("Chaincode:bank:LimitBuyer: couldnt marshal BankACC")
	}
	err = stub.PutState(bankId, newBankAsbytes)
	if err != nil {
		return shim.Error("Chaincode:bank:LimitBuyer:can't PutState")
	}

	return shim.Success(nil)
}
