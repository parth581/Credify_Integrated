"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

export function NewLoanDialog() {
  const [isBusinessLoan, setIsBusinessLoan] = useState(false)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">+ Apply for a New Loan</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Loan Application</DialogTitle>
        </DialogHeader>

        <form className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Loan Amount</Label>
            <Input
              id="amount"
              type="number"
              inputMode="numeric"
              placeholder="e.g., 5000"
              min={0}
              step="1"
              onKeyDown={(e) => {
                // Block minus, plus, exponent, and non-numeric characters
                const blocked = ["-", "+", "e", "E"]
                if (blocked.includes(e.key)) e.preventDefault()
              }}
              onInput={(e) => {
                const target = e.currentTarget
                // Remove non-digits
                target.value = target.value.replace(/[^0-9]/g, "")
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Input id="purpose" placeholder="e.g., Business expansion" />
          </div>

          <div className="grid gap-2">
            <Label>Duration</Label>
            <Select>
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

          {/* Loan Type Toggle */}
          <div className="flex items-center justify-between">
            <Label>Private / Business Loan</Label>
            <div className="flex items-center gap-2">
              <span className={!isBusinessLoan ? "font-medium" : "text-muted-foreground"}>Private</span>
              <Switch checked={isBusinessLoan} onCheckedChange={setIsBusinessLoan} />
              <span className={isBusinessLoan ? "font-medium" : "text-muted-foreground"}>Business</span>
            </div>
          </div>

          {/* Business Category Dropdown (shown only when Business Loan is selected) */}
          {isBusinessLoan && (
            <div className="grid gap-2">
              <Label>Business Category</Label>
              <Select>
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
              onKeyDown={(e) => {
                const blocked = ["-", "+", "e", "E"]
                if (blocked.includes(e.key)) e.preventDefault()
              }}
              onInput={(e) => {
                const target = e.currentTarget
                // Keep digits and at most one dot
                let v = target.value.replace(/[^0-9.]/g, "")
                const parts = v.split(".")
                if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("")
                target.value = v
              }}
            />
          </div>
        </form>

        <DialogFooter>
          <Button className="bg-primary text-primary-foreground hover:opacity-90">Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
