"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { BorrowerSidebar } from "@/components/borrower/sidebar";
import { ActiveLoanCard } from "@/components/borrower/active-loan-card";
import { NewLoanDialog } from "@/components/borrower/new-loan-dialog";
import { RazorpayPayment } from "@/components/razorpay-payment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ChatBot from "@/components/assistant/ChatBot";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface Loan {
  id: number;
  amount: number;
  purpose: string;
  duration: string;
  rate: number;
  isBusinessLoan: boolean;
  category: string;
  bids: any[];
  status: string;
  createdAt: string;
}

// -------------------- Overview Component --------------------
function Overview() {
  const loanDetails = {
    id: "BRW-1024",
    principal: 300000,
    rate: 12,
    duration: 12,
    purpose: "Bike for delivery",
  };

  const simpleInterest =
    (loanDetails.principal * loanDetails.rate * loanDetails.duration) /
    (100 * 12);

  const totalAmount = loanDetails.principal + simpleInterest;

  const monthlyEMI = Math.round(totalAmount / loanDetails.duration);

  const lastPaymentDate = new Date("2025-09-15");
  const nextEMIDate = new Date(lastPaymentDate);
  nextEMIDate.setMonth(nextEMIDate.getMonth() + 1);
  const nextEMIDateString = nextEMIDate.toISOString().split("T")[0];

  const [loans, setLoans] = useState<Loan[]>([]);

  // 🔹 Load Loans
  const loadLoans = () => {
    const savedLoans = localStorage.getItem("loanApplications");
    if (savedLoans) {
      setLoans(JSON.parse(savedLoans));
    }
  };

  useEffect(() => {
    loadLoans();
  }, []);

  // 🔹 Called when loan submitted
  const handleLoanSubmitted = () => {
    loadLoans(); // refresh UI
    alert("Loan request submitted successfully ✅");
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="text-lg font-semibold">Hello, Parth!</div>

        {/* 👇 Pass callback */}
        <NewLoanDialog onLoanSubmitted={handleLoanSubmitted} />
      </header>

      <ActiveLoanCard />

      {/* Submitted Loans */}
      <section>
        <div className="mb-2 text-sm font-medium">Your Loan Applications</div>

        <div className="grid gap-4">
          {loans.length === 0 && <p>No loans submitted yet.</p>}

          {loans.map((loan) => (
            <Card key={loan.id} className="p-4">
              <p>
                <strong>Amount:</strong> ₹{loan.amount} |{" "}
                <strong>Purpose:</strong> {loan.purpose}
              </p>
              <p>
                <strong>Duration:</strong> {loan.duration} months |{" "}
                <strong>Rate:</strong> {loan.rate}% | <strong>Status:</strong>{" "}
                {loan.status}
              </p>
              <p>
                <strong>Bids:</strong> {loan.bids?.length || 0}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Interest Rate Trends */}
      <section>
        <div className="mb-2 text-sm font-medium">Interest Rate Trends</div>
        <Card className="transition-all hover:shadow-md hover:ring-1 hover:ring-primary/25">
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={[
                  { time: "Start", rate: 14 },
                  { time: "12:00", rate: 13.5 },
                  { time: "12:10", rate: 13.2 },
                  { time: "12:20", rate: 12.8 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={["auto", "auto"]} />
                <Tooltip />
                <Line type="monotone" dataKey="rate" stroke="#82ca9d" dot />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      {/* Payment History */}
      <section>
        <div className="mb-2 text-sm font-medium">Payment History</div>
        <Card className="transition-all hover:shadow-md hover:ring-1 hover:ring-primary/25">
          <CardContent className="overflow-x-auto p-0">
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
                  {
                    date: "2025-09-15",
                    amount: `₹${monthlyEMI.toLocaleString()}`,
                    status: "Successful",
                  },
                  {
                    date: "2025-08-15",
                    amount: `₹${monthlyEMI.toLocaleString()}`,
                    status: "Successful",
                  },
                  {
                    date: "2025-07-15",
                    amount: `₹${monthlyEMI.toLocaleString()}`,
                    status: "Successful",
                  },
                ].map((row) => (
                  <tr key={row.date} className="border-t border-border/70">
                    <td className="px-3 py-2">{row.date}</td>
                    <td className="px-3 py-2">{row.amount}</td>
                    <td className="px-3 py-2">
                      <span className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground">
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
    </div>
  );
}
// -------------------- Payments Component --------------------
function Payments() {
  const loanDetails = {
    principal: 300000,
    rate: 12,
    duration: 12,
  };

  const simpleInterest =
    (loanDetails.principal * loanDetails.rate * loanDetails.duration) /
    (100 * 12);

  const totalAmount = loanDetails.principal + simpleInterest;
  const monthlyEMI = Math.round(totalAmount / loanDetails.duration);

  const loanStartDate = new Date("2025-07-15");
  const loanStartDateString = loanStartDate.toISOString().split("T")[0];

  const lastPaymentDate = new Date("2025-09-15");
  const nextEMIDate = new Date(lastPaymentDate);
  nextEMIDate.setMonth(nextEMIDate.getMonth() + 1);
  const nextEMIDateString = nextEMIDate.toISOString().split("T")[0];

  const handlePaymentSuccess = (paymentId: string) => {
    alert(`Payment successful! Payment ID: ${paymentId}`);
  };

  const handlePaymentError = (error: string) => {
    alert(`Payment failed: ${error}`);
  };

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>Loan Start Date: {loanStartDateString}</div>
          <div>Next EMI: {nextEMIDateString}</div>
          <div>Amount: ₹{monthlyEMI.toLocaleString()}</div>

          <RazorpayPayment
            amount={monthlyEMI}
            currency="INR"
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </CardContent>
      </Card>
    </section>
  );
}

// -------------------- Settings Component --------------------
function Settings() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button>Save</Button>
        </CardContent>
      </Card>
    </section>
  );
}

// -------------------- Main BorrowerDashboard --------------------
export default function BorrowerDashboard() {
  const sp = useSearchParams();
  const tab = sp.get("tab");

  const active =
    tab === "payments"
      ? "Payments"
      : tab === "settings"
      ? "Settings"
      : "Overview";

  return (
    <div className="theme-borrower">
      <div className="flex min-h-screen">
        <BorrowerSidebar active={active} />
        <main className="mx-auto flex-1 space-y-6 p-6">
          <BackButton />
          {active === "Overview" && <Overview />}
          {active === "Payments" && <Payments />}
          {active === "Settings" && <Settings />}
        </main>
      </div>
      <ChatBot />
    </div>
  );
}
