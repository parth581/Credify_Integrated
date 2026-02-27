import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  User,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth'
import { auth } from './firebase'

export interface UserData {
  uid: string
  email: string
  displayName?: string
  role: 'borrower' | 'lender'
  kycCompleted: boolean
  createdAt: Date
  lastLoginAt: Date
}

export const authService = {
  // Register new user
  async register(email: string, password: string, role: 'borrower' | 'lender', displayName?: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // Update display name if provided
      if (displayName) {
        await updateProfile(user, { displayName })
      }
      
      return {
        success: true,
        user: userCredential.user,
        message: 'Registration successful'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Registration failed'
      }
    }
  },

  // Sign in user
  async signIn(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      return {
        success: true,
        user: userCredential.user,
        message: 'Sign in successful'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Sign in failed'
      }
    }
  },

  // Sign out user
  async signOut() {
    try {
      await signOut(auth)
      return {
        success: true,
        message: 'Sign out successful'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Sign out failed'
      }
    }
  },

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser
  },

  // Send password reset email
  async sendPasswordReset(email: string) {
    try {
      await sendPasswordResetEmail(auth, email)
      return {
        success: true,
        message: 'Password reset email sent successfully'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to send password reset email'
      }
    }
  }
}
