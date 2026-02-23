package defi

import (
	"testing"

	"github.com/sigloop/sdk-go/chain"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewDeFiService(t *testing.T) {
	cs := chain.NewChainService()
	svc := NewDeFiService(cs)
	require.NotNil(t, svc)
	assert.Equal(t, cs, svc.chainService)
}

func TestNewDeFiServiceNilChain(t *testing.T) {
	svc := NewDeFiService(nil)
	require.NotNil(t, svc)
	assert.Nil(t, svc.chainService)
}
