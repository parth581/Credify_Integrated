/**
 * Service to compare faces using Hugging Face API
 */
export const faceComparisonService = {
  /**
   * Compare two face images and get similarity score
   * @param aadhaarFaceImage - Base64 encoded cropped face from Aadhaar
   * @param liveImage - Base64 encoded live captured image
   * @returns Similarity score and match result
   */
  async compareFaces(
    aadhaarFaceImage: string,
    liveImage: string
  ): Promise<{
    success: boolean
    similarity?: number
    match?: boolean
    error?: string
  }> {
    try {
      const response = await fetch("/api/face-comparison", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          aadhaarFaceImage,
          liveImage,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || "Failed to compare faces",
        }
      }

      return {
        success: true,
        similarity: data.similarity,
        match: data.match,
      }
    } catch (error: any) {
      console.error("Face comparison service error:", error)
      return {
        success: false,
        error: error.message || "Failed to compare faces",
      }
    }
  },
}
