import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from './firebase'

export interface BorrowerData {
  uid: string
  email: string
  displayName: string
  kycCompleted: boolean
  loanDetails?: {
    loanId: string
    principal: number
    rate: number
    duration: number
    purpose: string
    startDate: string
    totalAmount: number
    monthlyEMI: number
    paidMonths: number
    remainingAmount: number
    nextEMIDate: string
  }
  paymentHistory: Array<{
    date: string
    amount: number
    status: 'Successful' | 'Failed' | 'Pending'
    paymentId?: string
  }>
  createdAt: Date
  updatedAt: Date
}

export interface LenderData {
  uid: string
  email: string
  displayName: string
  kycCompleted: boolean
  portfolio: {
    totalInvestment: number
    activeLoans: number
    avgInterestRate: number
    totalReturns: number
  }
  marketplaceLoans: Array<{
    loanId: string
    borrowerId: string
    amount: number
    purpose: string
    rate: number
    duration: number
    distance: string
    status: 'Available' | 'Funded' | 'Completed'
    fundedBy?: string
    fundedAt?: Date
  }>
  payouts: Array<{
    date: string
    amount: number
    status: 'Settled' | 'Pending' | 'Failed'
  }>
  createdAt: Date
  updatedAt: Date
}

export const borrowerService = {
  // Create borrower profile
  async createBorrowerProfile(userData: Partial<BorrowerData>) {
    try {
      const borrowerRef = await addDoc(collection(db, 'borrowers'), {
        ...userData,
        kycCompleted: false,
        paymentHistory: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      return {
        success: true,
        id: borrowerRef.id,
        message: 'Borrower profile created successfully'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to create borrower profile'
      }
    }
  },

  // Update borrower profile
  async updateBorrowerProfile(uid: string, updates: Partial<BorrowerData>) {
    try {
      const borrowerRef = doc(db, 'borrowers', uid)
      await updateDoc(borrowerRef, {
        ...updates,
        updatedAt: serverTimestamp()
      })
      
      return {
        success: true,
        message: 'Borrower profile updated successfully'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to update borrower profile'
      }
    }
  },

  // Get borrower profile by UID
  async getBorrowerProfile(uid: string) {
    try {
      const borrowerRef = doc(db, 'borrowers', uid)
      const borrowerSnap = await getDoc(borrowerRef)
      
      if (borrowerSnap.exists()) {
        return {
          success: true,
          data: borrowerSnap.data() as BorrowerData,
          message: 'Borrower profile retrieved successfully'
        }
      } else {
        return {
          success: false,
          message: 'Borrower profile not found'
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to get borrower profile'
      }
    }
  },

  // Get borrower profile by email (to prevent duplicates)
  async getBorrowerProfileByEmail(email: string) {
    try {
      const borrowersRef = collection(db, 'borrowers')
      const q = query(borrowersRef, where('email', '==', email))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0]
        return {
          success: true,
          data: { ...doc.data(), uid: doc.id } as BorrowerData,
          message: 'Borrower profile found by email'
        }
      } else {
        return {
          success: false,
          message: 'No borrower profile found with this email'
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to search borrower profile by email'
      }
    }
  },

  // Add payment to history
  async addPayment(uid: string, payment: {
    date: string
    amount: number
    status: 'Successful' | 'Failed' | 'Pending'
    paymentId?: string
  }) {
    try {
      const borrowerRef = doc(db, 'borrowers', uid)
      const borrowerSnap = await getDoc(borrowerRef)
      
      if (borrowerSnap.exists()) {
        const currentData = borrowerSnap.data() as BorrowerData
        const updatedPayments = [...currentData.paymentHistory, payment]
        
        await updateDoc(borrowerRef, {
          paymentHistory: updatedPayments,
          updatedAt: serverTimestamp()
        })
        
        return {
          success: true,
          message: 'Payment added successfully'
        }
      } else {
        return {
          success: false,
          message: 'Borrower profile not found'
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to add payment'
      }
    }
  }
}

export const lenderService = {
  // Create lender profile
  async createLenderProfile(userData: Partial<LenderData>) {
    try {
      const lenderRef = await addDoc(collection(db, 'lenders'), {
        ...userData,
        kycCompleted: false,
        portfolio: {
          totalInvestment: 0,
          activeLoans: 0,
          avgInterestRate: 0,
          totalReturns: 0
        },
        marketplaceLoans: [],
        payouts: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      return {
        success: true,
        id: lenderRef.id,
        message: 'Lender profile created successfully'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to create lender profile'
      }
    }
  },

  // Update lender profile
  async updateLenderProfile(uid: string, updates: Partial<LenderData>) {
    try {
      const lenderRef = doc(db, 'lenders', uid)
      await updateDoc(lenderRef, {
        ...updates,
        updatedAt: serverTimestamp()
      })
      
      return {
        success: true,
        message: 'Lender profile updated successfully'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to update lender profile'
      }
    }
  },

  // Get lender profile
  async getLenderProfile(uid: string) {
    try {
      const lenderRef = doc(db, 'lenders', uid)
      const lenderSnap = await getDoc(lenderRef)
      
      if (lenderSnap.exists()) {
        return {
          success: true,
          data: lenderSnap.data() as LenderData,
          message: 'Lender profile retrieved successfully'
        }
      } else {
        return {
          success: false,
          message: 'Lender profile not found'
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to get lender profile'
      }
    }
  },

  // Get lender profile by email (to prevent duplicates)
  async getLenderProfileByEmail(email: string) {
    try {
      const lendersRef = collection(db, 'lenders')
      const q = query(lendersRef, where('email', '==', email))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0]
        return {
          success: true,
          data: { ...doc.data(), uid: doc.id } as LenderData,
          message: 'Lender profile found by email'
        }
      } else {
        return {
          success: false,
          message: 'No lender profile found with this email'
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to search lender profile by email'
      }
    }
  },

  // Fund a loan
  async fundLoan(uid: string, loanId: string, amount: number) {
    try {
      const lenderRef = doc(db, 'lenders', uid)
      const lenderSnap = await getDoc(lenderRef)
      
      if (lenderSnap.exists()) {
        const currentData = lenderSnap.data() as LenderData
        const updatedLoans = currentData.marketplaceLoans.map(loan => 
          loan.loanId === loanId 
            ? { ...loan, status: 'Funded' as const, fundedBy: uid, fundedAt: new Date() }
            : loan
        )
        
        await updateDoc(lenderRef, {
          marketplaceLoans: updatedLoans,
          portfolio: {
            ...currentData.portfolio,
            totalInvestment: currentData.portfolio.totalInvestment + amount,
            activeLoans: currentData.portfolio.activeLoans + 1
          },
          updatedAt: serverTimestamp()
        })
        
        return {
          success: true,
          message: 'Loan funded successfully'
        }
      } else {
        return {
          success: false,
          message: 'Lender profile not found'
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to fund loan'
      }
    }
  },

  // Add payout
  async addPayout(uid: string, payout: {
    date: string
    amount: number
    status: 'Settled' | 'Pending' | 'Failed'
  }) {
    try {
      const lenderRef = doc(db, 'lenders', uid)
      const lenderSnap = await getDoc(lenderRef)
      
      if (lenderSnap.exists()) {
        const currentData = lenderSnap.data() as LenderData
        const updatedPayouts = [...currentData.payouts, payout]
        
        await updateDoc(lenderRef, {
          payouts: updatedPayouts,
          updatedAt: serverTimestamp()
        })
        
        return {
          success: true,
          message: 'Payout added successfully'
        }
      } else {
        return {
          success: false,
          message: 'Lender profile not found'
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to add payout'
      }
    }
  }
}
