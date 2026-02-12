import { supabase } from "./supabaseClient"

export async function getMediaForKiosk(kioskId) {
  const { data, error } = await supabase
    .from("media_items")
    .select("id,type,url,sort_order")
    .eq("kiosk_id", kioskId)
    .order("sort_order", { ascending: true })

  if (error) throw error
  return data || []
}
