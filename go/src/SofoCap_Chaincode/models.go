package main

// type product struct {
// 	ProductName string  `json:"productName"`
// 	Quantity    int     `json:"quantity"`
// 	Rate        float64 `json:"rate"`
// 	Value       float64 `json:"value"`
// }

type purchaseOrder struct {
	OrderId      string    `json:"orderId"`
	Date         string    `json:"date"`
	Time         string    `json:"time"`
	// Products     []product `json:"products"`
	Buyer        string    `json:"buyer"`
	Supplier     string    `json:"supplier"`
	TotalValue   float64   `json:"totalValue"`
	CreditPeriod int       `json:"creditPeriod"`
	Hash         string    `json:"hash"`
	SupplierName string    `json:"supplierName"`
	BuyerName    string    `json:"buyerName"`
	Status       string    `json:"status"`
	TransactionHistory []transactions `json:"transactionHistory"`
}

type invoiceHash struct{
	InvoiceId string `json:"invoiceId"`
	SupplierId string `json:"supplierId"`
	Hash string `json:"hash"`
	
}

type transactions struct{
	TxId string `json:"txId"`
	Timestamp string `json:"timeStamp"`
	Message string `json:"message"`
	

}

type invoice struct {
	InvoiceId      string          `json:"invoiceId"`
	PurchaseOrders []purchaseOrder `json:"purchaseOrders"`
	Date           string          `json:"date"`
	Time           string          `json:"time"`
	Buyer          string          `json:"buyer"`
	Supplier       string          `json:"supplier"`
	Subtotal       float64         `json:"subtotal"`
	Taxes          float64         `json:"taxes"`
	Total          float64         `json:"total"`
	Type           string          `json:"type"`
	Hash           string          `json:"hash"`
	SupplierName   string          `json:"supplierName"`
	BuyerName      string          `json:"buyerName"`
	Status         string          `json:"status"`
	TransactionHistory []transactions `json:"transactionHistory"`
}

type buyer struct {
	BuyerId        string                `json:"buyerId"`
	BuyerName      string                `json:"buyerName"`
	PurchaseOrders []purchaseOrder       `json:"purchaseOrders"`
	Invoices       []invoice             `json:"invoices"`
	DInvoices      []disbursementInvoice `json:"dInvoices"`
	EmployeeName   string                `json:"employeeName"`
	EmailId        string                `json:"emailId"`
	Checker        string 				 `json:"checker"`	            
}

type supplier struct {
	SupplierId     string                `json:"supplierId"`
	SupplierName   string                `json:"supplierName"`
	Type           string                `json:"type"`
	Affilation     string                `json:"affilation"`
	PurchaseOrders []purchaseOrder       `json:"purchaseOrders"`
	Invoices       []invoice             `json:"invoices"`
	DInvoices      []disbursementInvoice `json:"dInvoices"`
	EmployeeName   string                `json:"employeeName"`
	EmailId        string                `json:"emailId"`
	Offers         []offer               `json:"offers"`
	Buyers         []SuppliersBuyer      `json:"buyers"`
}

type SuppliersBuyer struct {
	BuyerId      string `json:"buyerId"`
	BuyerName    string `json:"buyerName"`
	EmployeeName string `json:"employeeName"`
	PhoneNo      string `json:"phoneNo"`
	EmailId      string `json:"emailId"`
}

type buyerLimit struct {
	BuyerName  string  `json:"buyerName"`
	BuyerId    string  `json:"buyerId"`
	BuyerLimit float64 `json:"buyerLimit"`
}

type supplierLimit struct {
	SupplierId   string       `json:"supplierId"`
	TotalLimit   float64      `json:"totalLimit"`
	InvoiceLimit float64      `json:"invoiceLimit"`
	BuyerLimits  []buyerLimit `json:"buyerLimits"`
}

type bank struct {
	BankId         string                `json:"bankId"`
	BankName       string                `json:"bankName"`
	EmployeeName   string                `json:"employeeName"`
	EmailId        string                `json:"emailId"`
	SupplierLimits []supplierLimit       `json:"supplierLimits"`
	DInvoices      []disbursementInvoice `json:"dInvoices"`
	Offers         []offer               `json:"offers"`
}

type disbursementInvoice struct {
	Details         invoice `json:"details"`//invice correspodning to the offer
	DisRate         float64 `json:"disRate"`
	InvoiceFunding  float64 `json:"invoiceFunding"`
	Method          string  `json:"method"`
	DisAmount       float64 `json:"disAmount"`
	Days            int     `json:"days"`
	DisbursedAmount float64 `json:"disbursedAmount"`
	PenaltyPerDay   float64 `json:"penaltyPerDay"`
	Recourse        string  `json:"recourse"`
	Bank            string  `json:"bank"`
	BankName   		string `json:"bankName"`  
	Date            string  `json:"date"`
	Time            string  `json:"time"`
	
}

type offer struct {
	Id      string              `json:"id"`
	Details disbursementInvoice `json:"details"`
	Status  string              `json:"status"`
}

type checker struct{
	CheckerId string   `json:"checkerId"`
	BuyerName string `json:"buyerName"`
	EmployeeName string `json:"employeeName"`
	BuyerId string `json:"buyerId"`
	InvoiceList []invoice `json:"invoiceList"`
	EmailId  string `json:"emailId"`

}
