import { useEffect, useMemo, useState } from "react"
import { supabase } from "../services/supabaseClient"
import {
  MegaphoneIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline"

const KIOSK_ID = "e1eb7ca7-eac4-496a-a251-697bd156c1cd"

function timeAgo(iso) {
  if (!iso) return ""
  const t = new Date(iso).getTime()
  const diff = Date.now() - t
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function AnnouncementPanel() {
  const [items, setItems] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [status, setStatus] = useState("")
  const [loadingList, setLoadingList] = useState(true)
  const [saving, setSaving] = useState(false)

  const selected = useMemo(
    () => items.find((x) => x.id === selectedId) || null,
    [items, selectedId]
  )

  async function fetchAnnouncements() {
    setLoadingList(true)
    const { data, error } = await supabase
      .from("announcements")
      .select("id,title,body,is_active,created_at")
      .eq("kiosk_id", KIOSK_ID)
      .order("created_at", { ascending: false })
      .limit(50)

    if (!error) {
      setItems(data || [])
      // auto-select newest if nothing selected
      if (!selectedId && (data?.length ?? 0) > 0) {
        setSelectedId(data[0].id)
        setTitle(data[0].title || "")
        setBody(data[0].body || "")
      }
    } else {
      setStatus(`Error: ${error.message}`)
    }
    setLoadingList(false)
  }

  useEffect(() => {
    let channel

    fetchAnnouncements()

    // realtime updates to list
    channel = supabase
      .channel("cms-announcements-list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        (payload) => {
          // Only refetch for our kiosk (fast + simple)
          const row = payload.new || payload.old
          if (row?.kiosk_id === KIOSK_ID) fetchAnnouncements()
        }
      )
      .subscribe()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function selectItem(item) {
    setSelectedId(item.id)
    setTitle(item.title || "")
    setBody(item.body || "")
    setStatus("")
  }

  function newAnnouncement() {
    setSelectedId(null)
    setTitle("")
    setBody("")
    setStatus("")
  }

  async function activate() {
    if (!title.trim() || !body.trim()) {
      setStatus("Error: Title and text are required.")
      return
    }

    setSaving(true)
    setStatus("Activating...")

    try {
      // 1) deactivate any currently active
      await supabase
        .from("announcements")
        .update({ is_active: false })
        .eq("kiosk_id", KIOSK_ID)
        .eq("is_active", true)

      // 2) insert new active announcement (keeps history clean)
      const { error } = await supabase.from("announcements").insert([
        { kiosk_id: KIOSK_ID, title: title.trim(), body: body.trim(), is_active: true },
      ])

      if (error) throw error
      setStatus("Announcement active ✅")
      await fetchAnnouncements()
    } catch (e) {
      setStatus(`Error: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function deactivate() {
    setSaving(true)
    setStatus("Deactivating...")

    try {
      const { error } = await supabase
        .from("announcements")
        .update({ is_active: false })
        .eq("kiosk_id", KIOSK_ID)
        .eq("is_active", true)

      if (error) throw error
      setStatus("Announcement off ✅")
      await fetchAnnouncements()
    } catch (e) {
      setStatus(`Error: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow overflow-hidden">
      <div className="p-5 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MegaphoneIcon className="h-5 w-5 text-slate-700" />
            <h2 className="text-lg font-semibold">Announcements</h2>
          </div>

          <button
            onClick={newAnnouncement}
            className="text-sm px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
          >
            New
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Activate to push live to the kiosk. Previous items stay saved.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr]">
        {/* LEFT: history nav */}
        <div className="border-r bg-slate-50">
          <div className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Previous
          </div>

          {loadingList ? (
            <div className="px-3 pb-4 text-sm text-slate-600">Loading…</div>
          ) : items.length === 0 ? (
            <div className="px-3 pb-4 text-sm text-slate-600">
              No announcements yet.
            </div>
          ) : (
            <div className="max-h-[420px] overflow-auto pb-3">
              {items.map((item) => {
                const active = item.is_active
                const isSelected = item.id === selectedId
                return (
                  <button
                    key={item.id}
                    onClick={() => selectItem(item)}
                    className={[
                      "w-full text-left px-3 py-3 transition",
                      isSelected ? "bg-white" : "hover:bg-white/70",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-900">
                          {item.title || "(Untitled)"}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                          <ClockIcon className="h-4 w-4" />
                          <span>{timeAgo(item.created_at)}</span>
                        </div>
                      </div>

                      {active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                          <CheckCircleIcon className="h-4 w-4" />
                          Active
                        </span>
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* RIGHT: editor */}
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              {selected ? (
                <>
                  Editing: <span className="font-medium text-slate-900">{selected.title || "(Untitled)"}</span>
                </>
              ) : (
                <>Creating a new announcement</>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 p-2 outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="e.g., Store closed at 6pm"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700">Text</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 p-2 h-28 outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="Write the announcement…"
            />
          </div>

          {status ? (
            <div
              className={`mt-4 rounded-lg px-3 py-2 text-sm ${
                status.startsWith("Error:")
                  ? "bg-rose-50 text-rose-700"
                  : "bg-slate-50 text-slate-700"
              }`}
            >
              {status}
            </div>
          ) : null}

          <div className="mt-5 flex gap-3">
            <button
              onClick={activate}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? "Working..." : "Activate"}
            </button>

            <button
              onClick={deactivate}
              disabled={saving}
              className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-60"
            >
              Deactivate
            </button>
          </div>

          <div className="mt-4 text-xs text-slate-500">
            Tip: Activating always creates a new record (history stays intact).
          </div>
        </div>
      </div>
    </div>
  )
}
