import { useCallback, useEffect, useState } from "react"
import {
  browserLocalPersistence, browserSessionPersistence, createUserWithEmailAndPassword,
  GoogleAuthProvider, onAuthStateChanged, sendPasswordResetEmail, setPersistence,
  signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile,
} from "firebase/auth"
import { auth } from "../firebase"

export default function useAuth(onLogin) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [rememberMe, setRememberMe] = useState(true)
  const [resetMessage, setResetMessage] = useState("")
  const [authError, setAuthError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      setLoading(false)
      if (currentUser && onLogin) await onLogin(currentUser.uid)
    })
    return () => unsubscribe()
  }, [])

  const changeMode = useCallback((nextMode) => {
    setMode(nextMode)
    setAuthError("")
    setResetMessage("")
    setPassword("")
    setConfirmPassword("")
  }, [])

  async function handleAuth(event) {
    event.preventDefault()
    if (submitting) return
    setAuthError("")
    if (!email || !password) { setAuthError("Enter your email address and password."); return }
    if (mode === "register" && !fullName.trim()) { setAuthError("Enter your full name."); return }
    if (mode === "register" && password.length < 6) { setAuthError("Use at least 6 characters for your password."); return }
    if (mode === "register" && password !== confirmPassword) { setAuthError("Passwords do not match."); return }
    setSubmitting(true)
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence)
      if (mode === "register") {
        const credential = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(credential.user, { displayName: fullName.trim() })
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
    } catch (error) {
      const messages = {
        "auth/invalid-email": "Enter a valid email address.",
        "auth/invalid-credential": "We could not sign you in with those credentials.",
        "auth/too-many-requests": "Too many attempts. Please wait and try again.",
        "auth/user-disabled": "This account is currently disabled. Contact support for help.",
        "auth/network-request-failed": "You appear to be offline. Check your connection and try again.",
        "auth/email-already-in-use": "An account cannot be created with these details. Try signing in or resetting your password.",
      }
      setAuthError(messages[error.code] || "Authentication could not be completed. Please try again.")
      setPassword("")
      setConfirmPassword("")
    } finally { setSubmitting(false) }
  }

  async function handleForgotPassword(event) {
    event?.preventDefault?.()
    setResetMessage("")
    if (!email) { setResetMessage("Enter your email address to request a reset link."); return }
    setSubmitting(true)
    try {
      await sendPasswordResetEmail(auth, email)
      setResetMessage("If an account is associated with this email address, password-reset instructions will be sent.")
    } catch (error) {
      setResetMessage(error.code === "auth/network-request-failed" ? "You appear to be offline. Check your connection and try again." : "If an account is associated with this email address, password-reset instructions will be sent.")
    } finally { setSubmitting(false) }
  }

  async function handleGoogleLogin() {
    if (submitting) return
    setSubmitting(true)
    setAuthError("")
    try { await signInWithPopup(auth, new GoogleAuthProvider()) }
    catch (error) { setAuthError(error.code === "auth/popup-closed-by-user" ? "Google sign-in was cancelled." : "Google sign-in could not be completed. Please try again.") }
    finally { setSubmitting(false) }
  }

  async function handleLogout() { await signOut(auth) }

  return { user, loading, mode, setMode: changeMode, email, setEmail, password, setPassword,
    confirmPassword, setConfirmPassword, fullName, setFullName, rememberMe, setRememberMe,
    resetMessage, authError, submitting, handleAuth, handleGoogleLogin, handleLogout, handleForgotPassword }
}
