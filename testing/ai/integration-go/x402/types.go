package x402

type PaymentRequirement struct {
	Scheme    string `json:"scheme"`
	Network   string `json:"network"`
	MaxAmount string `json:"maxAmountRequired"`
	Resource  string `json:"resource"`
	Address   string `json:"address"`
}

type PaymentHeader struct {
	Signature string `json:"signature"`
	Sender    string `json:"sender"`
	Amount    string `json:"amount"`
	Resource  string `json:"resource"`
}
