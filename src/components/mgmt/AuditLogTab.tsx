import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Download, History, Loader2, Search } from "lucide-react";
import { actionLabel, type AuditLog } from "@/lib/audit";
import { downloadCsv, fmtDateTime } from "@/lib/mgmt";

const ENTITIES = ["all", "member", "payment", "attendance", "plan", "settings", "import"] as const;

const entityStyles: Record<string, string> = {
  member: "border-primary/40 text-primary",
  payment: "border-sport-energy/40 text-sport-energy",
  attendance: "border-accent/40 text-accent",
  plan: "border-secondary/40 text-secondary",
  settings: "border-border text-muted-foreground",
  import: "border-primary/40 text-primary",
};

const AuditLogTab = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [entity, setEntity] = useState<string>("all");

  const load = async () => {
    const { data } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(500);
    setLogs((data ?? []) as unknown as AuditLog[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("audit-logs-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_logs" }, (payload) => {
        setLogs((prev) => [payload.new as unknown as AuditLog, ...prev].slice(0, 500));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((l) => {
      if (entity !== "all" && l.entity !== entity) return false;
      if (!q) return true;
      return [l.action, l.entity, l.entity_label ?? "", l.actor_email ?? ""].some((v) => v.toLowerCase().includes(q));
    });
  }, [logs, query, entity]);

  const exportCsv = () => {
    downloadCsv(
      `audit-log-${new Date().toISOString().slice(0, 10)}.csv`,
      filtered.map((l) => ({
        timestamp: l.created_at,
        staff: l.actor_email ?? "",
        action: l.action,
        entity: l.entity,
        target: l.entity_label ?? "",
        target_id: l.entity_id ?? "",
        details: JSON.stringify(l.details ?? {}),
      })),
    );
  };

  const detailText = (l: AuditLog) => {
    const d = l.details ?? {};
    const parts = Object.entries(d)
      .filter(([, v]) => v !== null && v !== "" && typeof v !== "object")
      .map(([k, v]) => `${k.replace(/_/g, " ")}: ${String(v)}`);
    return parts.join(" · ");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by action, staff email or member"
            className="pl-9 bg-sport-dark/50 border-primary/30 text-sport-dark-foreground"
          />
        </div>
        <Select value={entity} onValueChange={setEntity}>
          <SelectTrigger className="sm:w-44 bg-sport-dark/50 border-primary/30 text-sport-dark-foreground"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-sport-dark border-primary/30">
            {ENTITIES.map((e) => (
              <SelectItem key={e} value={e}>{e === "all" ? "All activity" : e.toUpperCase()}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportCsv} disabled={!filtered.length} className="border-primary/30 text-primary text-xs uppercase">
          <Download className="w-3 h-3 mr-1" /> Export CSV
        </Button>
      </div>

      <Card className="bg-card/10 border-primary/20">
        <CardContent className="p-4 flex items-center gap-3">
          <History className="w-5 h-5 text-primary" />
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Recorded actions (live)</p>
            <p className="font-display text-3xl text-sport-dark-foreground tracking-wider">{filtered.length}</p>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">No staff activity recorded yet.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((l, i) => (
            <motion.div key={l.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.015, 0.2) }}>
              <Card className="bg-card/10 border-primary/20">
                <CardContent className="p-3 flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-sport-dark-foreground">{actionLabel(l.action)}</p>
                      <Badge variant="outline" className={`text-[10px] uppercase ${entityStyles[l.entity] ?? "border-border text-muted-foreground"}`}>
                        {l.entity}
                      </Badge>
                    </div>
                    {l.entity_label && <p className="text-xs text-primary truncate">{l.entity_label}</p>}
                    {detailText(l) && <p className="text-xs text-muted-foreground">{detailText(l)}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-sport-dark-foreground">{l.actor_email ?? "Unknown staff"}</p>
                    <p className="text-xs text-muted-foreground">{fmtDateTime(l.created_at)}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditLogTab;
