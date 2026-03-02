import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { MetricCard } from "@/components/shared/metric-card"
import { StatusDot } from "@/components/shared/status-dot"
import { ChainBadge } from "@/components/shared/chain-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { BudgetBar } from "@/components/shared/budget-bar"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

describe("MetricCard", () => {
  it("renders label and value", () => {
    render(<MetricCard label="Wallets" value={5} />)
    expect(screen.getByText("Wallets")).toBeInTheDocument()
    expect(screen.getByText("5")).toBeInTheDocument()
  })

  it("renders description when provided", () => {
    render(<MetricCard label="Total" value="$100" description="today" />)
    expect(screen.getByText("today")).toBeInTheDocument()
  })
})

describe("StatusDot", () => {
  it("renders status text", () => {
    render(<StatusDot status="active" />)
    expect(screen.getByText("active")).toBeInTheDocument()
  })

  it("renders different statuses", () => {
    const { rerender } = render(<StatusDot status="revoked" />)
    expect(screen.getByText("revoked")).toBeInTheDocument()
    rerender(<StatusDot status="expired" />)
    expect(screen.getByText("expired")).toBeInTheDocument()
  })
})

describe("ChainBadge", () => {
  it("renders chain name and id", () => {
    render(<ChainBadge chainId={8453} />)
    expect(screen.getByText("Base (8453)")).toBeInTheDocument()
  })

  it("renders unknown chains", () => {
    render(<ChainBadge chainId={99999} />)
    expect(screen.getByText("Chain 99999 (99999)")).toBeInTheDocument()
  })
})

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(
      <EmptyState
        icon={<span>icon</span>}
        title="No items"
        description="Create your first item"
      />,
    )
    expect(screen.getByText("No items")).toBeInTheDocument()
    expect(screen.getByText("Create your first item")).toBeInTheDocument()
  })

  it("renders action button when provided", () => {
    render(
      <EmptyState
        icon={<span>icon</span>}
        title="Empty"
        description="Nothing here"
        action="Create"
        onAction={() => {}}
      />,
    )
    expect(screen.getByText("Create")).toBeInTheDocument()
  })
})

describe("BudgetBar", () => {
  it("renders label and amounts", () => {
    render(<BudgetBar spent={67} limit={100} label="Daily" />)
    expect(screen.getByText("Daily")).toBeInTheDocument()
    expect(screen.getByText("67%")).toBeInTheDocument()
  })
})

describe("PageHeader", () => {
  it("renders title", () => {
    render(<PageHeader title="Dashboard" />)
    expect(screen.getByText("Dashboard")).toBeInTheDocument()
  })

  it("renders description when provided", () => {
    render(<PageHeader title="Settings" description="Configure your app" />)
    expect(screen.getByText("Configure your app")).toBeInTheDocument()
  })
})

describe("UI Components", () => {
  it("Button renders children", () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText("Click me")).toBeInTheDocument()
  })

  it("Badge renders children", () => {
    render(<Badge>agent</Badge>)
    expect(screen.getByText("agent")).toBeInTheDocument()
  })

  it("Card renders content", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
        </CardHeader>
        <CardContent>Content</CardContent>
      </Card>,
    )
    expect(screen.getByText("Title")).toBeInTheDocument()
    expect(screen.getByText("Content")).toBeInTheDocument()
  })
})
