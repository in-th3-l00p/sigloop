import { BrowserRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SettingsProvider } from "@/providers/settings"
import { WebSocketProvider } from "@/providers/websocket"
import { AppLayout } from "@/components/layout/app-layout"
import { DashboardPage } from "@/pages/dashboard"
import { WalletsPage } from "@/pages/wallets"
import { WalletDetailPage } from "@/pages/wallet-detail"
import { AgentsPage } from "@/pages/agents"
import { AgentDetailPage } from "@/pages/agent-detail"
import { PoliciesPage } from "@/pages/policies"
import { PolicyDetailPage } from "@/pages/policy-detail"
import { PaymentsPage } from "@/pages/payments"
import { DefiPage } from "@/pages/defi"
import { AnalyticsPage } from "@/pages/analytics"
import { SettingsPage } from "@/pages/settings"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <WebSocketProvider>
          <BrowserRouter>
            <div className="dark">
              <Routes>
                <Route element={<AppLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="wallets" element={<WalletsPage />} />
                  <Route path="wallets/:id" element={<WalletDetailPage />} />
                  <Route path="agents" element={<AgentsPage />} />
                  <Route path="agents/:id" element={<AgentDetailPage />} />
                  <Route path="policies" element={<PoliciesPage />} />
                  <Route path="policies/:id" element={<PolicyDetailPage />} />
                  <Route path="payments" element={<PaymentsPage />} />
                  <Route path="defi" element={<DefiPage />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
              </Routes>
            </div>
          </BrowserRouter>
        </WebSocketProvider>
      </SettingsProvider>
    </QueryClientProvider>
  )
}
