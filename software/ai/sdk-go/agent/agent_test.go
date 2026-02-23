package agent

import (
	"math/big"
	"sync"
	"testing"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func testAgentParams(walletAddr common.Address) CreateAgentParams {
	return CreateAgentParams{
		Config: AgentConfig{
			Name:          "test-agent",
			WalletAddress: walletAddr,
			Duration:      time.Hour,
			Permissions:   []string{"transfer", "swap"},
		},
		ChainID: big.NewInt(8453),
	}
}

func TestNewAgentService(t *testing.T) {
	svc := NewAgentService()
	assert.NotNil(t, svc)
	assert.NotNil(t, svc.agents)
	assert.Empty(t, svc.agents)
}

func TestCreateAgent(t *testing.T) {
	walletAddr := common.HexToAddress("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")

	t.Run("success", func(t *testing.T) {
		svc := NewAgentService()
		params := testAgentParams(walletAddr)

		a, err := svc.CreateAgent(params)
		require.NoError(t, err)
		require.NotNil(t, a)

		assert.NotEmpty(t, a.ID)
		assert.Equal(t, "test-agent", a.Name)
		assert.Equal(t, walletAddr, a.WalletAddress)
		assert.NotNil(t, a.SessionKey)
		assert.Equal(t, AgentStatusActive, a.Status)
		assert.Equal(t, []string{"transfer", "swap"}, a.Permissions)
		assert.False(t, a.CreatedAt.IsZero())
		assert.False(t, a.ExpiresAt.IsZero())
		assert.True(t, a.ExpiresAt.After(a.CreatedAt))
	})

	t.Run("unique IDs", func(t *testing.T) {
		svc := NewAgentService()
		params := testAgentParams(walletAddr)

		a1, err := svc.CreateAgent(params)
		require.NoError(t, err)
		a2, err := svc.CreateAgent(params)
		require.NoError(t, err)

		assert.NotEqual(t, a1.ID, a2.ID)
	})
}

func TestRevokeAgent(t *testing.T) {
	walletAddr := common.HexToAddress("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")

	t.Run("success", func(t *testing.T) {
		svc := NewAgentService()
		a, err := svc.CreateAgent(testAgentParams(walletAddr))
		require.NoError(t, err)

		err = svc.RevokeAgent(a.ID)
		require.NoError(t, err)

		got, err := svc.GetAgent(a.ID)
		require.NoError(t, err)
		assert.Equal(t, AgentStatusRevoked, got.Status)
	})

	t.Run("not found", func(t *testing.T) {
		svc := NewAgentService()
		err := svc.RevokeAgent("nonexistent")
		require.Error(t, err)
		assert.Equal(t, "agent not found", err.Error())
	})
}

func TestGetAgent(t *testing.T) {
	walletAddr := common.HexToAddress("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")

	t.Run("success", func(t *testing.T) {
		svc := NewAgentService()
		a, err := svc.CreateAgent(testAgentParams(walletAddr))
		require.NoError(t, err)

		got, err := svc.GetAgent(a.ID)
		require.NoError(t, err)
		assert.Equal(t, a.ID, got.ID)
	})

	t.Run("not found", func(t *testing.T) {
		svc := NewAgentService()
		_, err := svc.GetAgent("nonexistent")
		require.Error(t, err)
		assert.Equal(t, "agent not found", err.Error())
	})

	t.Run("expired agent", func(t *testing.T) {
		svc := NewAgentService()
		params := CreateAgentParams{
			Config: AgentConfig{
				Name:          "short-lived",
				WalletAddress: walletAddr,
				Duration:      time.Millisecond,
				Permissions:   nil,
			},
			ChainID: big.NewInt(8453),
		}

		a, err := svc.CreateAgent(params)
		require.NoError(t, err)

		time.Sleep(5 * time.Millisecond)

		got, err := svc.GetAgent(a.ID)
		require.NoError(t, err)
		assert.Equal(t, AgentStatusExpired, got.Status)
	})

	t.Run("revoked agent not changed to expired", func(t *testing.T) {
		svc := NewAgentService()
		params := CreateAgentParams{
			Config: AgentConfig{
				Name:          "revoked-agent",
				WalletAddress: walletAddr,
				Duration:      time.Millisecond,
				Permissions:   nil,
			},
			ChainID: big.NewInt(8453),
		}

		a, err := svc.CreateAgent(params)
		require.NoError(t, err)

		err = svc.RevokeAgent(a.ID)
		require.NoError(t, err)

		time.Sleep(5 * time.Millisecond)

		got, err := svc.GetAgent(a.ID)
		require.NoError(t, err)
		assert.Equal(t, AgentStatusRevoked, got.Status)
	})
}

func TestListAgents(t *testing.T) {
	wallet1 := common.HexToAddress("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
	wallet2 := common.HexToAddress("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb")

	t.Run("empty", func(t *testing.T) {
		svc := NewAgentService()
		result := svc.ListAgents(wallet1)
		assert.Empty(t, result)
	})

	t.Run("filters by wallet", func(t *testing.T) {
		svc := NewAgentService()

		for i := 0; i < 3; i++ {
			_, err := svc.CreateAgent(testAgentParams(wallet1))
			require.NoError(t, err)
		}
		for i := 0; i < 2; i++ {
			_, err := svc.CreateAgent(testAgentParams(wallet2))
			require.NoError(t, err)
		}

		result1 := svc.ListAgents(wallet1)
		assert.Len(t, result1, 3)
		for _, a := range result1 {
			assert.Equal(t, wallet1, a.WalletAddress)
		}

		result2 := svc.ListAgents(wallet2)
		assert.Len(t, result2, 2)
	})

	t.Run("marks expired agents", func(t *testing.T) {
		svc := NewAgentService()
		params := CreateAgentParams{
			Config: AgentConfig{
				Name:          "ephemeral",
				WalletAddress: wallet1,
				Duration:      time.Millisecond,
				Permissions:   nil,
			},
			ChainID: big.NewInt(8453),
		}

		_, err := svc.CreateAgent(params)
		require.NoError(t, err)

		time.Sleep(5 * time.Millisecond)

		result := svc.ListAgents(wallet1)
		assert.Len(t, result, 1)
		assert.Equal(t, AgentStatusExpired, result[0].Status)
	})
}

func TestAgentServiceConcurrency(t *testing.T) {
	svc := NewAgentService()
	walletAddr := common.HexToAddress("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")

	var wg sync.WaitGroup
	ids := make([]string, 20)
	var mu sync.Mutex

	for i := 0; i < 20; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			a, err := svc.CreateAgent(testAgentParams(walletAddr))
			require.NoError(t, err)
			mu.Lock()
			ids[idx] = a.ID
			mu.Unlock()
		}(i)
	}
	wg.Wait()

	for i := 0; i < 20; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			_, _ = svc.GetAgent(ids[idx])
		}(i)
	}

	for i := 0; i < 20; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_ = svc.ListAgents(walletAddr)
		}()
	}
	wg.Wait()

	result := svc.ListAgents(walletAddr)
	assert.Len(t, result, 20)
}
