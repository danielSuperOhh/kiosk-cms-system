import { useMemo, useState } from "react"
import { signOut } from "../services/auth"

import MediaUploadPanel from "./MediaUploadPanel"
import AnnouncementPanel from "./AnnouncementPanel"
import KioskSettingsPanel from "./KioskSettingsPanel"
import AvatarSessionsPanel from "./AvatarSessionsPanel"

const tabs = [
  { key: "media", label: "Media" },
  { key: "announcements", label: "Announcements" },
  { key: "settings", label: "Kiosk settings" },
  { key: "sessions", label: "Assistant sessions" },
]

export default function Dashboard({ session }) {
  const [activeTab, setActiveTab] = useState("media")

  const content = useMemo(() => {
    switch (activeTab) {
      case "media":
        return <MediaUploadPanel />
      case "announcements":
        return <AnnouncementPanel />
      case "settings":
        return <KioskSettingsPanel />
      case "sessions":
        return <AvatarSessionsPanel />
      default:
        return <MediaUploadPanel />
    }
  }, [activeTab])

  async function handleLogout() {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50 bg-gray-50/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                CMS Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Signed in as: {session.user.email}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="w-fit rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {tabs.map((t) => {
              const isActive = t.key === activeTab
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-gray-900 text-white"
                      : "bg-white border border-gray-200 text-gray-800 hover:bg-gray-50",
                  ].join(" ")}
                >
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">{content}</div>
    </div>
  )
}
