"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GoogleGenerativeAI } from "@google/generative-ai"

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
  const videoRef = useRef<HTMLVideoElement>(null)
  const role = "borrower" as const

  // ✅ Check email-specific KYC status
  useEffect(() => {
    if (email) {
      setHasKyc(localStorage.getItem(`kyc:${role}:${email}`) === "true")
    }
  }, [email])

  // ✅ Sign In Logic
  const signIn = () => {
    if (email && password) {
      const kycStatus = localStorage.getItem(`kyc:${role}:${email}`) === "true"
      if (!kycStatus) {
        alert("KYC required. Please complete it once.")
        setKycInProgress(true)
      } else {
        router.push("/borrower")
      }
    } else {
      alert("Please enter email and password")
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

  // ✅ Gemini Verification Logic
  const verifyWithGemini = async () => {
  if (!aadhaarImage || !capturedImage) {
    alert("Please upload Aadhaar photo and capture your live image.");
    return;
  }

  setIsVerifying(true);
  try {
    const genAI = new GoogleGenerativeAI("AIzaSyBg4av8LfENaabWgid2JuSX8B_fDx1RVuk");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are an expert biometric verification assistant.
You must behave as a professional AI face verification system that avoids hallucination.
Your job is to extract and compare faces from two provided images.

### Instructions:
1. Extract the **face region only** from the Aadhaar image. Ignore text, logos, and background.
2. Extract the **face region** from the live captured image.
3. Compare the faces using visual geometry, landmarks, and texture patterns.
4. Return your output strictly in the following JSON format:

{
  "similarity": <number between 0 and 100>,
  "decision": "MATCH" | "NO MATCH",
  "reason": "<brief reason>"
}

### Decision criteria:
- If the faces match with ≥ 90% similarity, return "MATCH".
- Otherwise, return "NO MATCH".
`;

    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { mimeType: "image/jpeg", data: aadhaarImage.split(",")[1] } },
      { inlineData: { mimeType: "image/jpeg", data: capturedImage.split(",")[1] } },
    ]);

    const responseText = (await result.response.text()).trim();
    console.log("Gemini raw output:", responseText);

    // Try to safely extract JSON content
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const match = responseText.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    }

    if (parsed && parsed.similarity >= 90 && parsed.decision === "MATCH") {
      alert(`✅ KYC Verified! Similarity: ${parsed.similarity.toFixed(1)}%`);
      localStorage.setItem(`kyc:${role}:${email}`, "true");
      setHasKyc(true);
      setKycInProgress(false);
      router.push("/borrower");
    } else {
      alert(
        `❌ Face mismatch. Similarity: ${
          parsed?.similarity ?? "unknown"
        }%. Try again.`
      );
    }
  } catch (error) {
    console.error("Gemini Verification Error:", error);
    alert("Verification failed. Please try again later.");
  } finally {
    setIsVerifying(false);
  }
};


  // ✅ UI Section
  return (
    <main className="mx-auto max-w-lg space-y-6 px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Borrower Login</h1>
        <p className="text-sm text-muted-foreground">Login using your registered email and password</p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <Input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button onClick={signIn} className="w-full bg-primary text-primary-foreground">
            Sign In
          </Button>

          {!hasKyc && (
            <div className="text-xs text-muted-foreground text-center">
              KYC verification is required once after your first login.
            </div>
          )}
        </CardContent>
      </Card>

      {/* ✅ KYC Flow */}
      {kycInProgress && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="font-medium text-lg">Start KYC Verification</h2>

              {/* Aadhaar Upload */}
              <div>
                <p className="text-sm mb-2">Upload your Aadhaar photo:</p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (r) => setAadhaarImage(r.target?.result as string)
                      reader.readAsDataURL(file)
                    }
                  }}
                />
                {aadhaarImage && (
                  <img
                    src={aadhaarImage}
                    alt="Aadhaar"
                    className="mt-3 mx-auto w-48 h-48 object-cover rounded-lg border"
                  />
                )}
              </div>

              
              {/* Camera Capture */}
              <Button onClick={startCamera}>Access Camera</Button>
              <div className="flex justify-center">
              { !capturedImage && (
    <video
      ref={videoRef}
      autoPlay
      className="rounded-lg shadow-md w-full max-w-sm"
    />
  )}
</div>
<Button onClick={captureImage} disabled={!cameraStream}>
  Capture Image
</Button>

              {capturedImage && (
                <div className="text-center">
                  <p className="text-sm font-medium mt-2 mb-1">Captured Image:</p>
                  <img
                    src={capturedImage}
                    alt="Captured Face"
                    className="mx-auto w-48 h-48 object-cover rounded-full border"
                  />
                </div>
              )}

              <Button
                onClick={verifyWithGemini}
                disabled={isVerifying || !capturedImage || !aadhaarImage}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isVerifying ? "Verifying..." : "Verify & Complete KYC"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  )
}
