"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

export function NewLoanDialog() {
  const [isBusinessLoan, setIsBusinessLoan] = useState(false)
  const [amount, setAmount] = useState("")
  const [purpose, setPurpose] = useState("")
  const [duration, setDuration] = useState("")
  const [category, setCategory] = useState("")
  const [rate, setRate] = useState("")

  const [loans, setLoans] = useState<any[]>([])

  // Load existing loans from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("loanApplications")
    if (saved) setLoans(JSON.parse(saved))
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || !purpose || !duration || !rate || (isBusinessLoan && !category)) {
      toast?.error("Please fill all required fields.")
      return
    }

    const newLoan = {
      id: Date.now(), // unique ID for loan
      amount: parseFloat(amount),
      purpose,
      duration,
      rate: parseFloat(rate),
      isBusinessLoan,
      category: isBusinessLoan ? category : "Private",
      bids: [], // empty array to store future bids dynamically
      status: "Open",
      createdAt: new Date().toISOString(),
    }

    const updatedLoans = [...loans, newLoan]
    setLoans(updatedLoans)
    localStorage.setItem("loanApplications", JSON.stringify(updatedLoans))

    toast?.success("Loan application submitted successfully!")

    // Reset fields
    setAmount("")
    setPurpose("")
    setDuration("")
    setRate("")
    setCategory("")
    setIsBusinessLoan(false)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">+ Apply for a New Loan</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Loan Application</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Loan Amount</Label>
            <Input
              id="amount"
              type="number"
              inputMode="numeric"
              placeholder="e.g., 5000"
              min={0}
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Input id="purpose" placeholder="e.g., Business expansion" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          </div>

          <div className="grid gap-2">
            <Label>Duration</Label>
            <Select onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 months</SelectItem>
                <SelectItem value="12">12 months</SelectItem>
                <SelectItem value="18">18 months</SelectItem>
                <SelectItem value="24">24 months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label>Private / Business Loan</Label>
            <div className="flex items-center gap-2">
              <span className={!isBusinessLoan ? "font-medium" : "text-muted-foreground"}>Private</span>
              <Switch checked={isBusinessLoan} onCheckedChange={setIsBusinessLoan} />
              <span className={isBusinessLoan ? "font-medium" : "text-muted-foreground"}>Business</span>
            </div>
          </div>

          {isBusinessLoan && (
            <div className="grid gap-2">
              <Label>Business Category</Label>
              <Select onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select business category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="schools">Schools</SelectItem>
                  <SelectItem value="colleges">Colleges</SelectItem>
                  <SelectItem value="hospitals">Hospitals</SelectItem>
                  <SelectItem value="saloons">Saloons</SelectItem>
                  <SelectItem value="grocery">Grocery Stores</SelectItem>
                  <SelectItem value="restaurants">Restaurants</SelectItem>
                  <SelectItem value="garments">Garment Shops</SelectItem>
                  <SelectItem value="electronics">Electronics Stores</SelectItem>
                  <SelectItem value="pharmacy">Pharmacy</SelectItem>
                  <SelectItem value="stationery">Stationery Shops</SelectItem>
                  <SelectItem value="cafes">Cafés</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="rate">Max Affordable Interest Rate</Label>
            <Input
              id="rate"
              type="number"
              inputMode="decimal"
              placeholder="e.g., 12"
              min={0}
              step="0.01"
              value={rate}
              onChange={(e) => setRate(e.target.value.replace(/[^0-9.]/g, ""))}
            />
          </div>

          <DialogFooter>
            <Button type="submit" className="bg-primary text-primary-foreground hover:opacity-90">
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
