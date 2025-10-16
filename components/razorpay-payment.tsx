"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

declare global {
  interface Window {
    Razorpay: any
  }
}

interface RazorpayPaymentProps {
  amount: number
  currency?: string
  onSuccess?: (paymentId: string) => void
  onError?: (error: string) => void
  children?: React.ReactNode
  className?: string
}

export function RazorpayPayment({
  amount,
  currency = "INR",
  onSuccess,
  onError,
  children,
  className
}: RazorpayPaymentProps) {
  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.onload = () => {
      console.log("Razorpay script loaded successfully")
    }
    script.onerror = () => {
      console.error("Failed to load Razorpay script")
    }
    document.body.appendChild(script)

    // Debug: Check if environment variables are loaded
    console.log("Environment check:")
    console.log("NEXT_PUBLIC_RAZORPAY_KEY_ID:", process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID)
    console.log("RAZORPAY_SECRET:", process.env.RAZORPAY_SECRET)

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
      if (existingScript) {
        document.body.removeChild(existingScript)
      }
    }
  }, [])

  const handlePayment = async () => {
    try {
      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        onError?.("Razorpay SDK not loaded. Please try again.")
        return
      }

      // Get the Razorpay key
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      if (!razorpayKey) {
        onError?.("Razorpay key not found. Please check your environment variables.")
        return
      }

      console.log("Using Razorpay key:", razorpayKey)

      // For test mode, we'll create a simple payment without order_id
      // This should work with test keys
      const options = {
        key: razorpayKey,
        amount: amount * 100, // Razorpay expects amount in paise
        currency: currency,
        name: "Credify",
        description: "EMI Payment",
        image: "https://via.placeholder.com/150", // Optional: add your logo
        handler: function (response: any) {
          console.log("Payment successful:", response)
          onSuccess?.(response.razorpay_payment_id)
        },
        prefill: {
          name: "Alex",
          email: "alex@example.com",
          contact: "9999999999"
        },
        notes: {
          address: "Test Address",
          merchant_order_id: `order_${Date.now()}`
        },
        theme: {
          color: "#7C3AED"
        },
        modal: {
          ondismiss: function() {
            console.log("Payment modal closed")
          }
        },
        retry: {
          enabled: true,
          max_count: 3
        }
      }

      console.log("Opening Razorpay with options:", options)
      const razorpay = new window.Razorpay(options)
      razorpay.on('payment.failed', function (response: any) {
        console.error("Payment failed:", response.error)
        onError?.(response.error.description || "Payment failed")
      })
      razorpay.open()
    } catch (error) {
      console.error("Payment error:", error)
      onError?.(error instanceof Error ? error.message : "Payment failed")
    }
  }

  return (
    <Button onClick={handlePayment} className={className}>
      {children || "Pay Now"}
    </Button>
  )
}
