"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { LenderSidebar } from "@/components/lender/sidebar"
import { RazorpayPayment } from "@/components/razorpay-payment"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { BackButton } from "@/components/ui/back-button"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

interface Loan {
  id: number
  amount: number
  purpose: string
  rate: number
  duration: number
  distance?: string
  bids: { time: string; rate: number }[]
  isBusinessLoan?: boolean
  category?: string
  status: string
  createdAt: string
}

// -------------------- Marketplace Section --------------------
function MarketplaceSection() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [bidRates, setBidRates] = useState<{ [key: number]: string }>({})

  // Load loans from localStorage
  useEffect(() => {
    const savedLoans = localStorage.getItem("loanApplications")
    if (savedLoans) {
      const parsedLoans: Loan[] = JSON.parse(savedLoans).map((loan: any) => ({
        ...loan,
        duration: Number(loan.duration),
        bids: loan.bids || [],
        distance: loan.distance || "N/A",
      }))
      setLoans(parsedLoans)
    }
  }, [])

  const handleBid = (loanId: number) => {
    const newRate = parseFloat(bidRates[loanId])
    if (!newRate || newRate <= 0) {
      alert("Please enter a valid bid rate.")
      return
    }

    const updatedLoans = loans.map((loan) => {
      if (loan.id === loanId && newRate < loan.rate) {
        return {
          ...loan,
          rate: newRate,
          bids: [...loan.bids, { time: new Date().toLocaleTimeString(), rate: newRate }],
        }
      }
      return loan
    })

    setLoans(updatedLoans)
    setBidRates((prev) => ({ ...prev, [loanId]: "" }))

    // Save updated loans back to localStorage
    localStorage.setItem("loanApplications", JSON.stringify(updatedLoans))
  }

  const handleFundingSuccess = (paymentId: string, loanId: number, amount: number) => {
    alert(`Loan funded successfully!\nPayment ID: ${paymentId}\nLoan ID: ${loanId}\nAmount: $${amount}`)
  }

  const handleFundingError = (error: string) => {
    alert(`Funding failed: ${error}`)
  }

  return (
    <>
      <header className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <h1 className="text-2xl font-semibold">Loan Application Marketplace</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search by location"
            className="w-40 bg-violet-50 border-violet-300 text-violet-900"
          />
          <Select>
            <SelectTrigger className="w-40 bg-violet-50 border-violet-300 text-violet-900">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-40 bg-violet-50 border-violet-300 text-violet-900">
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
        {loans.map((loan) => (
          <Card key={loan.id.toString()} className="bg-card transition-all hover:shadow-md hover:ring-1 hover:ring-primary/25">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{loan.purpose}</span>
                <Badge variant="secondary">{loan.distance}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">Borrower ID: {loan.id}</div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Amount</div>
                  <div className="font-medium">${loan.amount.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Rate</div>
                  <div className="font-medium">{loan.rate}%</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Duration</div>
                  <div className="font-medium">{loan.duration} mo</div>
                </div>
              </div>

              {/* Bid Input */}
              <div className="flex items-center gap-2 pt-2">
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Bid rate (%)"
                  value={bidRates[loan.id] || ""}
                  onChange={(e) =>
                    setBidRates((prev) => ({ ...prev, [loan.id]: e.target.value }))
                  }
                  className="w-24 bg-violet-50 border-violet-300 text-violet-900"
                />
                <Button
                  onClick={() => handleBid(loan.id)}
                  variant="secondary"
                  className="bg-violet-200 text-violet-900 hover:bg-violet-300"
                >
                  Bid
                </Button>
              </div>

              {/* Rate Trend Graph */}
              <div className="h-40 pt-2">
                {loan.bids.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={loan.bids}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={["auto", "auto"]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="rate" stroke="#A085FF" dot />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-16">
                    No bids yet
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline">View Details</Button>
                <RazorpayPayment
                  amount={loan.amount}
                  currency="USD"
                  onSuccess={(paymentId) => handleFundingSuccess(paymentId, loan.id, loan.amount)}
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

// -------------------- Portfolio Section --------------------
function PortfolioSection() {
  const portfolioStats = [
    { label: "Total Investment", value: "$27,300" },
    { label: "Active Loans", value: "12" },
    { label: "Avg Interest Rate", value: "12.7%" },
    { label: "Total Returns", value: "$3,420" },
  ]

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
    </section>
  )
}

// -------------------- Payments Section --------------------
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
              {[{ date: "2025-09-30", amount: "$320", status: "Settled" }].map((r) => (
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

// -------------------- Settings Section --------------------
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
          <div className="text-sm text-muted-foreground">
            Email me monthly statements and new opportunities.
          </div>
          <Button variant="outline">Update Preferences</Button>
        </CardContent>
      </Card>
    </section>
  )
}

// -------------------- Main Lender Dashboard --------------------
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
