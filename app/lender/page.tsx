"use client"

import { useSearchParams } from "next/navigation"
import { LenderSidebar } from "@/components/lender/sidebar"
import { RazorpayPayment } from "@/components/razorpay-payment"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DonutChart } from "@/components/charts/donut"
import { BarBasicChart } from "@/components/charts/bar-basic"
import { Badge } from "@/components/ui/badge"
import { BackButton } from "@/components/ui/back-button"

const marketplace = [
  { id: "BRW-1024", amount: 3000, purpose: "Bike for delivery", rate: 12, duration: 12, distance: "2.1 km" },
  { id: "BRW-2048", amount: 8500, purpose: "Coffee cart expansion", rate: 14, duration: 18, distance: "5.3 km" },
  { id: "BRW-4096", amount: 12000, purpose: "Home renovation", rate: 11, duration: 24, distance: "1.8 km" },
]

const portfolioStats = [
  { label: "Total Investment", value: "$27,300" },
  { label: "Active Loans", value: "12" },
  { label: "Avg Interest Rate", value: "12.7%" },
  { label: "Total Returns", value: "$3,420" },
]

function MarketplaceSection() {
  const handleFundingSuccess = (paymentId: string, loanId: string, amount: number) => {
    console.log("Funding successful:", { paymentId, loanId, amount })
    alert(`Loan funded successfully! Payment ID: ${paymentId}\nLoan ID: ${loanId}\nAmount: $${amount}`)
  }

  const handleFundingError = (error: string) => {
    console.error("Funding failed:", error)
    alert(`Funding failed: ${error}`)
  }

  return (
    <>
      <header className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <h1 className="text-2xl font-semibold">Loan Application Marketplace</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Input placeholder="Search by location" className="w-40" />
          <Select>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Loan amount" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0-5k">$0 - $5k</SelectItem>
              <SelectItem value="5-10k">$5k - $10k</SelectItem>
              <SelectItem value="10k+">$10k+</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {marketplace.map((m) => (
          <Card key={m.id} className="bg-card transition-all hover:shadow-md hover:ring-1 hover:ring-primary/25">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{m.purpose}</span>
                <Badge variant="secondary">{m.distance}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground">Borrower ID: {m.id}</div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Amount</div>
                  <div className="font-medium">${m.amount.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Rate</div>
                  <div className="font-medium">{m.rate}%</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Duration</div>
                  <div className="font-medium">{m.duration} mo</div>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline">View Details</Button>
                <RazorpayPayment
                  amount={m.amount}
                  currency="USD"
                  onSuccess={(paymentId) => handleFundingSuccess(paymentId, m.id, m.amount)}
                  onError={handleFundingError}
                  className="bg-primary text-primary-foreground hover:opacity-90"
                >
                  Fund Loan
                </RazorpayPayment>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </>
  )
}

function PortfolioSection() {
  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>My Portfolio</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {portfolioStats.map((s) => (
            <div key={s.label} className="rounded-lg bg-secondary p-4">
              <div className="text-sm text-muted-foreground">{s.label}</div>
              <div className="text-lg font-semibold">{s.value}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Loan Status</CardTitle>
        </CardHeader>
        <CardContent>
          <DonutChart
            data={[
              { name: "Active", value: 12, color: "var(--color-chart-1)" },
              { name: "Completed", value: 8, color: "var(--color-chart-3)" },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Monthly EMI Collections</CardTitle>
        </CardHeader>
        <CardContent>
          <BarBasicChart
            data={[
              { name: "Jan", value: 1200 },
              { name: "Feb", value: 1400 },
              { name: "Mar", value: 1600 },
              { name: "Apr", value: 1800 },
              { name: "May", value: 1500 },
              { name: "Jun", value: 1900 },
            ]}
            color="var(--color-chart-1)"
          />
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Active Loans</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="px-3 py-2">Borrower ID</th>
                <th className="px-3 py-2">Amount Repaid</th>
                <th className="px-3 py-2">Next EMI Date</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: "BRW-1024", repaid: "$1,200", next: "2025-10-15", status: "On Track" },
                { id: "BRW-2048", repaid: "$5,600", next: "2025-10-20", status: "Delayed" },
                { id: "BRW-4096", repaid: "$9,300", next: "2025-10-10", status: "On Track" },
              ].map((row) => (
                <tr key={row.id} className="border-t border-border/70">
                  <td className="px-3 py-2">{row.id}</td>
                  <td className="px-3 py-2">{row.repaid}</td>
                  <td className="px-3 py-2">{row.next}</td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        row.status === "On Track"
                          ? "rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground"
                          : "rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground"
                      }
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </section>
  )
}

function PaymentsSection() {
  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Payouts</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { date: "2025-09-30", amount: "$320", status: "Settled" },
                { date: "2025-08-31", amount: "$305", status: "Settled" },
                { date: "2025-07-31", amount: "$298", status: "Settled" },
              ].map((r) => (
                <tr key={r.date} className="border-t border-border/70">
                  <td className="px-3 py-2">{r.date}</td>
                  <td className="px-3 py-2">{r.amount}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-md bg-secondary px-2 py-1 text-xs"> {r.status} </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </section>
  )
}

function SettingsSection() {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Full Name" />
          <Input placeholder="Email" type="email" />
          <Button className="bg-primary text-primary-foreground">Save</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">Email me monthly statements and new opportunities.</div>
          <Button variant="outline">Update Preferences</Button>
        </CardContent>
      </Card>
    </section>
  )
}

export default function LenderDashboard() {
  const sp = useSearchParams()
  const tab = sp.get("tab")
  const active =
    tab === "portfolio"
      ? "My Portfolio"
      : tab === "payments"
        ? "Payments"
        : tab === "settings"
          ? "Settings"
          : "Marketplace"

  return (
    <div className="theme-lender dark">
      <div className="flex min-h-screen">
        <LenderSidebar active={active} />
        <main className="flex-1 space-y-6 p-6">
          <div>
            <BackButton />
          </div>
          {active === "Marketplace" && <MarketplaceSection />}
          {active === "My Portfolio" && <PortfolioSection />}
          {active === "Payments" && <PaymentsSection />}
          {active === "Settings" && <SettingsSection />}
        </main>
      </div>
    </div>
  )
}
