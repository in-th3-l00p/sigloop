import { usePolicies } from "@/lib/queries"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, Plus, Layers, MoreVertical, Edit2 } from "lucide-react"

export function Policies() {
    const { data: policies, isLoading } = usePolicies()

    if (isLoading || !policies) {
        return <div className="space-y-4 animate-pulse">
            <div className="h-10 w-48 bg-muted rounded"></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(i => <div key={i} className="h-48 bg-muted rounded-xl"></div>)}
            </div>
        </div>
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'agent': return 'bg-brand-purple text-primary-foreground border-transparent'
            case 'x402': return 'bg-green-500/20 text-green-400 border-green-500/30'
            case 'spending': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
            default: return 'bg-zinc-800 text-zinc-300'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Policies</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Define and compose execution rules for your agents.</p>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline">
                        <Layers className="mr-2 h-4 w-4" />
                        Compose
                    </Button>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Policy
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {policies.map((policy) => (
                    <Card key={policy.id} className="relative group hover:border-brand-purple/50 transition-colors">
                        <div className="absolute top-0 right-0 p-4">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </div>

                        <CardHeader className="pb-3">
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="h-10 w-10 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800">
                                    <ShieldCheck className="h-5 w-5 text-brand-purple" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">{policy.name}</CardTitle>
                                </div>
                            </div>
                            <Badge variant="outline" className={`w-fit mt-2 ${getTypeColor(policy.type)}`}>
                                Type: {policy.type}
                            </Badge>
                        </CardHeader>

                        <CardContent className="pb-4">
                            <div className="space-y-2 text-sm">
                                {policy.type === 'agent' && (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Allowed Targets</span>
                                            <span className="font-medium">{policy.bounds}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Allowed Selectors</span>
                                            <span className="font-medium">5</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Max per tx</span>
                                            <span className="font-medium font-mono text-xs mt-0.5">0.01 ETH</span>
                                        </div>
                                    </>
                                )}
                                {policy.type === 'x402' && (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Allowed Domains</span>
                                            <span className="font-medium">{policy.bounds === 0 ? 'Any' : policy.bounds}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Per request cap</span>
                                            <span className="font-medium">$0.05 USDC</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Total Budget</span>
                                            <span className="font-medium">$500</span>
                                        </div>
                                    </>
                                )}
                                {policy.type === 'spending' && (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Daily Limit</span>
                                            <span className="font-medium">$100</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Weekly Limit</span>
                                            <span className="font-medium">$500</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Tokens</span>
                                            <span className="font-medium">USDC, ETH</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardContent>

                        <CardFooter className="pt-4 border-t bg-muted/20 flex justify-between items-center text-xs text-muted-foreground">
                            <span>Bound to {policy.bounds + 1} agents</span>
                            <Button variant="ghost" size="sm" className="h-8 px-2">
                                <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
