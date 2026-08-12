import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Camera, CameraOff, CheckCircle2, Loader2, Search, XCircle } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { useToast } from "@/hooks/use-toast";
import { logAudit } from "@/lib/audit";
import { daysLeft, fmtDate, fmtDateTime, isExpired, todayISO, type AttendanceRow, type Member } from "@/lib/mgmt";

type Result = { ok: boolean; title: string; detail: string; member?: Member };

const CheckInTab = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [today, setToday] = useState<(AttendanceRow & { member?: Member })[]>([]);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const loadToday = async () => {
    const { data } = await supabase
      .from("attendance")
      .select("*")
      .eq("check_in_date", todayISO())
      .order("check_in_at", { ascending: false });
    const rows = (data ?? []) as AttendanceRow[];
    if (!rows.length) {
      setToday([]);
      return;
    }
    const { data: mem } = await supabase.from("members").select("*").in("id", rows.map((r) => r.member_id));
    const map = new Map(((mem ?? []) as Member[]).map((m) => [m.id, m]));
    setToday(rows.map((r) => ({ ...r, member: map.get(r.member_id) })));
  };

  useEffect(() => {
    loadToday();
    return () => {
      scannerRef.current?.stop().catch(() => undefined);
    };
  }, []);

  const doCheckIn = async (raw: string, method: "phone" | "qr") => {
    const term = raw.trim();
    if (!term) return;
    setBusy(true);
    try {
      const { data } = await supabase
        .from("members")
        .select("*")
        .or(`phone.eq.${term},member_code.eq.${term}`)
        .limit(1);
      const member = ((data ?? []) as Member[])[0];

      if (!member) {
        setResult({ ok: false, title: "Member not found", detail: `No member matches “${term}”.` });
        return;
      }
      if (!member.is_active) {
        setResult({ ok: false, title: "Membership inactive", detail: `${member.full_name} is marked inactive.`, member });
        return;
      }
      if (isExpired(member.membership_expiry)) {
        setResult({
          ok: false,
          title: "Membership expired",
          detail: `${member.full_name}'s membership ended on ${fmtDate(member.membership_expiry)}. Please renew.`,
          member,
        });
        return;
      }

      const { error } = await supabase.from("attendance").insert({ member_id: member.id, method });
      if (error) {
        if (error.code === "23505" || error.message.toLowerCase().includes("duplicate")) {
          setResult({ ok: false, title: "Already checked in", detail: `${member.full_name} is already checked in today.`, member });
          return;
        }
        throw error;
      }

      const left = daysLeft(member.membership_expiry);
      await logAudit({
        action: "attendance.checkin",
        entity: "attendance",
        entity_id: member.id,
        entity_label: `${member.full_name} (${member.member_code})`,
        details: { method, days_left: left ?? "" },
      });
      setResult({
        ok: true,
        title: "Check-in successful",
        detail: `${member.full_name} (${member.member_code}) · ${left} day${left === 1 ? "" : "s"} left`,
        member,
      });
      setQuery("");
      loadToday();
    } catch (e) {
      toast({ title: "Check-in failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const startScan = async () => {
    setScanning(true);
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 220 },
        async (text) => {
          await scanner.stop();
          scannerRef.current = null;
          setScanning(false);
          doCheckIn(text, "qr");
        },
        () => undefined,
      );
    } catch (e) {
      setScanning(false);
      toast({ title: "Camera unavailable", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const stopScan = async () => {
    await scannerRef.current?.stop().catch(() => undefined);
    scannerRef.current = null;
    setScanning(false);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-card/10 border-primary/20">
        <CardContent className="p-4 space-y-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Check in a member</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doCheckIn(query, "phone")}
                placeholder="Mobile number or member ID"
                className="pl-9 bg-sport-dark/50 border-primary/30 text-sport-dark-foreground h-11"
              />
            </div>
            <Button onClick={() => doCheckIn(query, "phone")} disabled={busy || !query} className="bg-sport-energy hover:bg-sport-energy/90 text-sport-energy-foreground uppercase tracking-wider text-xs h-11">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check in"}
            </Button>
            <Button variant="outline" onClick={scanning ? stopScan : startScan} className="border-primary/30 text-primary uppercase tracking-wider text-xs h-11">
              {scanning ? <><CameraOff className="w-4 h-4 mr-1" /> Stop</> : <><Camera className="w-4 h-4 mr-1" /> Scan QR</>}
            </Button>
          </div>
          <div id="qr-reader" className={scanning ? "rounded-lg overflow-hidden max-w-sm" : "hidden"} />
        </CardContent>
      </Card>

      {result && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className={result.ok ? "bg-primary/10 border-primary/40" : "bg-destructive/10 border-destructive/40"}>
            <CardContent className="p-4 flex items-start gap-3">
              {result.ok ? <CheckCircle2 className="w-6 h-6 text-primary shrink-0" /> : <XCircle className="w-6 h-6 text-destructive shrink-0" />}
              <div>
                <p className="font-semibold text-sport-dark-foreground">{result.title}</p>
                <p className="text-sm text-muted-foreground">{result.detail}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Today's check-ins ({today.length})</p>
        {today.length === 0 ? (
          <p className="text-muted-foreground text-sm py-6 text-center">No check-ins yet today.</p>
        ) : (
          <div className="space-y-2">
            {today.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.02, 0.2) }}>
                <Card className="bg-card/10 border-primary/20">
                  <CardContent className="p-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sport-dark-foreground text-sm font-medium">{a.member?.full_name ?? "Unknown"}</p>
                      <p className="text-xs text-muted-foreground font-mono">{a.member?.member_code}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="uppercase text-[10px] border-primary/40 text-primary">{a.method}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">{fmtDateTime(a.check_in_at)}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckInTab;
