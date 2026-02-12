import { useEffect, useState } from "react"
import { supabase } from "../services/supabaseClient"
import { ClockIcon } from "@heroicons/react/24/outline"

const KIOSK_ID = "e1eb7ca7-eac4-496a-a251-697bd156c1cd"

export default function KioskSettingsPanel() {
  const [seconds, setSeconds] = useState(8)
  const [status, setStatus] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      setStatus("Loading...")
      const { data, error } = await supabase
        .from("kiosk_settings")
        .select("image_duration_ms")
        .eq("kiosk_id", KIOSK_ID)
        .single()

      if (error) {
        setStatus(`Error: ${error.message}`)
        return
      }

      const ms = Number(data?.image_duration_ms ?? 8000)
      setSeconds(Math.max(1, Math.round(ms / 1000)))
      setStatus("")
    }

    load()
  }, [])

  async function save() {
    const ms = Math.max(1000, Number(seconds) * 1000)
    setSaving(true)
    setStatus("Saving...")

    const { error } = await supabase
      .from("kiosk_settings")
      .upsert({ kiosk_id: KIOSK_ID, image_duration_ms: ms })

    if (error) setStatus(`Error: ${error.message}`)
    else setStatus("Saved ✅")

    setSaving(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <div className="flex items-center gap-2">
        <ClockIcon className="h-5 w-5 text-slate-700" />
        <h2 className="text-xl font-bold">Kiosk Settings</h2>
      </div>

      <p className="mt-1 text-sm text-gray-600">
        Control how long each <b>image</b> stays on screen (videos still play to the end).
      </p>

      <label className="block mt-4 text-sm font-medium">Image duration (seconds)</label>
      <input
        type="number"
        min={1}
        value={seconds}
        onChange={(e) => setSeconds(e.target.value)}
        className="mt-1 w-full border rounded-lg p-2"
      />

      <button
        onClick={save}
        disabled={saving}
        className="mt-5 px-4 py-2 rounded-lg bg-black text-white disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save"}
      </button>

      {status ? <div className="mt-4 text-sm text-gray-700">{status}</div> : null}
    </div>
  )
}
