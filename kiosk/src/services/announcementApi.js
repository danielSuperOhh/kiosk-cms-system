import { supabase } from "./supabaseClient"

export async function getActiveAnnouncement(kioskId) {
  const { data, error } = await supabase
    .from("announcements")
    .select("id,title,body,is_active,expires_at,updated_at")
    .eq("kiosk_id", kioskId)
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}
