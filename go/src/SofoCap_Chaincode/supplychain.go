package main

import (
	"crypto/sha256"
	"crypto/x509"
	"encoding/hex"
	"encoding/json"
	"fmt"

	"encoding/pem"

	"github.com/golang/protobuf/proto"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	mspprotos "github.com/hyperledger/fabric/protos/msp"
	pb "github.com/hyperledger/fabric/protos/peer"
)

type Supplychaincode struct {
}

var supplierIdIndices string = "SupplierIdIndices"
var bankIdIndices string = "BankIdIndices"
var bankInvoicesKey string = "BankInvoices"

func main() {

	err := shim.Start(new(Supplychaincode))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}

func (t *Supplychaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {

	_, args := stub.GetFunctionAndParameters()

	if len(args) != 0 {
		return shim.Error("chaincode:suplychain:Init  :: wrong number of aguments in initialization")
	}
	var suppliers []string
	supplierIdIndicesAsbytes, _ := json.Marshal(suppliers)
	err := stub.PutState(supplierIdIndices, supplierIdIndicesAsbytes)
	if err != nil {
		return shim.Error("chaincode:suplychain:Init  :: error in PutState supplier indices")
	}
	var banks []string
	bankIdAsbytes, _ := json.Marshal(banks)
	err = stub.PutState(bankIdIndices, bankIdAsbytes)
	if err != nil {
		return shim.Error("chaincode:suplychain:Init  :: error in PutState bankindices")
	}

	var bankInvoices []invoice
	bankInvoicesAsbytes, _ := json.Marshal(bankInvoices)
	err = stub.PutState(bankInvoicesKey, bankInvoicesAsbytes)
	if err != nil {
		return shim.Error("chaincode:suplychain:Init  :: error in PutState bankInvoices")
	}

	return shim.Success(nil)
}

//Invoking functionality
func (t *Supplychaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {

	function, args := stub.GetFunctionAndParameters()

	if function == "init" {
		return t.Init(stub)
	} else if function == "initBuyer" {
		return t.InitBuyer(stub, args)
	} else if function == "initSupplier" {
		return t.InitSupplier(stub, args)
	} else if function == "createPO" {
		return t.CreatePO(stub, args)
	} else if function == "updatePOStatus" {
		return t.UpdatePOStatus(stub, args)
	} else if function == "generateInvoice" {
		return t.GenerateInvoice(stub, args)
	} else if function == "updateInvoiceStatus" {
		return t.UpdateInvoiceStatus(stub, args)
	} else if function == "initBank" {
		return t.InitBank(stub, args)
	} else if function == "disburseInvoice" { // for accepted offer disburtsement
		return t.DisburseInvoice(stub, args)  /////////////////////////////////////////////////////
	} else if function == "makeOffer" {
		return t.MakeOffer(stub, args)               ///////////////////////////////////
	} else if function == "updateOfferStatus" { // supllier accepts or decline the offer accepting one rejects otheerrs automatuicaly
		return t.UpdateOfferStatus(stub, args)
	} else if function == "markRepayment" { // bank sets the payment done by buyer or supplier
		return t.MarkRepayment(stub, args)
	} else if function == "addBuyersToList" {
		return t.AddBuyerToList(stub, args)
	} else if function == "addSupplierLimit" {
		return t.AddSupplierLimit(stub, args)
	} else if function == "addSupplierInvoiceLimit" {
		return t.AddSupplierInvoiceLimit(stub, args)
	} else if function == "limitBuyer" {
		return t.LimitBuyer(stub, args)
	} else if function == "uploadApprovedInvoice" {
		return t.UploadApprovedInvoice(stub, args)
	} else if function == "readAllSuppliers" {
		return t.ReadAllSuppliers(stub, args)
	} else if function == "read" {
		return t.Read(stub, args)
	} else if function == "ReadAcc" {
		return t.GetAccount(stub, args)
	} else if function == "initChecker" {
		return t.InitChecker(stub,args);
	}

	return shim.Error("error:C01 No function called!!!"+function)

}

// Query data
// func (t *Supplychaincode) Query(stub shim.ChaincodeStubInterface, function string, args []string) pb.Response {
// 	if function == "read" {
// 		return t.Read(stub, args)
// 	} else if function == "readAllSuppliers" {
// 		return t.ReadAllSuppliers(stub, args)
// 	}

// 	return nil, errors.New("error:C02 No function called")
// }

func (t *Supplychaincode) Read(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	if len(args) != 1 {
		return shim.Error("chaincode:suplychain:Read  :: Wrong numer of arguments")
	}

	valAsbytes, err := stub.GetState(args[0])
	if err != nil {
		return shim.Error("chaincode:suplychain:Read  ::Can't GetState")
	}
	return shim.Success(valAsbytes)

}

func (t *Supplychaincode) ReadAllSuppliers(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	if len(args) != 0 {
		return shim.Error("chaincode:suplychain:ReadAllSuppliers::A05 wrong number of arguments")
	}

	var idList []string
	idListAsbytes, err := stub.GetState(supplierIdIndices)

	if err != nil {
		return shim.Error("chaincode:suplychain:Init  ::Can't get supplier")
	}

	err = json.Unmarshal(idListAsbytes, &idList)

	if err != nil {
		return shim.Error("chaincode:suplychain:Init  :: error in unmarshaliing idList")
	}
	var suppliers []supplier
	for i := range idList {
		supplierAcc := supplier{}
		supplierAsbytes, _ := stub.GetState(idList[i])
		err := json.Unmarshal(supplierAsbytes, &supplierAcc)
		if err != nil {
			return shim.Error("chaincode:suplychain:Init  :: unmarshaliing error")
		}
		suppliers = append(suppliers, supplierAcc)
	}
	supplierData, err := json.Marshal(suppliers)
	if err != nil {
		return shim.Error("chaincode:suplychain:Init  :: marshalling error")
}

	return shim.Success(supplierData)
}






//=====================get account===================
func (t *Supplychaincode) GetAccount(stub shim.ChaincodeStubInterface, args []string) pb.Response {

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
	if err != nil || len(checkBuyerAsBytes) == 0 {
		return shim.Error(fmt.Sprintf("chaincode:Initsupplier::user don't exist"))
	}

	return shim.Success(checkBuyerAsBytes)

}

