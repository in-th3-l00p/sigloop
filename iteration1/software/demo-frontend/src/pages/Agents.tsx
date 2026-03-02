import { useState } from "react"
import { useAgents } from "@/lib/queries"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Bot, Plus, Search, Filter, MoreHorizontal, Clock, Shield } from "lucide-react"

export function Agents() {
    const { data: agents, isLoading } = useAgents()
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")

    if (isLoading || !agents) {
        return <div className="space-y-4 animate-pulse">
            <div className="h-10 w-48 bg-muted rounded"></div>
            <div className="h-12 w-full bg-muted rounded-xl"></div>
            <div className="h-96 w-full bg-muted rounded-xl"></div>
        </div>
    }

    const filteredAgents = agents.filter(agent => {
        const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            agent.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
            agent.walletName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || agent.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500'
            case 'revoked': return 'bg-red-500'
            case 'expired': return 'bg-zinc-500'
            default: return 'bg-zinc-500'
        }
    }

    const getTimeRemaining = (expiresAt: string) => {
        if (!expiresAt) return "—"
        const expiry = new Date(expiresAt).getTime()
        const now = new Date().getTime()
        const diff = expiry - now
        if (diff <= 0) return "Expired"

        const hours = Math.floor(diff / (1000 * 60 * 60))
        const days = Math.floor(hours / 24)
        if (days > 0) return `${days}d left`
        return `${hours}h left`
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Agents</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Provision session keys and monitor AI agents.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Provision Agent
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center space-x-2 flex-1 max-w-sm relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search agents, wallets, addresses..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" className="h-9" onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}>
                                <Filter className="mr-2 h-4 w-4" />
                                {statusFilter === 'all' ? 'All Status' : 'Active Only'}
                            </Button>
                        </div>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name / Address</TableHead>
                                <TableHead>Target Wallet</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Session</TableHead>
                                <TableHead>Policy</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAgents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No agents found matching your filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAgents.map((agent) => (
                                    <TableRow key={agent.id} className="group">
                                        <TableCell>
                                            <div className="flex items-center space-x-3">
                                                <div className="h-8 w-8 rounded-full bg-brand-purple/10 flex items-center justify-center">
                                                    <Bot className="h-4 w-4 text-brand-purple" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-brand-purple-light">{agent.name}</div>
                                                    <div className="font-mono text-xs text-muted-foreground">{agent.address}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-mono bg-zinc-900 border-zinc-800 font-normal">
                                                {agent.walletName}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <div className={`h-2 w-2 rounded-full ${getStatusColor(agent.status)}`} />
                                                <span className="capitalize">{agent.status}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-1.5 text-muted-foreground">
                                                <Clock className="h-3.5 w-3.5" />
                                                <span>{agent.status === 'active' ? getTimeRemaining(agent.sessionExpiresAt) : '—'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {agent.policyId ? (
                                                <div className="flex items-center space-x-1.5 text-zinc-300">
                                                    <Shield className="h-3.5 w-3.5" />
                                                    <span>{agent.policyId}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="group-hover:opacity-100 opacity-0 transition-opacity">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
