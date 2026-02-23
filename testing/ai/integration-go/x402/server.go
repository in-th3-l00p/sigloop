package x402

import (
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"sync"
)

type MockX402Server struct {
	Server       *http.Server
	URL          string
	Payments     []PaymentHeader
	mu           sync.Mutex
	Requirements []PaymentRequirement
}

func NewMockX402Server(requirements []PaymentRequirement) (*MockX402Server, error) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return nil, err
	}

	mock := &MockX402Server{
		Requirements: requirements,
		URL:          fmt.Sprintf("http://%s", listener.Addr().String()),
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/", mock.handler)

	mock.Server = &http.Server{Handler: mux}

	go mock.Server.Serve(listener)

	return mock, nil
}

func (m *MockX402Server) handler(w http.ResponseWriter, r *http.Request) {
	paymentHeader := r.Header.Get("X-PAYMENT")
	if paymentHeader == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusPaymentRequired)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"accepts": m.Requirements,
		})
		return
	}

	var payment PaymentHeader
	json.Unmarshal([]byte(paymentHeader), &payment)

	m.mu.Lock()
	m.Payments = append(m.Payments, payment)
	m.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "paid",
	})
}

func (m *MockX402Server) GetPayments() []PaymentHeader {
	m.mu.Lock()
	defer m.mu.Unlock()
	result := make([]PaymentHeader, len(m.Payments))
	copy(result, m.Payments)
	return result
}

func (m *MockX402Server) Close() {
	m.Server.Close()
}
