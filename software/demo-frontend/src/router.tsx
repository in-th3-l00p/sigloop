import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router'
import { AppLayout } from './components/layout/AppLayout'
import { Dashboard } from './pages/Dashboard'
import { Wallets } from './pages/Wallets'
import { Agents } from './pages/Agents'
import { Policies } from './pages/Policies'
import { Payments } from './pages/Payments'
import { DeFi } from './pages/DeFi'

const rootRoute = createRootRoute({
    component: AppLayout,
})

const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: Dashboard,
})

const walletsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/wallets',
    component: Wallets,
})

const agentsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agents',
    component: Agents,
})

const policiesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/policies',
    component: Policies,
})

const paymentsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/payments',
    component: Payments,
})

const defiRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/defi',
    component: DeFi,
})

const analyticsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/analytics',
    component: () => <div className="p-4">Analytics</div>,
})

const settingsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/settings',
    component: () => <div className="p-4">Settings</div>,
})

const routeTree = rootRoute.addChildren([
    indexRoute,
    walletsRoute,
    agentsRoute,
    policiesRoute,
    paymentsRoute,
    defiRoute,
    analyticsRoute,
    settingsRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}
