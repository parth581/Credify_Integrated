import { NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"
import fs from "fs"

/**
 * API Route for Face Comparison using InsightFace (Python)
 * Compares two face images and returns similarity score
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

    console.log("Using InsightFace for face comparison...")

    try {
      // Get the path to the Python script
      // In Next.js, we need to use process.cwd() to get the project root
      const projectRoot = process.cwd()
      const pythonScriptPath = path.resolve(projectRoot, "server", "face_service", "face_comparison.py")
      
      // Check if the script exists
      if (!fs.existsSync(pythonScriptPath)) {
        throw new Error(
          `Python script not found at: ${pythonScriptPath}. ` +
          `Please ensure the face_comparison.py file exists in server/face_service/`
        )
      }

      console.log(`Python script path: ${pythonScriptPath}`)

      // Determine Python command (try python3 first, then python)
      const pythonCommand = process.platform === "win32" ? "python" : "python3"

      // Prepare input data
      const inputData = JSON.stringify({
        aadhaarFaceImage,
        liveImage,
      })

      // Call Python script
      const result = await new Promise<{ success: boolean; similarity?: number; match?: boolean; error?: string }>((resolve, reject) => {
        const pythonProcess = spawn(pythonCommand, [pythonScriptPath], {
          cwd: projectRoot,
        })

        let stdout = ""
        let stderr = ""

        pythonProcess.stdout.on("data", (data) => {
          stdout += data.toString()
        })

        pythonProcess.stderr.on("data", (data) => {
          stderr += data.toString()
        })

        pythonProcess.on("close", (code) => {
          if (code !== 0) {
            console.error("Python script error:", stderr)
            reject(new Error(`Python script exited with code ${code}: ${stderr}`))
            return
          }

          try {
            // Extract JSON from stdout (may contain other messages)
            // Look for JSON object in the output
            const jsonMatch = stdout.match(/\{[\s\S]*"success"[\s\S]*\}/)
            if (jsonMatch) {
              const result = JSON.parse(jsonMatch[0])
              resolve(result)
            } else {
              // Try parsing entire stdout as JSON (fallback)
              const result = JSON.parse(stdout.trim())
              resolve(result)
            }
          } catch (parseError) {
            console.error("Failed to parse Python output:", stdout)
            // Try to extract any error message from the output
            const errorMatch = stdout.match(/error["\s:]+([^"}\n]+)/i)
            const errorMsg = errorMatch ? errorMatch[1] : "Unknown error"
            reject(new Error(`Failed to parse Python output: ${errorMsg}. Full output: ${stdout.substring(0, 500)}`))
          }
        })

        pythonProcess.on("error", (error) => {
          console.error("Failed to start Python process:", error)
          reject(
            new Error(
              `Failed to start Python process. Make sure Python is installed and accessible. ` +
              `Tried command: ${pythonCommand}. Error: ${error.message}`
            )
          )
        })

        // Send input data to Python script
        pythonProcess.stdin.write(inputData)
        pythonProcess.stdin.end()
      })

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
        method: "insightface-buffalo_l",
      })
    } catch (pythonError: any) {
      console.error("Python service error:", pythonError)

      // Provide helpful error messages
      let errorMessage = "Face comparison failed. "

      if (pythonError.message?.includes("Python")) {
        errorMessage +=
          "Python service is not available. Please ensure:\n" +
          "1. Python is installed and in your PATH\n" +
          "2. Dependencies are installed: `cd server/face_service && pip install -r requirements.txt`\n" +
          "3. See INSIGHTFACE_SETUP.md for detailed instructions"
      } else {
        errorMessage += pythonError.message || "Unknown error occurred."
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: pythonError.message,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("Face comparison API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to compare faces",
      },
      { status: 500 }
    )
  }
}

