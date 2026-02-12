import { useEffect, useState } from "react"
import { supabase } from "../services/supabaseClient"
import { TrashIcon } from "@heroicons/react/24/outline"

const KIOSK_ID = "e1eb7ca7-eac4-496a-a251-697bd156c1cd"

export default function AnnouncementPanel() {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [status, setStatus] = useState("")

  const [loading, setLoading] = useState(true)
  const [list, setList] = useState([])

  async function loadAnnouncements() {
    setLoading(true)
    const { data, error } = await supabase
      .from("announcements")
      .select("id, kiosk_id, title, body, is_active, created_at")
      .eq("kiosk_id", KIOSK_ID)
      .order("created_at", { ascending: false })

    if (error) {
      setStatus(`Error: ${error.message}`)
      setList([])
    } else {
      setList(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadAnnouncements()
  }, [])

  async function activate() {
    setStatus("Activating...")

    await supabase
      .from("announcements")
      .update({ is_active: false })
      .eq("kiosk_id", KIOSK_ID)
      .eq("is_active", true)

    const { error } = await supabase.from("announcements").insert([
      { kiosk_id: KIOSK_ID, title, body, is_active: true },
    ])

    setStatus(error ? `Error: ${error.message}` : "Announcement active ✅")
    await loadAnnouncements()
  }

  async function deactivate() {
    setStatus("Deactivating...")

    const { error } = await supabase
      .from("announcements")
      .update({ is_active: false })
      .eq("kiosk_id", KIOSK_ID)
      .eq("is_active", true)

    setStatus(error ? `Error: ${error.message}` : "Announcement off ✅")
    await loadAnnouncements()
  }

  async function deleteAnnouncement(row) {
    if (!confirm(`Delete announcement "${row.title}"?`)) return
    setStatus("Deleting...")

    const { error } = await supabase.from("announcements").delete().eq("id", row.id)
    setStatus(error ? `Error: ${error.message}` : "Deleted ✅")
    await loadAnnouncements()
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6">
        <h2 className="text-lg font-semibold text-gray-900">Live Announcement</h2>

        <div className="mt-5 space-y-4">
          <div>
            <div className="text-sm font-medium text-gray-800">Title</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 w-full rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-900 ring-1 ring-gray-200 outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>

          <div>
            <div className="text-sm font-medium text-gray-800">Text</div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="mt-2 w-full rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-900 ring-1 ring-gray-200 outline-none focus:ring-2 focus:ring-gray-300 h-28"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={activate}
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Activate
            </button>

            <button
              onClick={deactivate}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              Deactivate
            </button>

            {status ? <div className="text-sm text-gray-700 self-center">{status}</div> : null}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Previous announcements</h3>
          <button
            onClick={loadAnnouncements}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="mt-4 text-sm text-gray-600">Loading…</div>
        ) : list.length === 0 ? (
          <div className="mt-4 text-sm text-gray-600">No announcements yet.</div>
        ) : (
          <div className="mt-4 divide-y divide-gray-100">
            {list.map((a) => (
              <div key={a.id} className="py-4 flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-gray-900 truncate">{a.title}</div>
                    {a.is_active ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                        ACTIVE
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 text-sm text-gray-600 line-clamp-2">{a.body}</div>
                </div>

                <button
                  onClick={() => deleteAnnouncement(a)}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                >
                  <TrashIcon className="h-5 w-5 text-rose-600" />
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
