import { NextRequest, NextResponse } from "next/server"

/**
 * API Route for Face Comparison using InsightFace via Hugging Face Spaces
 * Compares two face images and returns similarity score
 * 
 * SETUP:
 * 1. Deploy the hf-deployment folder to Hugging Face Spaces
 * 2. Set HF_SPACE_URL environment variable to your space URL
 *    Example: https://your-username-credify-face-comparison.hf.space
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { aadhaarFaceImage, liveImage } = body

    if (!aadhaarFaceImage || !liveImage) {
      return NextResponse.json(
        { success: false, error: "Both images are required" },
        { status: 400 }
      )
    }

    // Get HF Space URL from environment
    const hfSpaceUrl = process.env.HF_SPACE_URL
    if (!hfSpaceUrl) {
      throw new Error(
        "HF_SPACE_URL environment variable not set. " +
        "Please deploy to Hugging Face Spaces and set the environment variable."
      )
    }

    console.log("Calling InsightFace via Hugging Face Spaces...")

    // Call HF Space API (FastAPI endpoint, not Gradio /call/ format)
    const apiUrl = `${hfSpaceUrl}/compare`
    
    console.log(`API endpoint: ${apiUrl}`)

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        aadhaarFaceImage,
        liveImage,
      }),
      // Add timeout
      signal: AbortSignal.timeout(120000), // 2 minutes timeout
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`HF API error (${response.status}):`, errorText)
      
      throw new Error(
        `Hugging Face API returned ${response.status}: ${errorText.substring(0, 200)}`
      )
    }

    const result = await response.json()

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Face comparison failed",
        },
        { status: 500 }
      )
    }

    console.log(
      `Face comparison result: ${result.similarity}% similarity, Match: ${result.match}`
    )

    return NextResponse.json({
      success: true,
      similarity: result.similarity,
      threshold: result.threshold || 75,
      match: result.match,
      rawSimilarity: result.raw_similarity,
      method: "insightface-buffalo_l-hf",
    })
  } catch (error: any) {
    console.error("Face comparison API error:", error)

    // Provide helpful error messages
    let errorMessage = "Face comparison failed. "

    if (error.message?.includes("HF_SPACE_URL")) {
      errorMessage +=
        "Hugging Face Space is not configured. Please:\n" +
        "1. Deploy the hf-deployment folder to Hugging Face Spaces\n" +
        "2. Set HF_SPACE_URL environment variable to your space URL\n" +
        "3. Example: HF_SPACE_URL=https://your-username-credify-face-comparison.hf.space"
    } else if (error.name === "AbortError") {
      errorMessage +=
        "Request timed out. The Hugging Face Space may be loading the model. Try again in a moment."
    } else if (error.message?.includes("Hugging Face")) {
      errorMessage += error.message
    } else {
      errorMessage += error.message || "Unknown error occurred."
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error.message,
      },
      { status: 500 }
    )
  }
}
