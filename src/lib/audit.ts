import { supabase } from "@/integrations/supabase/client";

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  entity_label: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export type AuditEntity = "member" | "payment" | "attendance" | "plan" | "settings" | "import";

/** Fire-and-forget audit trail entry. Never throws — logging must not break the action. */
export const logAudit = async (entry: {
  action: string;
  entity: AuditEntity;
  entity_id?: string | null;
  entity_label?: string | null;
  details?: Record<string, unknown>;
}) => {
  try {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;
    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      actor_email: user.email ?? null,
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entity_id ?? null,
      entity_label: entry.entity_label ?? null,
      details: entry.details ?? {},
    });
  } catch {
    /* silent */
  }
};

export const AUDIT_ACTIONS = [
  "member.create",
  "member.update",
  "member.delete",
  "member.activate",
  "member.deactivate",
  "member.import",
  "payment.create",
  "attendance.checkin",
  "plan.create",
  "plan.update",
  "plan.delete",
  "settings.update",
] as const;

export const actionLabel = (action: string) =>
  action
    .split(".")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" · ");
