import { createContext, useContext, useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { auth } from '../config/firebase'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  async function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password)
  }

  async function logout() {
    return signOut(auth)
  }

  async function getToken() {
    if (!user) return null
    return user.getIdToken()
  }

  const value = { user, loading, login, signup, logout, getToken }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
