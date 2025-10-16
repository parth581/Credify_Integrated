"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RazorpayPayment } from "@/components/razorpay-payment"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts"

export function ActiveLoanCard() {
  const paid = 45
  const remaining = 100 - paid

  const handlePaymentSuccess = (paymentId: string) => {
    console.log("Payment successful with ID:", paymentId)
    alert(`Payment successful! Payment ID: ${paymentId}`)
  }

  const handlePaymentError = (error: string) => {
    console.error("Payment failed:", error)
    alert(`Payment failed: ${error}`)
  }

  // Updated chart data
  const loanProgressData = [
    { name: "Paid", value: paid, color: "#00F5D4" },
    { name: "Remaining", value: remaining, color: "#94A3B8" },
  ]

  const paymentTimelineData = [
    { month: "Jun", Paid: 220, Expected: 220 },
    { month: "Jul", Paid: 220, Expected: 220 },
    { month: "Aug", Paid: 220, Expected: 220 },
    { month: "Sep", Paid: 0, Expected: 220 },
    { month: "Oct", Paid: 0, Expected: 220 },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Loan Repayment Progress</CardTitle>
      </CardHeader>

      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart (Paid vs Remaining) */}
        <div className="flex flex-col items-center justify-center">
          <h3 className="text-sm font-medium mb-2 text-muted-foreground">Loan Status Overview</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={loanProgressData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                innerRadius={50}
                label={(props: { name?: string; percent?: unknown }) => {
                  const name = props.name ?? ""
                  const percentValue = typeof props.percent === "number" ? props.percent : 0
                  return `${name}: ${(percentValue * 100).toFixed(0)}%`
                }}
              >
                {loanProgressData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Loan Info + Payment Button */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground">Amount Remaining</div>
              <div className="font-medium">$6,600</div>
            </div>
            <div>
              <div className="text-muted-foreground">Next EMI Due</div>
              <div className="font-medium">2025-10-15</div>
            </div>
            <div>
              <div className="text-muted-foreground">EMI Amount</div>
              <div className="font-medium">$220</div>
            </div>
          </div>
          <RazorpayPayment
            amount={220}
            currency="INR"
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            className="bg-primary text-primary-foreground hover:opacity-90"
          >
            Pay Next EMI
          </RazorpayPayment>
        </div>
      </CardContent>

      {/* Bar Chart for Payment Timeline */}
      <CardContent className="mt-6">
        <h3 className="text-sm font-medium mb-2 text-muted-foreground">Payment Timeline</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={paymentTimelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Expected" fill="#94A3B8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Paid" fill="#00F5D4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
