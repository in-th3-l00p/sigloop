import { useWallets } from "@/lib/queries"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet as WalletIcon, Copy, Plus, MoreVertical, ExternalLink } from "lucide-react"

export function Wallets() {
    const { data: wallets, isLoading } = useWallets()

    if (isLoading || !wallets) {
        return <div className="space-y-4 animate-pulse">
            <div className="h-10 w-48 bg-muted rounded"></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(i => <div key={i} className="h-48 bg-muted rounded-xl"></div>)}
            </div>
        </div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Wallets</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Create and manage your ERC-4337 smart wallets.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Wallet
                </Button>
            </div>

            {wallets.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-xl bg-card/50">
                    <WalletIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No wallets found</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-4 text-center max-w-sm">
                        You don't have any wallets configured yet. Create one to start provisioning agents.
                    </p>
                    <Button>Create your first wallet</Button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {wallets.map((wallet) => (
                        <Card key={wallet.id} className="relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4">
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </div>
                            <CardHeader className="pb-3">
                                <div className="flex items-center space-x-2">
                                    <div className="h-8 w-8 rounded bg-brand-purple/20 flex items-center justify-center border border-brand-purple/30">
                                        <WalletIcon className="h-4 w-4 text-brand-purple-light" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{wallet.name}</CardTitle>
                                        <CardDescription className="flex items-center space-x-1 mt-0.5">
                                            <span className="font-mono text-xs">{wallet.address}</span>
                                            <Button variant="ghost" size="icon" className="h-4 w-4 ml-1">
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pb-3">
                                <div className="space-y-3 mt-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Chain</span>
                                        <Badge variant="outline" className="font-mono bg-zinc-900">
                                            {wallet.chain} ({wallet.chainId})
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Agents</span>
                                        <span className="font-medium">{wallet.agentCount} provisioned</span>
                                    </div>
                                    <div className="space-y-1.5 pt-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Daily Budget</span>
                                            <span>${wallet.budget.dailyUsed} / ${wallet.budget.dailyLimit}</span>
                                        </div>
                                        <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className={`h-1.5 rounded-full ${(wallet.budget.dailyUsed / wallet.budget.dailyLimit) > 0.8 ? 'bg-orange-400' : 'bg-brand-purple'}`}
                                                style={{ width: `${(wallet.budget.dailyUsed / wallet.budget.dailyLimit) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-3 border-t bg-muted/20">
                                <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                                    <span>Created {new Date(wallet.createdAt).toLocaleDateString()}</span>
                                    <Button variant="link" size="sm" className="h-auto p-0 text-brand-purple-light">
                                        View Details <ExternalLink className="ml-1 h-3 w-3" />
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
