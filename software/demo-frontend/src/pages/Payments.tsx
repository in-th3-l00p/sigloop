import { usePayments } from "@/lib/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Download, Search, Filter } from "lucide-react"

export function Payments() {
    const { data: payments, isLoading } = usePayments()

    if (isLoading || !payments) {
        return <div className="space-y-4 animate-pulse">
            <div className="h-10 w-48 bg-muted rounded"></div>
            <div className="grid gap-4 md:grid-cols-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted rounded-xl"></div>)}
            </div>
            <div className="h-96 w-full bg-muted rounded-xl"></div>
        </div>
    }

    const formatTime = (isoString: string) => {
        const d = new Date(isoString);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Payments</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Monitor x402 API payment requests.</p>
                </div>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Total Paid</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$247.82</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Today</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">$18.42</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1,284</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Unique Domains</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center space-x-2 flex-1 max-w-sm relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search domain, agent, or wallet..."
                                className="pl-9"
                            />
                        </div>
                        <div className="flex space-x-2">
                            <Button variant="outline" size="sm" className="h-9">
                                <Filter className="mr-2 h-4 w-4" /> Date Range
                            </Button>
                        </div>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Time</TableHead>
                                <TableHead>Agent</TableHead>
                                <TableHead>Wallet</TableHead>
                                <TableHead>Domain</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments.map((payment) => (
                                <TableRow key={payment.id}>
                                    <TableCell className="text-muted-foreground">{formatTime(payment.timestamp)}</TableCell>
                                    <TableCell className="font-medium text-brand-purple-light">{payment.agentName}</TableCell>
                                    <TableCell className="font-mono text-xs">{payment.walletName}</TableCell>
                                    <TableCell>{payment.domain}</TableCell>
                                    <TableCell className="text-right font-medium">
                                        ${payment.amount.toFixed(3)} {payment.currency}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
