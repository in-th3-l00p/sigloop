package agent

import (
	"crypto/ecdsa"
	"math/big"
	"time"

	"github.com/ethereum/go-ethereum/common"
)

type AgentStatus int

const (
	AgentStatusActive AgentStatus = iota
	AgentStatusRevoked
	AgentStatusExpired
)

type Agent struct {
	ID            string
	Name          string
	WalletAddress common.Address
	SessionKey    *SessionKey
	Status        AgentStatus
	CreatedAt     time.Time
	ExpiresAt     time.Time
	Permissions   []string
}

type AgentConfig struct {
	Name          string
	WalletAddress common.Address
	Duration      time.Duration
	Permissions   []string
}

type SessionKey struct {
	PrivateKey    *ecdsa.PrivateKey
	PublicKey     *ecdsa.PublicKey
	Address       common.Address
	ValidAfter    *big.Int
	ValidUntil    *big.Int
	ChainID       *big.Int
}

type CreateAgentParams struct {
	Config        AgentConfig
	ChainID       *big.Int
}
