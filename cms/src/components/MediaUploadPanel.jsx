import { useState } from "react"
import { uploadMediaFile } from "../services/mediaStorage"
import { addMediaItem } from "../services/mediaDb"

const KIOSK_ID = "e1eb7ca7-eac4-496a-a251-697bd156c1cd"

export default function MediaUploadPanel() {
  const [file, setFile] = useState(null)
  const [sortOrder, setSortOrder] = useState(0)
  const [status, setStatus] = useState("")

  async function handleUpload() {
    if (!file) {
      setStatus("Please select a file first.")
      return
    }

    setStatus("Uploading...")

    try {
      const mime = file.type || ""
      const name = file.name.toLowerCase()

      const isVideo = mime.startsWith("video/") || name.endsWith(".mp4") || name.endsWith(".webm")
      const isImage =
        mime.startsWith("image/") || name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg")

      if (!isVideo && !isImage) {
        setStatus("Only image/video files are allowed.")
        return
      }

      const type = isVideo ? "video" : "image"

      const { publicUrl } = await uploadMediaFile(file)

      await addMediaItem({
        kioskId: KIOSK_ID,
        type,
        url: publicUrl,
        fileName: file.name,
        sortOrder: Number(sortOrder),
      })

      setStatus("Upload complete ✅")
      setFile(null)
    } catch (e) {
      setStatus(`Error: ${e.message}`)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-xl font-bold">Media Upload</h2>

      <label className="block mt-4 text-sm font-medium">Select image/video</label>
      <input
        type="file"
        accept="image/*,video/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="mt-2 block w-full"
      />

      <label className="block mt-4 text-sm font-medium">Sort order</label>
      <input
        type="number"
        value={sortOrder}
        onChange={(e) => setSortOrder(e.target.value)}
        className="mt-1 w-full border rounded-lg p-2"
      />

      <button onClick={handleUpload} className="mt-5 px-4 py-2 rounded-lg bg-black text-white">
        Upload
      </button>

      <div className="mt-4 text-sm text-gray-700">{status}</div>
    </div>
  )
}
