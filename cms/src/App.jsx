import { useEffect, useMemo, useRef, useState } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { onAuthStateChange, getSession, signOut } from "./services/auth"

import Login from "./components/Login"
import Dashboard from "./components/Dashboard"
import ProtectedRoute from "./components/ProtectedRoute"

const STORAGE_KEY = "cms_last_activity_ms"

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  const timeoutMs = useMemo(() => {
    const mins = Number(import.meta.env.VITE_CMS_SESSION_TIMEOUT_MINUTES || 15)
    return Math.max(1, mins) * 60 * 1000
  }, [])

  const logoutTimerRef = useRef(null)

  function clearLogoutTimer() {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current)
      logoutTimerRef.current = null
    }
  }

  async function forceLogout(reason = "Session expired. Please sign in again.") {
    clearLogoutTimer()
    localStorage.removeItem(STORAGE_KEY)

    try {
      await signOut()
    } catch {
    }

    setSession(null)
    sessionStorage.setItem("cms_logout_reason", reason)
  }

  function scheduleLogoutFromNow() {
    clearLogoutTimer()
    localStorage.setItem(STORAGE_KEY, String(Date.now()))

    logoutTimerRef.current = setTimeout(() => {
      forceLogout()
    }, timeoutMs)
  }

  useEffect(() => {
    let sub

    async function init() {
      const s = await getSession()
      setSession(s)
      setLoading(false)

      if (s) {
        const last = Number(localStorage.getItem(STORAGE_KEY) || 0)
        const expired = last && Date.now() - last > timeoutMs

        if (expired) {
          await forceLogout()
        } else {
          scheduleLogoutFromNow()
        }
      }

      sub = onAuthStateChange((newSession) => {
        setSession(newSession || null)

        if (newSession) {
          scheduleLogoutFromNow()
        } else {
          clearLogoutTimer()
          localStorage.removeItem(STORAGE_KEY)
        }
      })
    }

    init()

    return () => {
      clearLogoutTimer()
      sub?.data?.subscription?.unsubscribe?.()
    }
  }, [timeoutMs])

  useEffect(() => {
    if (!session) return

    const bump = () => scheduleLogoutFromNow()
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"]

    events.forEach((e) => window.addEventListener(e, bump, { passive: true }))
    return () => events.forEach((e) => window.removeEventListener(e, bump))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, timeoutMs])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-700">Loading...</div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={session ? <Navigate to="/dashboard" replace /> : <Login />}
        />

        <Route element={<ProtectedRoute session={session} />}>
          <Route path="/dashboard" element={<Dashboard session={session} />} />
        </Route>

        <Route
          path="/"
          element={<Navigate to={session ? "/dashboard" : "/login"} replace />}
        />

        <Route
          path="*"
          element={<Navigate to={session ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}
