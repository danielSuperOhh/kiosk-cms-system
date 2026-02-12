import MediaUploadPanel from "./MediaUploadPanel"
import AnnouncementPanel from "./AnnouncementPanel"
import KioskSettingsPanel from "./KioskSettingsPanel"
import AvatarSessionsPanel from "./AvatarSessionsPanel"
import { signOut } from "../services/auth"

export default function Dashboard({ session }) {
  async function handleLogout() {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ Sticky top header */}
      <div className="sticky top-0 z-50 bg-gray-50/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto p-6">
          <div className="bg-white rounded-2xl shadow p-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">CMS Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Signed in as: {session.user.email}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg border hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MediaUploadPanel />
          <AnnouncementPanel />
          <KioskSettingsPanel />
          <AvatarSessionsPanel />
        </div>
      </div>
    </div>
  )
}
