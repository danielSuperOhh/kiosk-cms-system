import { supabase } from "./supabaseClient"

export async function getKioskSettings(kioskId) {
  const { data, error } = await supabase
    .from("kiosk_settings")
    .select("image_duration_ms")
    .eq("kiosk_id", kioskId)
    .single()

  if (error) throw error
  return data
}
