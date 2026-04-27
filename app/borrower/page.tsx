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
import { Spinner } from "@/components/ui/spinner";
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
import { UploadCloudIcon, FileTextIcon, XIcon } from "lucide-react";

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
  // Profile form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // CredifyScore form
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [category, setCategory] = useState("medical");
  const [sector, setSector] = useState("Healthcare");
  const [loading, setLoading] = useState(false);
  const [credifyScore, setCredifyScore] = useState<number | null>(null);
  const [credifyData, setCredifyData] = useState<any>(null);
  const [error, setError] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Get browser location automatically
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude.toString());
          setLon(position.coords.longitude.toString());
        },
        (err) => console.error("Geolocation error:", err),
      );
    }
  }, []);

  const handlePickPdf = (file: File | null) => {
    if (!file) {
      setPdfFile(null);
      return;
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a valid PDF file");
      setPdfFile(null);
      return;
    }
    // 10MB soft limit (can be increased if needed)
    if (file.size > 10 * 1024 * 1024) {
      setError("PDF is too large (max 10MB)");
      setPdfFile(null);
      return;
    }
    setError("");
    setPdfFile(file);
  };

  // Submit CredifyScore request
  const handleSubmitScore = async () => {
    if (!lat || !lon || !category || !sector) {
      setError("Please provide all fields");
      return;
    }
    if (!pdfFile) {
      setError("Please upload a bank statement PDF");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const form = new FormData();
      form.append("lat", lat);
      form.append("lon", lon);
      form.append("category", category);
      form.append("sectorName", sector);
      form.append("pdf", pdfFile, pdfFile.name);

      // Send multipart to our Next.js API, which forwards JSON+pdfPath to Orchestrator
      const response = await fetch("/api/credify-score", {
        method: "POST",
        body: form,
      });

      const data = await response.json();
      console.log("API RESPONSE:", data);

      if (!response.ok) {
        throw new Error(data.error || "Server error");
      }

      // ✅ IMPORTANT FIX
      const result = data.data;

      setCredifyData(result); // 🔥 THIS WAS MISSING
      setCredifyScore(result.finalCredifyScore);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Profile Card */}
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
          <Button className="bg-primary text-primary-foreground">Save</Button>
        </CardContent>
      </Card>

      {/* Notifications Card */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Receive EMI reminders and receipts.
          </div>
          <Button variant="outline">Update Preferences</Button>
        </CardContent>
      </Card>

      {/* CredifyScore Card */}
      <Card className="md:col-span-2 shadow-xl border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            🎯 Credify AI Risk Engine
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* INPUT SECTION */}
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Latitude" value={lat} disabled />
            <Input placeholder="Longitude" value={lon} disabled />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="medical">Medical</option>
              <option value="restaurant">Restaurant</option>
              <option value="pharmacy">Pharmacy</option>
              <option value="clothing_store">Clothing Store</option>
              <option value="bank">Bank</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Sector</label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="Healthcare">Healthcare</option>
              <option value="Retail">Retail</option>
              <option value="Finance">Finance</option>
              <option value="Hospitality">Hospitality</option>
            </select>
          </div>

          {/* PDF Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Bank statement (PDF)</label>
            <div
              onDragEnter={() => setIsDragOver(true)}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const f = e.dataTransfer.files?.[0] ?? null;
                handlePickPdf(f);
              }}
              className={[
                "group relative overflow-hidden rounded-xl border border-primary/15 bg-gradient-to-br from-primary/5 to-purple-500/5 p-4 transition-all",
                "hover:shadow-md hover:ring-1 hover:ring-primary/25",
                isDragOver ? "ring-2 ring-primary/40 shadow-lg scale-[1.01]" : "",
              ].join(" ")}
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-all group-hover:bg-primary/15" />

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
                    <UploadCloudIcon className="size-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold">
                      {pdfFile ? "PDF selected" : "Upload a PDF"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Drag & drop here or choose a file (max 10MB)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {pdfFile ? (
                    <button
                      type="button"
                      onClick={() => handlePickPdf(null)}
                      className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs transition hover:bg-accent"
                    >
                      <XIcon className="size-3.5" />
                      Remove
                    </button>
                  ) : null}

                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90">
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      className="hidden"
                      onChange={(e) => handlePickPdf(e.target.files?.[0] ?? null)}
                    />
                    <FileTextIcon className="size-4" />
                    Choose PDF
                  </label>
                </div>
              </div>

              {pdfFile ? (
                <div className="mt-3 flex items-center justify-between rounded-lg border bg-background/60 px-3 py-2 text-xs">
                  <div className="truncate">
                    <span className="font-medium">{pdfFile.name}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      • {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                  <div className="text-muted-foreground">Ready</div>
                </div>
              ) : null}
            </div>
          </div>

          {error && <p className="text-red-500">{error}</p>}

          <Button
            onClick={handleSubmitScore}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Spinner className="text-primary-foreground" />
                Uploading & calculating...
              </>
            ) : (
              "🚀 Calculate Credify Score"
            )}
          </Button>

          {/* SCORE DISPLAY */}
          {credifyData && (
            <div className="mt-6 space-y-6">
              {/* FINAL SCORE */}
              <div className="flex justify-center">
                <div className="relative w-40 h-40 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white shadow-2xl">
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {credifyData.finalCredifyScore}
                    </div>
                    <div className="text-xs uppercase tracking-wider">
                      Credify Score
                    </div>
                  </div>
                </div>
              </div>

              {/* SCORE CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Competitor */}
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-red-600">
                      🏪 Competitor
                    </span>
                    <span className="text-lg font-bold">
                      {credifyData.competitorScore}/35
                    </span>
                  </div>

                  <div className="mt-2 h-2 bg-red-200 rounded-full">
                    <div
                      className="h-2 bg-red-500 rounded-full transition-all duration-700"
                      style={{
                        width: `${(credifyData.competitorScore / 35) * 100}%`,
                      }}
                    />
                  </div>

                  {/* Insights */}
                  <div className="mt-3 text-xs">
                    <p className="font-semibold mb-1">Insights</p>
                    <ul className="list-disc ml-4">
                      {credifyData.competitorInsights?.map(
                        (i: string, idx: number) => (
                          <li key={idx}>{i}</li>
                        ),
                      )}
                    </ul>
                  </div>

                  {/* Suggestions */}
                  <div className="mt-2 text-xs">
                    <p className="font-semibold mb-1">Suggestions</p>
                    <ul className="list-disc ml-4">
                      {credifyData.competitorSuggestions?.map(
                        (s: string, idx: number) => (
                          <li key={idx}>{s}</li>
                        ),
                      )}
                    </ul>
                  </div>
                </div>

                {/* Personal */}
                <div className="p-4 rounded-xl bg-green-50 border border-green-200 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-green-600">
                      💳 Personal
                    </span>
                    <span className="text-lg font-bold">
                      {credifyData.personalScore}/35
                    </span>
                  </div>

                  <div className="mt-2 h-2 bg-green-200 rounded-full">
                    <div
                      className="h-2 bg-green-500 rounded-full transition-all duration-700"
                      style={{
                        width: `${(credifyData.personalScore / 35) * 100}%`,
                      }}
                    />
                  </div>

                  <div className="mt-3 text-xs">
                    <p className="font-semibold mb-1">Insights</p>
                    <ul className="list-disc ml-4">
                      {credifyData.personalInsights?.map(
                        (i: string, idx: number) => (
                          <li key={idx}>{i}</li>
                        ),
                      )}
                    </ul>
                  </div>

                  <div className="mt-2 text-xs">
                    <p className="font-semibold mb-1">Suggestions</p>
                    <ul className="list-disc ml-4">
                      {credifyData.personalSuggestions?.map(
                        (s: string, idx: number) => (
                          <li key={idx}>{s}</li>
                        ),
                      )}
                    </ul>
                  </div>
                </div>

                {/* Sector */}
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-blue-600">
                      📈 Sector
                    </span>
                    <span className="text-lg font-bold">
                      {credifyData.sectorScore.score}/30
                    </span>
                  </div>

                  <div className="mt-2 h-2 bg-blue-200 rounded-full">
                    <div
                      className="h-2 bg-blue-500 rounded-full transition-all duration-700"
                      style={{
                        width: `${(credifyData.sectorScore.score / 30) * 100}%`,
                      }}
                    />
                  </div>

                  <div className="mt-3 text-xs text-gray-600">
                    Sector: {credifyData.sectorScore.sector}
                  </div>
                </div>
              </div>
            </div>
          )}
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
