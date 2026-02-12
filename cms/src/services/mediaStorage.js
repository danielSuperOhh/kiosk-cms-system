import { supabase } from "./supabaseClient"

// Uploads a file to the "media" bucket and returns the public URL + storage path
export async function uploadMediaFile(file) {
  const fileExt = file.name.split(".").pop()
  const safeName = file.name.replace(/\s+/g, "_")
  const filePath = `${Date.now()}_${safeName}`

  const { error: uploadError } = await supabase.storage
    .from("media")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from("media").getPublicUrl(filePath)

  return { publicUrl: data.publicUrl, filePath }
}
