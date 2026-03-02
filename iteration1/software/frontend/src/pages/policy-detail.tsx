import { useParams, Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/shared/copy-button"
import { usePolicy, useEncodePolicy } from "@/hooks/use-policies"

export function PolicyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: policy } = usePolicy(id!)
  const encode = useEncodePolicy()

  if (!policy) return null

  return (
    <div>
      <div className="mb-4">
        <Link to="/policies" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Policies
        </Link>
      </div>

      <PageHeader
        title={policy.name}
        actions={
          <Button
            variant="outline"
            onClick={() => encode.mutate(id!)}
            disabled={encode.isPending}
          >
            {encode.isPending ? "Encoding..." : "Encode for On-Chain"}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Policy Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Type:</span>
              <Badge variant="secondary">{policy.type}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Created: {new Date(policy.createdAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs font-mono bg-muted p-4 rounded-md overflow-x-auto">
            {JSON.stringify(policy.config, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {encode.data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Encoded Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-2">
              <code className="text-xs font-mono bg-muted p-4 rounded-md overflow-x-auto flex-1 break-all">
                {encode.data.encoded}
              </code>
              <CopyButton text={encode.data.encoded} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
