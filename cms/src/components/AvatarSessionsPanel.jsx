import { useEffect, useMemo, useState } from "react"
import { supabase } from "../services/supabaseClient"
import {
  TrashIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline"

const KIOSK_ID = "e1eb7ca7-eac4-496a-a251-697bd156c1cd"

export default function AvatarSessionsPanel() {
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState([])

  const [selectedId, setSelectedId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)

  async function loadSessions() {
    setLoading(true)

    const { data: sData, error: sErr } = await supabase
      .from("avatar_sessions")
      .select("id, kiosk_id, user_agent, started_at, ended_at")
      .eq("kiosk_id", KIOSK_ID)
      .order("started_at", { ascending: false })

    if (sErr) {
      setStatus(`Error: ${sErr.message}`)
      setSessions([])
      setLoading(false)
      return
    }

    const ids = (sData || []).map((s) => s.id)
    const countsMap = {}

    if (ids.length) {
      const { data: mData } = await supabase
        .from("avatar_messages")
        .select("session_id")
        .in("session_id", ids)

      if (mData) {
        for (const row of mData) countsMap[row.session_id] = (countsMap[row.session_id] || 0) + 1
      }
    }

    const list = (sData || []).map((s) => ({ ...s, messageCount: countsMap[s.id] || 0 }))
    setSessions(list)

    if (selectedId && !list.some((s) => s.id === selectedId)) {
      setSelectedId(null)
      setMessages([])
    }

    setLoading(false)
  }

  async function loadMessages(sessionId) {
    if (!sessionId) return
    setLoadingMsgs(true)

    const { data, error } = await supabase
      .from("avatar_messages")
      .select("id, session_id, role, content, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })

    if (error) {
      setStatus(`Error: ${error.message}`)
      setMessages([])
    } else {
      setMessages(data || [])
    }

    setLoadingMsgs(false)
  }

  useEffect(() => {
    loadSessions()
  }, [])

  useEffect(() => {
    if (selectedId) loadMessages(selectedId)
  }, [selectedId])

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === selectedId),
    [sessions, selectedId]
  )

  async function deleteSession(session) {
    if (!confirm(`Delete this session? (Messages will be deleted too)`)) return
    setStatus("Deleting session...")

    try {
      const { error: mErr } = await supabase
        .from("avatar_messages")
        .delete()
        .eq("session_id", session.id)
      if (mErr) throw mErr

      const { error: sErr } = await supabase
        .from("avatar_sessions")
        .delete()
        .eq("id", session.id)
      if (sErr) throw sErr

      setStatus("Deleted ✅")
      if (selectedId === session.id) {
        setSelectedId(null)
        setMessages([])
      }
      await loadSessions()
    } catch (e) {
      setStatus(`Error: ${e.message}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Assistant sessions</h2>
            <p className="mt-1 text-sm text-gray-600">
              Click a session to preview the chat, then delete if needed.
            </p>
          </div>

          <button
            onClick={loadSessions}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {status ? <div className="mt-4 text-sm text-gray-700">{status}</div> : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: sessions list */}
        <div className="lg:col-span-2 rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-4">
          <div className="px-2 pb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-700" />
            Sessions
          </div>

          {loading ? (
            <div className="px-2 py-3 text-sm text-gray-600">Loading…</div>
          ) : sessions.length === 0 ? (
            <div className="px-2 py-3 text-sm text-gray-600">No sessions yet.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sessions.map((s) => {
                const active = s.id === selectedId
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    className={[
                      "w-full text-left px-3 py-3 rounded-xl transition",
                      active ? "bg-gray-900 text-white" : "hover:bg-gray-50 text-gray-900",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold truncate">
                          Session {s.id.slice(0, 8)}…
                        </div>
                        <div className={["text-xs mt-1", active ? "text-white/70" : "text-gray-600"].join(" ")}>
                          Msgs: {s.messageCount} • {s.started_at ? new Date(s.started_at).toLocaleString() : "—"}
                        </div>
                      </div>

                      <span
                        className={[
                          "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
                          active ? "bg-white/15 text-white" : "bg-gray-100 text-gray-700",
                        ].join(" ")}
                      >
                        {s.ended_at ? "Closed" : "Open"}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-3 rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-4">
          {!selectedSession ? (
            <div className="p-6 text-sm text-gray-600">
              Select a session on the left to preview messages.
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3 px-2 pb-3 border-b border-gray-100">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    Session {selectedSession.id}
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    Started: {selectedSession.started_at ? new Date(selectedSession.started_at).toLocaleString() : "—"}
                    {selectedSession.ended_at
                      ? ` • Ended: ${new Date(selectedSession.ended_at).toLocaleString()}`
                      : " • (still open)"}
                  </div>
                </div>

                <button
                  onClick={() => deleteSession(selectedSession)}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                >
                  <TrashIcon className="h-5 w-5 text-rose-600" />
                  Delete session
                </button>
              </div>

              <div className="p-2">
                {loadingMsgs ? (
                  <div className="p-4 text-sm text-gray-600">Loading messages…</div>
                ) : messages.length === 0 ? (
                  <div className="p-4 text-sm text-gray-600">No messages for this session.</div>
                ) : (
                  <div className="space-y-3 max-h-[60vh] overflow-auto pr-2">
                    {messages.map((m) => {
                      const isUser = m.role === "user"
                      return (
                        <div
                          key={m.id}
                          className={[
                            "flex",
                            isUser ? "justify-end" : "justify-start",
                          ].join(" ")}
                        >
                          <div
                            className={[
                              "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                              isUser
                                ? "bg-gray-900 text-white"
                                : "bg-gray-100 text-gray-900",
                            ].join(" ")}
                          >
                            <div className="text-[11px] opacity-70 mb-1">
                              {isUser ? "User" : "Assistant"}
                              {m.created_at ? ` • ${new Date(m.created_at).toLocaleTimeString()}` : ""}
                            </div>
                            <div className="whitespace-pre-wrap break-words">{m.content}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
