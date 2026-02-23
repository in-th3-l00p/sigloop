package x402

import (
	"math/big"

	"github.com/ethereum/go-ethereum/common"
)

type PaymentRequirement struct {
	Scheme          string         `json:"scheme"`
	Network         string         `json:"network"`
	MaxAmountRequired string       `json:"maxAmountRequired"`
	Resource        string         `json:"resource"`
	Description     string         `json:"description"`
	MimeType        string         `json:"mimeType"`
	PayTo           common.Address `json:"payTo"`
	RequiredDeadline string        `json:"requiredDeadline"`
	Extra           map[string]interface{} `json:"extra"`
}

type X402Config struct {
	MaxAmount      *big.Int
	AutoPay        bool
	AllowedSchemes []string
	BudgetPeriod   uint64
}

type PaymentRecord struct {
	Resource       string
	Amount         *big.Int
	PayTo          common.Address
	Timestamp      uint64
	TxHash         common.Hash
	Network        string
}

type X402Policy struct {
	MaxPerRequest  *big.Int
	MaxPerPeriod   *big.Int
	AllowedPayees  map[common.Address]bool
	AllowedDomains map[string]bool
}

type BudgetState struct {
	TotalSpent     *big.Int
	PeriodSpent    *big.Int
	PeriodStart    uint64
	PeriodDuration uint64
	Records        []PaymentRecord
}
