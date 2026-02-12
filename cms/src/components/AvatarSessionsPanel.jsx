import { useEffect, useMemo, useState } from "react"
import { supabase } from "../services/supabaseClient"
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline"

const KIOSK_ID = "e1eb7ca7-eac4-496a-a251-697bd156c1cd"

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export default function AvatarSessionsPanel() {
  const [sessions, setSessions] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [messages, setMessages] = useState([])
  const [status, setStatus] = useState("")

  async function loadSessions() {
    const { data, error } = await supabase
      .from("avatar_sessions")
      .select("id,kiosk_id,started_at,ended_at,user_agent")
      .eq("kiosk_id", KIOSK_ID)
      .order("started_at", { ascending: false })
      .limit(50)

    if (error) {
      setStatus(`Error: ${error.message}`)
      return
    }
    setSessions(data || [])
    if (!selectedId && data?.[0]?.id) setSelectedId(data[0].id)
  }

  async function loadMessages(sessionId) {
    if (!sessionId) return
    const { data, error } = await supabase
      .from("avatar_messages")
      .select("id,role,content,created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })

    if (error) {
      setStatus(`Error: ${error.message}`)
      setMessages([])
      return
    }
    setMessages(data || [])
  }

  useEffect(() => {
    setStatus("")
    loadSessions()

    const channel = supabase
      .channel(`avatar-sessions-${KIOSK_ID}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "avatar_sessions", filter: `kiosk_id=eq.${KIOSK_ID}` },
        () => loadSessions()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  useEffect(() => {
    loadMessages(selectedId)

    if (!selectedId) return
    const channel = supabase
      .channel(`avatar-messages-${selectedId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "avatar_messages", filter: `session_id=eq.${selectedId}` },
        () => loadMessages(selectedId)
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [selectedId])

  const selected = useMemo(
    () => sessions.find((s) => s.id === selectedId) || null,
    [sessions, selectedId]
  )

  return (
    <div className="bg-white rounded-2xl shadow overflow-hidden">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <ChatBubbleLeftRightIcon className="h-5 w-5 text-slate-700" />
          <h2 className="text-xl font-bold">Assistant Sessions</h2>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Each time the assistant opens, a new session starts. Closing it ends the session.
        </p>
        {status ? <div className="mt-3 text-sm text-rose-600">{status}</div> : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3">
        <div className="border-r">
          <div className="max-h-[60vh] overflow-auto">
            {sessions.length === 0 ? (
              <div className="p-6 text-sm text-gray-600">No sessions yet.</div>
            ) : (
              sessions.map((s) => {
                const active = s.id === selectedId
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    className={`w-full text-left px-5 py-4 border-b hover:bg-gray-50 ${
                      active ? "bg-gray-50" : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-sm text-gray-900">
                        Session • {s.id.slice(0, 8)}
                      </div>
                      <div className={`text-xs ${s.ended_at ? "text-gray-500" : "text-emerald-600"}`}>
                        {s.ended_at ? "Ended" : "Active"}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      Start: {formatTime(s.started_at)}
                    </div>
                    {s.ended_at ? (
                      <div className="text-xs text-gray-600">End: {formatTime(s.ended_at)}</div>
                    ) : null}
                  </button>
                )
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {!selected ? (
            <div className="p-6 text-sm text-gray-600">Select a session to view messages.</div>
          ) : (
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    Session {selected.id.slice(0, 8)}
                  </div>
                  <div className="text-xs text-gray-600">
                    {selected.ended_at ? "Ended" : "Active"} • Started {formatTime(selected.started_at)}
                  </div>
                </div>
              </div>

              <div className="mt-4 max-h-[52vh] overflow-auto space-y-3">
                {messages.length === 0 ? (
                  <div className="text-sm text-gray-600">No messages in this session yet.</div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                        m.role === "user"
                          ? "ml-auto bg-gray-900 text-white"
                          : "mr-auto bg-gray-100 text-gray-900"
                      }`}
                    >
                      <div className="leading-relaxed">{m.content}</div>
                      <div className={`mt-1 text-[11px] ${m.role === "user" ? "text-white/70" : "text-gray-500"}`}>
                        {formatTime(m.created_at)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
