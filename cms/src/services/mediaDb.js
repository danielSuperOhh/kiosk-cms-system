import { supabase } from "./supabaseClient"

export async function addMediaItem({ kioskId, type, url, fileName, sortOrder }) {
  const { error } = await supabase.from("media_items").insert([
    {
      kiosk_id: kioskId,
      type,
      url,
      file_name: fileName,
      sort_order: sortOrder ?? 0,
    },
  ])

  if (error) throw error
}
