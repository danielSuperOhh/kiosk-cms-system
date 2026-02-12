// cms/src/components/Login.jsx
import { useState } from "react"
import { EyeIcon, EyeSlashIcon, LockClosedIcon } from "@heroicons/react/24/outline"
import { signInWithEmail } from "../services/auth"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    if (isLoading) return

    setIsLoading(true)
    setStatus("Signing in...")

    try {
      await signInWithEmail(email.trim(), password)
      setStatus("Signed in ✅")
    } catch (err) {
      setStatus(`Error: ${err?.message || "Unable to sign in"}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 text-white">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-zinc-900">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-zinc-900">
            <LockClosedIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-500">CMS ADMIN</div>
            <h1 className="text-2xl font-semibold">Sign in</h1>
          </div>
        </div>

        <p className="mb-6 text-sm text-zinc-600">
          Manage kiosk media, announcements and settings.
        </p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-sm text-zinc-700">Email</label>
            <input
              className="mt-2 w-full rounded-xl bg-zinc-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="text-sm text-zinc-700">Password</label>
            <div className="mt-2 flex items-center rounded-xl bg-zinc-100 px-2 focus-within:ring-2 focus-within:ring-zinc-300">
              <input
                className="w-full bg-transparent px-2 py-3 text-sm outline-none"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="rounded-lg p-2 text-zinc-600 hover:bg-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {status && (
            <div
              className={`rounded-xl px-4 py-3 text-sm ${
                status.startsWith("Error:")
                  ? "bg-rose-50 text-rose-700"
                  : "bg-zinc-100 text-zinc-700"
              }`}
            >
              {status}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>

          <p className="text-xs text-zinc-500">
            By continuing, you confirm you’re authorized to access this CMS.
          </p>
        </form>
      </div>
    </div>
  )
}
