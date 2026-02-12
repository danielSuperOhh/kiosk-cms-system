import { useEffect, useRef, useState } from "react"
import { supabase } from "./services/supabaseClient"
import { getActiveAnnouncement } from "./services/announcementApi"
import { getMediaForKiosk } from "./services/mediaApi"
import { getKioskSettings } from "./services/settingsApi"
import AvatarChat from "./components/AvatarChat"
import { UserCircleIcon } from "@heroicons/react/24/solid"

const KIOSK_ID = "e1eb7ca7-eac4-496a-a251-697bd156c1cd"
const DEFAULT_IMAGE_DURATION_MS = 8000

function startTtsLoop(text) {
  if (!("speechSynthesis" in window)) return
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 1
  utterance.pitch = 1
  utterance.volume = 1

  utterance.onend = () => {
    setTimeout(() => {
      window.speechSynthesis.speak(utterance)
    }, 1000)
  }

  window.speechSynthesis.speak(utterance)
}

function stopTts() {
  if (!("speechSynthesis" in window)) return
  window.speechSynthesis.cancel()
}

export default function App() {
  const [announcement, setAnnouncement] = useState(null)
  const [status, setStatus] = useState("Loading kiosk...")
  const [mediaItems, setMediaItems] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [imageDurationMs, setImageDurationMs] = useState(DEFAULT_IMAGE_DURATION_MS)

  // ✅ Avatar
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [avatarSessionId, setAvatarSessionId] = useState(null)

  const spokenTextRef = useRef("")

  function nextMedia() {
    setCurrentIndex((i) => {
      if (mediaItems.length === 0) return 0
      return (i + 1) % mediaItems.length
    })
  }

  async function applyAnnouncement(active) {
    setAnnouncement(active)

    const nextText = active?.body?.trim() || ""
    if (!nextText) {
      spokenTextRef.current = ""
      stopTts()
      return
    }

    if (spokenTextRef.current !== nextText) {
      spokenTextRef.current = nextText
      startTtsLoop(nextText)
    }
  }

  async function startAvatarSession() {
    const ua = navigator.userAgent || ""
    const { data, error } = await supabase
      .from("avatar_sessions")
      .insert([{ kiosk_id: KIOSK_ID, user_agent: ua }])
      .select("id")
      .single()

    if (error) throw error
    return data.id
  }

  async function endAvatarSession(sessionId) {
    if (!sessionId) return
    await supabase
      .from("avatar_sessions")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", sessionId)
  }

  async function logAvatarMessage(role, content) {
    if (!avatarSessionId) return
    await supabase.from("avatar_messages").insert([
      { session_id: avatarSessionId, role, content },
    ])
  }

  async function openAssistant() {
    try {
      const id = await startAvatarSession()
      setAvatarSessionId(id)
      setAvatarOpen(true)
    } catch (e) {
      console.error(e)
      setAvatarSessionId(null)
      setAvatarOpen(true)
    }
  }

  async function closeAssistant() {
    setAvatarOpen(false)
    try {
      await endAvatarSession(avatarSessionId)
    } finally {
      setAvatarSessionId(null)
    }
  }

  useEffect(() => {
    let announceChannel
    let mediaChannel
    let settingsChannel

    async function init() {
      try {
        try {
          const settings = await getKioskSettings(KIOSK_ID)
          const ms = Number(settings?.image_duration_ms)
          if (Number.isFinite(ms) && ms >= 1000) setImageDurationMs(ms)
        } catch (e) {
          console.warn("Could not load kiosk_settings, using default:", e.message)
          setImageDurationMs(DEFAULT_IMAGE_DURATION_MS)
        }

        const media = await getMediaForKiosk(KIOSK_ID)
        setMediaItems(media)
        setCurrentIndex(0)

        const active = await getActiveAnnouncement(KIOSK_ID)
        await applyAnnouncement(active)

        setStatus("Connected ✅")

        announceChannel = supabase
          .channel(`announcements-changes-${KIOSK_ID}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "announcements",
              filter: `kiosk_id=eq.${KIOSK_ID}`,
            },
            async () => {
              const activeNow = await getActiveAnnouncement(KIOSK_ID)
              await applyAnnouncement(activeNow)
            }
          )
          .subscribe()

        mediaChannel = supabase
          .channel(`media-items-changes-${KIOSK_ID}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "media_items",
              filter: `kiosk_id=eq.${KIOSK_ID}`,
            },
            async () => {
              const updatedMedia = await getMediaForKiosk(KIOSK_ID)
              setMediaItems(updatedMedia)
              setCurrentIndex((i) => (updatedMedia.length === 0 ? 0 : i % updatedMedia.length))
            }
          )
          .subscribe()

        settingsChannel = supabase
          .channel(`kiosk-settings-changes-${KIOSK_ID}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "kiosk_settings",
              filter: `kiosk_id=eq.${KIOSK_ID}`,
            },
            async () => {
              try {
                const settings = await getKioskSettings(KIOSK_ID)
                const ms = Number(settings?.image_duration_ms)
                if (Number.isFinite(ms) && ms >= 1000) setImageDurationMs(ms)
              } catch (e) {
                console.warn("Settings refresh failed:", e.message)
              }
            }
          )
          .subscribe()
      } catch (e) {
        setStatus(`Error: ${e.message}`)
      }
    }

    init()

    return () => {
      if (announceChannel) supabase.removeChannel(announceChannel)
      if (mediaChannel) supabase.removeChannel(mediaChannel)
      if (settingsChannel) supabase.removeChannel(settingsChannel)
      stopTts()
    }
  }, [])

  useEffect(() => {
    if (mediaItems.length === 0) return

    const current = mediaItems[currentIndex]
    if (!current || current.type !== "image") return

    const ms = Math.max(1000, Number(imageDurationMs) || DEFAULT_IMAGE_DURATION_MS)
    const timer = setTimeout(() => nextMedia(), ms)
    return () => clearTimeout(timer)
  }, [currentIndex, mediaItems, imageDurationMs])

  const current = mediaItems[currentIndex]
  const hasMedia = Boolean(current)
  const total = mediaItems.length
  const indexLabel = total ? `${currentIndex + 1} / ${total}` : "0 / 0"

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <AvatarChat
        open={avatarOpen}
        onClose={closeAssistant}
        sessionId={avatarSessionId}
        onLogMessage={logAvatarMessage}
      />

      <button
        onClick={openAssistant}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-white/10 px-4 py-3 text-sm text-white/90 backdrop-blur ring-1 ring-white/20 shadow-xl hover:bg-white/15"
        aria-label="Open assistant"
      >
        <UserCircleIcon className="h-6 w-6" />
        Assistant
      </button>

      <div className="absolute inset-0">
        {!hasMedia ? (
          <div className="h-full w-full grid place-items-center text-white/70">
            {status} — No media uploaded yet.
          </div>
        ) : current.type === "image" ? (
          <img key={current.id} src={current.url} alt="kiosk media" className="h-full w-full object-cover" />
        ) : (
          <video
            key={current.id}
            src={current.url}
            className="h-full w-full object-cover"
            autoPlay
            muted
            playsInline
            onEnded={nextMedia}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-black/65" />
      </div>

      <div className="relative z-10 flex items-center justify-between p-5">
        <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur">
          {status}
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur">
            Media {indexLabel}
          </div>
          <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur">
            Img {(imageDurationMs / 1000).toFixed(1)}s
          </div>
        </div>
      </div>

      <div className="relative z-10 min-h-[calc(100vh-64px)] flex items-center justify-center px-6 pb-10">
        {!announcement ? (
          <div className="max-w-xl text-center">
            <div className="text-3xl font-semibold tracking-tight">No announcement</div>
            <div className="mt-2 text-sm text-white/70">
              When an announcement goes live, it will appear here instantly.
            </div>

            <div className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/80 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Live updates enabled
            </div>
          </div>
        ) : (
          <div className="w-full max-w-4xl">
            <div className="rounded-3xl bg-white/10 p-8 backdrop-blur ring-1 ring-white/15 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Live announcement
                  </div>

                  <h1 className="mt-4 text-4xl font-semibold tracking-tight">{announcement.title}</h1>
                </div>

                <div className="shrink-0 rounded-2xl bg-black/30 px-4 py-3 text-xs text-white/80 ring-1 ring-white/10">
                  TTS: ON
                </div>
              </div>

              <div className="mt-6 text-lg leading-relaxed text-white/90">{announcement.body}</div>

              <div className="mt-8 flex items-center justify-between text-xs text-white/60">
                <div className="rounded-full bg-white/10 px-3 py-1 backdrop-blur">Updates automatically</div>
                <div className="rounded-full bg-white/10 px-3 py-1 backdrop-blur">Kiosk display</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent" />
    </div>
  )
}
