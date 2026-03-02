import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRightLeft, Database, Download, Upload, Target } from "lucide-react"

export function DeFi() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">DeFi Operations</h2>
                <p className="text-muted-foreground mt-1 text-sm">Encode and preview DeFi operations before execution.</p>
            </div>

            <div className="flex space-x-2 border-b border-border pb-4">
                <Button variant="default" className="bg-brand-purple text-white">
                    <ArrowRightLeft className="mr-2 h-4 w-4" /> Swap
                </Button>
                <Button variant="ghost" className="text-muted-foreground flex items-center gap-2">
                    <Upload className="h-4 w-4" /> Supply
                </Button>
                <Button variant="ghost" className="text-muted-foreground flex items-center gap-2">
                    <Download className="h-4 w-4" /> Borrow
                </Button>
                <Button variant="ghost" className="text-muted-foreground flex items-center gap-2">
                    <Database className="h-4 w-4" /> Repay
                </Button>
                <Button variant="ghost" className="text-muted-foreground flex items-center gap-2">
                    <Target className="h-4 w-4" /> Approve
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-border shadow-sm">
                    <CardHeader>
                        <CardTitle>Encode Swap</CardTitle>
                        <CardDescription>Generate calldata for a Uniswap V3 execution.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Token In
                            </label>
                            <Input placeholder="0x... or symbol (e.g. USDC)" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Amount In
                            </label>
                            <Input placeholder="100.0" type="number" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Token Out
                            </label>
                            <Input placeholder="0x... or symbol (e.g. WETH)" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Min Amount Out
                            </label>
                            <Input placeholder="0.038" type="number" />
                        </div>

                        <Button className="w-full mt-4">Generate Calldata</Button>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-950 border-zinc-900 shadow-inner">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Result</CardTitle>
                    </CardHeader>
                    <CardContent className="font-mono text-xs space-y-4 text-zinc-400 break-all">
                        <div>
                            <span className="text-zinc-600 block mb-1">To:</span>
                            <span className="text-zinc-300">0xE592427A0AEce92De3Edee1F18E0157C05861564</span>
                        </div>
                        <div>
                            <span className="text-zinc-600 block mb-1">Value:</span>
                            <span className="text-zinc-300">0</span>
                        </div>
                        <div>
                            <span className="text-zinc-600 block mb-1">Data:</span>
                            <span className="text-zinc-500">
                                0x414bf389000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda02913000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000000000000000000000000000000000000bb8000000000000000000000000bd9defad8cc8012b1cb576a8d6b82500be5aa3de0000000000000000000000000000000000000000000000000000000067c23400000000000000000000000000000000000000000000000000000de0b6b3a7640000000000000000000000000000000000000000000000000000037a3f5f3e70000000000000000000000000000000000000000000000000000000000000000000
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
