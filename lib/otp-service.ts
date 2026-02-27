import { collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc } from 'firebase/firestore'
import { db } from './firebase'

export interface OtpRecord {
  email: string
  code: string
  purpose: 'lender-login' | 'borrower-login'
  createdAt: Date
  expiresAt: Date
}

function generateSixDigitCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

async function storeOtp(email: string, code: string, purpose: OtpRecord['purpose']) {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
  await addDoc(collection(db, 'otps'), {
    email,
    code,
    purpose,
    createdAt: serverTimestamp(),
    expiresAt
  })
}

async function fetchLatestOtp(email: string, purpose: OtpRecord['purpose']) {
  const q = query(collection(db, 'otps'), where('email', '==', email), where('purpose', '==', purpose))
  const snap = await getDocs(q)
  if (snap.empty) return null
  // Get all OTPs and sort by createdAt to get the latest
  const otps: any[] = []
  snap.forEach((docSnap) => {
    const data = { id: docSnap.id, ...docSnap.data() }
    otps.push(data)
  })
  // Sort by createdAt (most recent first)
  // Handle both Timestamp objects and date strings
  otps.sort((a, b) => {
    const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0)
    const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0)
    return bTime - aTime // Descending order (newest first)
  })
  return otps[0] || null // Return the most recent OTP
}

async function clearOtps(email: string, purpose: OtpRecord['purpose']) {
  const q = query(collection(db, 'otps'), where('email', '==', email), where('purpose', '==', purpose))
  const snap = await getDocs(q)
  const deletions = snap.docs.map((d) => deleteDoc(d.ref))
  await Promise.allSettled(deletions)
}

export const otpService = {
  async sendLoginOtp(email: string, role: 'lender' | 'borrower' = 'lender') {
    const purpose = role === 'lender' ? 'lender-login' : 'borrower-login'
    // Clear any existing OTPs for this email and purpose before sending a new one
    await clearOtps(email, purpose)
    
    const code = generateSixDigitCode()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
    await storeOtp(email, code, purpose)

    // Optional email sending via EmailJS if configured
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID

    try {
      if (publicKey && serviceId && templateId) {
        const mod = await import('@emailjs/browser')
        await mod.send(
          serviceId,
          templateId,
          {
            to_email: email,
            otp_code: code,
            expires_at: expiresAt.toLocaleString()
          },
          publicKey
        )
        return { success: true, message: 'OTP sent to email' }
      } else {
        // Fallback for development: log to console
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn(`[DEV ONLY] OTP for ${email}: ${code}`)
        }
        return { success: true, message: 'OTP generated (email service not configured)' }
      }
    } catch (error: any) {
      return { success: false, message: 'Failed to send OTP email', error: error?.message }
    }
  },

  async verifyLoginOtp(email: string, code: string, role: 'lender' | 'borrower' = 'lender') {
    const purpose = role === 'lender' ? 'lender-login' : 'borrower-login'
    const record = await fetchLatestOtp(email, purpose)
    if (!record) return { success: false, message: 'OTP not found. Please request a new code.' }

    const now = Date.now()
    const expMs = record.expiresAt?.toMillis ? record.expiresAt.toMillis() : new Date(record.expiresAt).getTime()
    if (now > expMs) {
      await clearOtps(email, purpose)
      return { success: false, message: 'OTP expired. Please request a new code.' }
    }

    if (String(record.code) !== String(code)) {
      return { success: false, message: 'Invalid OTP. Please try again.' }
    }

    await clearOtps(email, purpose)
    return { success: true, message: 'OTP verified' }
  }
}


