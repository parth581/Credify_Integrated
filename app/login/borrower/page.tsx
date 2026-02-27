"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { BackButton } from "@/components/ui/back-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Mail, Lock, ShieldCheck } from "lucide-react"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { authService } from "@/lib/auth-service"
import { borrowerService } from "@/lib/database-service"
import { geminiFaceService } from "@/lib/gemini-face-service"
import { faceComparisonService } from "@/lib/face-comparison-service"
import { otpService } from "@/lib/otp-service"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

export default function BorrowerLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [hasKyc, setHasKyc] = useState(false)
  const [kycInProgress, setKycInProgress] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [aadhaarImage, setAadhaarImage] = useState<string | null>(null)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [extractedAadhaarFace, setExtractedAadhaarFace] = useState<string | null>(null)
  const [isExtractingFace, setIsExtractingFace] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("")
  const [isSendingReset, setIsSendingReset] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const role = "borrower" as const
  const [otpStep, setOtpStep] = useState(false)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [otp, setOtp] = useState("")
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)

  // ✅ Check email-specific KYC status
  useEffect(() => {
    if (email) {
      setHasKyc(localStorage.getItem(`kyc:${role}:${email}`) === "true")
    }
  }, [email, role])

  // ✅ Sign In Logic with Firebase and KYC
  const signIn = async () => {
    // Prevent double submission
    if (isSendingOtp) {
      return
    }

    const emailValid = /^(?:[a-zA-Z0-9_'^&\+`{}~!-]+(?:\.[a-zA-Z0-9_'^&\+`{}~!-]+)*|\"(?:[^\"\\]|\\.)+\")@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(
      email.trim(),
    )
    const passwordValid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)

    if (!emailValid) {
      alert("Please enter a valid email address.")
      return
    }
    if (!passwordValid) {
      alert(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
      )
      return
    }

    try {
      // Try to sign in with Firebase first
      const result = await authService.signIn(email, password)
      
      if (result.success) {
        // Send OTP after successful authentication
        setIsSendingOtp(true)
        const otpResult = await otpService.sendLoginOtp(email, 'borrower')
        setIsSendingOtp(false)
        
        if (otpResult.success) {
          setOtpStep(true)
          alert(`OTP sent to ${email}\nPlease check your inbox and enter the 6-digit code.`)
        } else {
          alert(`Failed to send OTP: ${otpResult.message}`)
        }
      } else {
        // Sign in failed - try to register a new account
        if (result.error?.includes('user-not-found') || result.error?.includes('invalid-credential')) {
          try {
            const registerResult = await authService.register(email, password, "borrower", "Parth")
            
            if (registerResult.success) {
              // Send OTP after successful registration
              setIsSendingOtp(true)
              const otpResult = await otpService.sendLoginOtp(email, 'borrower')
              setIsSendingOtp(false)
              
              if (otpResult.success) {
                setOtpStep(true)
                alert(`OTP sent to ${email}\nPlease check your inbox and enter the 6-digit code.`)
              } else {
                alert(`Failed to send OTP: ${otpResult.message}`)
              }
            } else {
              // Handle specific registration errors
              if (registerResult.error?.includes('email-already-in-use')) {
                alert("❌ This email is already registered. Please use a different email address or try logging in.")
              } else {
                alert(`❌ Registration failed: ${registerResult.error}`)
              }
            }
          } catch (registerError) {
            console.error("Registration error:", registerError)
            alert("❌ Registration failed. Please try again.")
          }
        } else {
          // Other sign in errors
          if (result.error?.includes('wrong-password')) {
            alert("❌ Incorrect password. Please try again.")
          } else if (result.error?.includes('invalid-email')) {
            alert("❌ Invalid email format. Please check your email.")
          } else {
            alert(`❌ Login failed: ${result.error}`)
          }
        }
      }
    } catch (error) {
      console.error("Authentication error:", error)
      alert("❌ Authentication failed. Please try again.")
    }
  }

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      alert("Please enter the 6-digit OTP.")
      return
    }
    setIsVerifyingOtp(true)
    const res = await otpService.verifyLoginOtp(email, otp, 'borrower')
    setIsVerifyingOtp(false)
    if (!res.success) {
      alert(`❌ ${res.message}`)
      return
    }
    // Proceed with original post-sign-in borrower flow
    try {
      const currentUser = authService.getCurrentUser()
      if (!currentUser) {
        alert("Session expired. Please sign in again.")
        setOtpStep(false)
        return
      }

      const profileResult = await borrowerService.getBorrowerProfile(currentUser.uid)
      if (profileResult.success) {
        const userData = profileResult.data
        if (userData && userData.kycCompleted) {
          alert(`✅ Login successful! Welcome back, Parth!`)
          router.push("/borrower")
        } else {
          const hasKycInStorage = localStorage.getItem(`kyc:${role}:${email}`) === "true"
          if (hasKycInStorage) {
            try {
              await borrowerService.updateBorrowerProfile(currentUser.uid, { kycCompleted: true })
              alert(`✅ Login successful! Welcome back, Parth!`)
              router.push("/borrower")
            } catch (error) {
              console.error("Failed to update KYC status:", error)
              alert("✅ Login successful! Please complete KYC verification.")
              setKycInProgress(true)
            }
          } else {
            alert("✅ Login successful! Please complete KYC verification.")
            setKycInProgress(true)
          }
        }
      } else {
        const existingProfileResult = await borrowerService.getBorrowerProfileByEmail(email)
        if (existingProfileResult.success) {
          await borrowerService.updateBorrowerProfile(existingProfileResult.data!.uid, {
            uid: currentUser.uid,
            email: email,
            displayName: currentUser.displayName || "Parth"
          })
          if (existingProfileResult.data!.kycCompleted) {
            alert(`✅ Login successful! Welcome back, Parth!`)
            router.push("/borrower")
          } else {
            alert("✅ Profile linked! Please complete KYC verification.")
            setKycInProgress(true)
          }
        } else {
          await borrowerService.createBorrowerProfile({
            uid: currentUser.uid,
            email: email,
            displayName: currentUser.displayName || "Parth",
            kycCompleted: false
          })
          alert("✅ Profile created! Please complete KYC verification.")
          setKycInProgress(true)
        }
      }
      setOtpStep(false)
      setOtp("")
    } catch (e) {
      console.error(e)
      alert("Something went wrong after OTP verification. Please try again.")
    }
  }

  // ✅ Camera Access
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      setCameraStream(stream)
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (err) {
      console.error("Camera access denied:", err)
      alert("Please allow camera access for KYC.")
    }
  }

  // ✅ Capture Face Image
  const captureImage = () => {
    const canvas = document.createElement("canvas")
    const video = videoRef.current
    if (!video) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    const image = canvas.toDataURL("image/png")
    setCapturedImage(image)
    cameraStream?.getTracks().forEach((t) => t.stop())
  }

  // ✅ Extract face from Aadhaar using Gemini
  const extractFaceFromAadhaar = async () => {
    if (!aadhaarImage) {
      alert("Please upload Aadhaar photo first.");
      return;
    }

    setIsExtractingFace(true);
    try {
      console.log("Starting face extraction from Aadhaar...");
      const result = await geminiFaceService.extractFaceFromAadhaar(aadhaarImage);
      console.log("Face extraction result:", result);
      
      if (result.success && result.croppedFaceImage) {
        setExtractedAadhaarFace(result.croppedFaceImage);
        const confidence = (result as any).confidence || "medium";
        alert(`✅ Face detected in Aadhaar card!\nConfidence: ${confidence}\n\nYou can now proceed to capture your live image.`);
      } else {
        const errorMsg = result.error || "Unknown error occurred";
        console.error("Face extraction failed:", errorMsg);
        alert(`❌ Failed to extract face:\n${errorMsg}\n\nPlease ensure:\n• The Aadhaar image shows a clear face\n• The image is not blurry\n• Try uploading again`);
      }
    } catch (error: any) {
      console.error("Face extraction error:", error);
      alert(`❌ Face extraction failed:\n${error.message || "An unexpected error occurred."}\n\nPlease check:\n• Your Gemini API key is set correctly\n• You have internet connection\n• Try again`);
    } finally {
      setIsExtractingFace(false);
    }
  };

  // ✅ Verify with InsightFace Face Comparison
  const verifyWithHuggingFace = async () => {
    if (!extractedAadhaarFace || !capturedImage) {
      alert("⚠️ Please complete all steps:\n1. Extract face from Aadhaar card\n2. Capture your live image");
    return;
  }

  setIsVerifying(true);
  try {
      console.log("Starting face comparison...");
      
      // Compare faces using InsightFace
      const comparisonResult = await faceComparisonService.compareFaces(
        extractedAadhaarFace,
        capturedImage
      );

      console.log("Comparison result:", comparisonResult);

      if (!comparisonResult.success) {
        const errorMsg = comparisonResult.error || "Unknown error occurred";
        console.error("Face comparison failed:", errorMsg);
        
        // Show user-friendly error message
        if (errorMsg.includes("Python") || errorMsg.includes("script")) {
          alert("❌ Configuration Error:\nInsightFace service is not available.\nPlease ensure Python is installed and dependencies are set up.\nSee INSIGHTFACE_SETUP.md for instructions.");
        } else if (errorMsg.includes("No face detected")) {
          alert(`❌ Verification Failed:\n${errorMsg}\n\nPlease ensure:\n- Both images clearly show your face\n- Good lighting conditions\n- Face is centered and visible\n- Try again`);
        } else {
          alert(`❌ Verification Failed:\n${errorMsg}\n\nPlease ensure:\n- Both images are clear and show your face\n- Good lighting conditions\n- Try again`);
        }
        return;
      }

      const similarity = comparisonResult.similarity || 0;
      const threshold = 75; // Similarity threshold (75%)
      const isMatch = comparisonResult.match !== undefined ? comparisonResult.match : similarity >= threshold;

      console.log(`Similarity: ${similarity}%, Match: ${isMatch}, Threshold: ${threshold}%`);

      if (isMatch) {
        // Success - show similarity percentage
        alert(`✅ KYC Verification Successful!\n\nSimilarity Score: ${similarity.toFixed(2)}%\nThreshold: ${threshold}%\n\nYour identity has been verified.`);
        
        localStorage.setItem(`kyc:${role}:${email}`, "true");
        setHasKyc(true);
        setKycInProgress(false);
        
        // Clean up extracted face image (temporary storage)
        setExtractedAadhaarFace(null);
      
        // Update KYC status in Firebase database
        try {
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            console.log("Updating KYC status for user:", currentUser.uid);
            const updateResult = await borrowerService.updateBorrowerProfile(currentUser.uid, {
              kycCompleted: true
            });
            
            if (updateResult.success) {
              console.log("✅ KYC status updated in Firebase database");
            } else {
              console.error("❌ Failed to update KYC status:", updateResult.message);
              alert("⚠️ KYC verified but database update failed. Please contact support.");
            }
          } else {
            console.error("❌ No current user found for KYC update");
            alert("⚠️ KYC verified but user session not found. Please try logging in again.");
          }
        } catch (error) {
          console.error("❌ Failed to update KYC status in database:", error);
          alert("⚠️ KYC verified but database update failed. Please contact support.");
        }
      
        // Always redirect to dashboard after successful KYC verification
        setTimeout(() => {
          router.push("/borrower");
        }, 1000); // Small delay to show success message
      } else {
        // Failed - show similarity percentage and helpful message
        alert(
          `❌ Face Verification Failed\n\nSimilarity Score: ${similarity.toFixed(2)}%\nRequired Threshold: ${threshold}%\n\nTips to improve:\n• Ensure good lighting\n• Face the camera directly\n• Remove glasses/mask if possible\n• Make sure both images show your full face clearly\n\nPlease try again.`,
          "error"
        );
      }
    } catch (error: any) {
      console.error("InsightFace Verification Error:", error);
      alert(`❌ Verification Error:\n${error.message || "An unexpected error occurred. Please try again later."}\n\nIf this persists, please contact support.`);
    } finally {
      setIsVerifying(false);
    }
  };

  // ✅ Forgot Password Function
  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail.trim()) {
      alert("Please enter your email address.")
      return
    }

    const emailValid = /^(?:[a-zA-Z0-9_'^&\+`{}~!-]+(?:\.[a-zA-Z0-9_'^&\+`{}~!-]+)*|\"(?:[^\"\\]|\\.)+\")@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(
      forgotPasswordEmail.trim(),
    )

    if (!emailValid) {
      alert("Please enter a valid email address.")
      return
    }

    setIsSendingReset(true)
    try {
      const result = await authService.sendPasswordReset(forgotPasswordEmail)
      
      if (result.success) {
        alert(`✅ Password reset email sent to ${forgotPasswordEmail}\nPlease check your inbox and follow the instructions to reset your password.`)
        setShowForgotPassword(false)
        setForgotPasswordEmail("")
      } else {
        if (result.error?.includes('user-not-found')) {
          alert("❌ No account found with this email address.")
        } else {
          alert(`❌ ${result.message}: ${result.error}`)
        }
      }
    } catch (error) {
      console.error("Password reset error:", error)
      alert("❌ Failed to send password reset email. Please try again.")
    } finally {
      setIsSendingReset(false)
    }
  };

  // ✅ UI Section
  return (
    <main className="relative mx-auto max-w-xl space-y-6 px-4 py-12">
      {/* Decorative finance gradient background across the entire viewport */}
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent)]">
        {/* Unified diagonal pair (same color, size, radius) */}
        <div className="absolute -top-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-primary/45 to-violet-500 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-primary/45 to-violet-500 blur-3xl" />
      </div>
      <div className="flex items-center justify-between">
        <BackButton />
        <div />
      </div>
      <div className="text-center animate-in fade-in-0 slide-in-from-top-2 duration-500">
        <div className="mx-auto mb-2 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          Secure access • RBI-compliant practices
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Borrower Login</h1>
        <p className="text-sm text-muted-foreground">Login using your registered email and password</p>
      </div>

      <Card className="transition-all duration-300 hover:shadow-lg hover:ring-1 hover:ring-primary/30">
        <CardContent className="space-y-4 p-6">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" align="start" className="max-w-xs text-xs">
                Enter a valid email like name@example.com
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" align="start" className="max-w-xs text-xs">
                Password must be at least 8 characters and include uppercase, lowercase, number, and special character.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            onClick={signIn}
            disabled={isSendingOtp}
            className="w-full bg-primary text-primary-foreground transition-transform duration-200 hover:scale-[1.01]"
          >
            {isSendingOtp ? "Sending OTP..." : "Sign In"}
          </Button>

          <div className="text-center">
            <button 
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-muted-foreground hover:text-primary underline"
            >
              Forgot Password?
            </button>
          </div>

          {!hasKyc && (
            <div className="text-xs text-muted-foreground text-center">
              KYC verification is required once after your first login.
            </div>
          )}
        </CardContent>
      </Card>

      {/* ✅ Forgot Password Modal */}
      {showForgotPassword && (
        <Card className="transition-all duration-300 hover:shadow-lg hover:ring-1 hover:ring-primary/30">
          <CardContent className="space-y-4 p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Reset Password</h3>
              <p className="text-sm text-muted-foreground">
                Enter your email address and we'll send you a password reset link.
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter your email address"
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleForgotPassword}
                  disabled={isSendingReset}
                  className="flex-1 bg-primary text-primary-foreground"
                >
                  {isSendingReset ? "Sending..." : "Send Reset Email"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForgotPassword(false)
                    setForgotPasswordEmail("")
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ KYC Flow */}
      {kycInProgress && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="font-medium text-lg">Start KYC Verification</h2>

              {/* Aadhaar Upload */}
              <div>
                <p className="text-sm mb-2">Step 1: Upload your Aadhaar photo:</p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (r) => {
                        setAadhaarImage(r.target?.result as string)
                        setExtractedAadhaarFace(null) // Reset extracted face when new Aadhaar is uploaded
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                />
                {aadhaarImage && (
                  <div className="mt-3">
                  <img
                    src={aadhaarImage}
                    alt="Aadhaar"
                      className="mx-auto w-48 h-48 object-cover rounded-lg border"
                  />
                    <Button
                      onClick={extractFaceFromAadhaar}
                      disabled={isExtractingFace}
                      className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isExtractingFace ? "Extracting Face..." : "Step 2: Extract Face from Aadhaar"}
                    </Button>
                  </div>
                )}
                {extractedAadhaarFace && (
                  <div className="mt-3 text-center">
                    <p className="text-sm font-medium mb-2">✅ Extracted Face:</p>
                    <img
                      src={extractedAadhaarFace}
                      alt="Extracted Face"
                      className="mx-auto w-32 h-32 object-cover rounded-full border-2 border-green-500"
                    />
                  </div>
                )}
              </div>
              
              {/* Camera Capture */}
              <div>
                <p className="text-sm mb-2">Step 3: Capture your live image:</p>
                <Button onClick={startCamera} disabled={!extractedAadhaarFace}>
                  Access Camera
                </Button>
                <div className="flex justify-center mt-2">
                  {!capturedImage && (
    <video
      ref={videoRef}
      autoPlay
      className="rounded-lg shadow-md w-full max-w-sm"
    />
  )}
</div>
                <Button onClick={captureImage} disabled={!cameraStream} className="w-full mt-2">
  Capture Image
</Button>

              {capturedImage && (
                  <div className="text-center mt-3">
                    <p className="text-sm font-medium mb-2">Captured Image:</p>
                  <img
                    src={capturedImage}
                    alt="Captured Face"
                      className="mx-auto w-32 h-32 object-cover rounded-full border-2 border-blue-500"
                  />
                </div>
              )}
              </div>

              <Button
                onClick={verifyWithHuggingFace}
                disabled={isVerifying || !capturedImage || !extractedAadhaarFace}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isVerifying ? "Verifying with InsightFace..." : "Step 4: Verify & Complete KYC"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ✅ OTP Step */}
      {otpStep && (
        <Card className="transition-all duration-300 hover:shadow-lg hover:ring-1 hover:ring-primary/30">
          <CardContent className="space-y-4 p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Enter OTP</h3>
              <p className="text-sm text-muted-foreground">We sent a 6-digit code to {email}.</p>
            </div>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleVerifyOtp} disabled={isVerifyingOtp || otp.length !== 6} className="flex-1 bg-primary text-primary-foreground">
                {isVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  setIsSendingOtp(true)
                  const resend = await otpService.sendLoginOtp(email, 'borrower')
                  setIsSendingOtp(false)
                  if (resend.success) alert('OTP resent. Please check your email.')
                  else alert(`Failed to resend OTP: ${resend.message}`)
                }}
                disabled={isSendingOtp}
              >
                {isSendingOtp ? 'Sending...' : 'Resend'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  )
}