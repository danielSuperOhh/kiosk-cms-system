import { useEffect, useRef, useState } from "react"
import { supabase } from "../services/supabaseClient"
import { uploadMediaFile } from "../services/mediaStorage"
import { addMediaItem } from "../services/mediaDb"
import {
  ArrowUpTrayIcon,
  TrashIcon,
  PhotoIcon,
  FilmIcon,
} from "@heroicons/react/24/outline"

const KIOSK_ID = "e1eb7ca7-eac4-496a-a251-697bd156c1cd"
const MEDIA_BUCKET = "media" // ✅ your bucket name

export default function MediaUploadPanel() {
  const fileInputRef = useRef(null)

  const [file, setFile] = useState(null)
  const [sortOrder, setSortOrder] = useState(0)
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])

  async function loadMedia() {
    setLoading(true)
    const { data, error } = await supabase
      .from("media_items")
      .select("id, kiosk_id, type, url, file_name, file_path, sort_order, created_at")
      .eq("kiosk_id", KIOSK_ID)
      .order("created_at", { ascending: false })

    if (error) {
      setStatus(`Error: ${error.message}`)
      setItems([])
    } else {
      setItems(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadMedia()
  }, [])

  function openPicker() {
    fileInputRef.current?.click()
  }

  async function handleUpload() {
    if (!file) return setStatus("Please select a file first.")
    setStatus("Uploading...")

    try {
      const mime = file.type || ""
      const name = file.name.toLowerCase()

      const isVideo = mime.startsWith("video/") || name.endsWith(".mp4") || name.endsWith(".webm")
      const isImage = mime.startsWith("image/") || name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg")

      if (!isVideo && !isImage) return setStatus("Only image/video files are allowed.")

      const type = isVideo ? "video" : "image"

      const { publicUrl, filePath } = await uploadMediaFile(file)

      await addMediaItem({
        kioskId: KIOSK_ID,
        type,
        url: publicUrl,
        fileName: file.name,
        sortOrder: Number(sortOrder),
        filePath, 
      })

      setStatus("Upload complete ✅")
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      await loadMedia()
    } catch (e) {
      setStatus(`Error: ${e.message}`)
    }
  }

  async function deleteMedia(item) {
    const label = item.file_name || item.url
    if (!confirm(`Delete "${label}"?`)) return

    setStatus("Deleting...")

    try {
      if (item.file_path) {
        const { error: storageErr } = await supabase
          .storage
          .from(MEDIA_BUCKET)
          .remove([item.file_path])

        if (storageErr) throw storageErr
      }

      const { error } = await supabase.from("media_items").delete().eq("id", item.id)
      if (error) throw error

      setStatus("Deleted ✅")
      await loadMedia()
    } catch (e) {
      setStatus(`Error: ${e.message}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Media</h2>
            <p className="mt-1 text-sm text-gray-600">
              Upload media and manage past uploads.
            </p>
          </div>

          <button
            onClick={openPicker}
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 w-fit"
          >
            <ArrowUpTrayIcon className="h-5 w-5" />
            Upload media
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="sm:col-span-2">
            <div className="text-sm font-medium text-gray-800">Selected file</div>
            <div className="mt-2 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700 ring-1 ring-gray-200">
              {file ? file.name : "No file selected"}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-800">Sort order</div>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="mt-2 w-full rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-900 ring-1 ring-gray-200 outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={handleUpload}
            disabled={!file}
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Upload
          </button>

          {status ? <div className="text-sm text-gray-700">{status}</div> : null}
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Past uploads</h3>
          <button
            onClick={loadMedia}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="mt-4 text-sm text-gray-600">Loading…</div>
        ) : items.length === 0 ? (
          <div className="mt-4 text-sm text-gray-600">No media uploaded yet.</div>
        ) : (
          <div className="mt-4 divide-y divide-gray-100">
            {items.map((it) => {
              const Icon = it.type === "video" ? FilmIcon : PhotoIcon
              return (
                <div key={it.id} className="py-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-gray-100 grid place-items-center">
                    <Icon className="h-5 w-5 text-gray-700" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 truncate">
                      {it.file_name || it.url}
                    </div>
                    <div className="text-xs text-gray-600">
                      {it.type} • sort {it.sort_order ?? 0}
                    </div>
                  </div>

                  <a
                    href={it.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-gray-800 hover:underline"
                  >
                    View
                  </a>

                  <button
                    onClick={() => deleteMedia(it)}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                    title="Delete"
                  >
                    <TrashIcon className="h-5 w-5 text-rose-600" />
                    Delete
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
