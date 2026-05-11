import { supabase } from "@/integrations/supabase/client";

export type ContactChannel = "whatsapp" | "call";

export async function trackContactClick(channel: ContactChannel) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("contact_clicks").insert({
      channel,
      user_id: user?.id ?? null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
    });
  } catch (err) {
    // Don't block the user navigating to WhatsApp/phone if logging fails
    console.warn("contact click tracking failed", err);
  }
}
