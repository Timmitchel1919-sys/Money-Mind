import { useEffect, useState } from "react"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail,
} from "firebase/auth"
import { auth } from "../firebase"

export default function useAuth(onLogin) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(true)
  const [resetMessage, setResetMessage] = useState("")

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      setLoading(false)

      if (currentUser && onLogin) {
        await onLogin(currentUser.uid)
      }
    })

    return () => unsubscribe()
  }, [])

  async function handleAuth(e) {
    e.preventDefault()

    try {
      // Remember me off -> session-only persistence (signed out when the
      // browser/tab closes). On (default) -> persists across restarts.
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence)

      if (mode === "register") {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
    } catch (error) {
      alert(error.message)
    }
  }

  async function handleForgotPassword() {
    setResetMessage("")

    if (!email) {
      setResetMessage("Enter your email address above first, then tap Forgot password.")
      return
    }

    try {
      await sendPasswordResetEmail(auth, email)
      setResetMessage("Password reset email sent — check your inbox.")
    } catch (error) {
      setResetMessage(error.message)
    }
  }

  async function handleGoogleLogin() {
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (error) {
      alert(error.message)
    }
  }

  async function handleLogout() {
    await signOut(auth)
  }

  return {
    user,
    loading,
    mode,
    setMode,
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    resetMessage,
    handleAuth,
    handleGoogleLogin,
    handleLogout,
    handleForgotPassword,
  }
}