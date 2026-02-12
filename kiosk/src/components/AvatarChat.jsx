import { useEffect, useMemo, useRef, useState } from "react"
import { XMarkIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline"

function generateReply(text) {
  const t = text.toLowerCase().trim()

  if (!t) return "Ask me anything!"
  if (t.includes("help"))
    return "I can help you understand announcements, how the kiosk works, and where to find information."
  if (t.includes("announcement"))
    return "Announcements appear live on this screen. The admin can activate or deactivate them anytime."
  if (t.includes("media") || t.includes("video") || t.includes("image"))
    return "Media is uploaded by the admin and plays here automatically. Images rotate on a timer, videos play to the end."
  if (t.includes("hours") || t.includes("open"))
    return "If opening hours are available, the admin can add them to announcements or assistant settings."
  if (t.includes("thank")) return "You’re welcome!"
  if (t.includes("hello") || t.includes("hi")) return "Hey! How can I help you today?"

  return "Got it. Try asking about announcements, media, or how this kiosk works."
}

const INITIAL = [
  { role: "assistant", content: "Hi 👋 I’m your kiosk assistant. How can I help?" },
]

export default function AvatarChat({ open, onClose, sessionId, onLogMessage }) {
  const [messages, setMessages] = useState(INITIAL)
  const [input, setInput] = useState("")
  const listRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setMessages(INITIAL)
    setInput("")
  }, [open])

  useEffect(() => {
    if (!open) return
    setTimeout(() => listRef.current?.scrollTo({ top: 999999, behavior: "smooth" }), 50)
  }, [open, messages])

  const greetedRef = useRef(false)
  useEffect(() => {
    if (!open) return
    if (!sessionId) return
    if (greetedRef.current) return

    greetedRef.current = true
    onLogMessage?.("assistant", "Hi 👋 I’m your kiosk assistant. How can I help?")
  }, [open, sessionId])

  useEffect(() => {
    if (!open) greetedRef.current = false
  }, [open])

  const canSend = useMemo(() => input.trim().length > 0, [input])

  async function send() {
    const text = input.trim()
    if (!text) return
    setInput("")

    const reply = generateReply(text)

    setMessages((m) => [
      ...m,
      { role: "user", content: text },
      { role: "assistant", content: reply },
    ])

    await onLogMessage?.("user", text)
    await onLogMessage?.("assistant", reply)
  }

  if (!open) return null

  return (
    <div className="fixed bottom-24 right-6 z-40 w-[min(420px,calc(100vw-48px))] overflow-hidden rounded-3xl bg-white/10 backdrop-blur ring-1 ring-white/20 shadow-2xl">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex flex-col">
          <div className="text-sm font-semibold text-white/90">Kiosk Assistant</div>
          <div className="text-[11px] text-white/60">
            Session will be closed when you exit the assistant.
          </div>
        </div>

        <button
          onClick={onClose}
          className="rounded-xl p-2 hover:bg-white/10"
          aria-label="Close assistant"
        >
          <XMarkIcon className="h-5 w-5 text-white/80" />
        </button>
      </div>

      <div ref={listRef} className="max-h-[50vh] overflow-auto px-5 pb-4 space-y-3">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              m.role === "user"
                ? "ml-auto bg-white/20 text-white"
                : "mr-auto bg-black/30 text-white/90 ring-1 ring-white/10"
            }`}
          >
            {m.content}
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => (e.key === "Enter" ? send() : null)}
            className="flex-1 rounded-2xl bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/50 outline-none ring-1 ring-white/10 focus:ring-white/25"
            placeholder="Type a message…"
          />
          <button
            onClick={send}
            disabled={!canSend}
            className="rounded-2xl bg-white/15 p-3 ring-1 ring-white/20 hover:bg-white/20 disabled:opacity-40"
            aria-label="Send"
          >
            <PaperAirplaneIcon className="h-5 w-5 text-white" />
          </button>
        </div>

        <div className="mt-2 text-[11px] text-white/55">
          Session: {sessionId ? "active" : "starting..."}
        </div>
      </div>
    </div>
  )
}
