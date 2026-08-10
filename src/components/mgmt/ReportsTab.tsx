import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  daysLeft,
  downloadCsv,
  fmtDate,
  fmtDateTime,
  fmtINR,
  isExpired,
  memberStatus,
  todayISO,
  type AttendanceRow,
  type Member,
  type MemberPayment,
} from "@/lib/mgmt";

const ReportsTab = () => {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<MemberPayment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(todayISO().slice(0, 8) + "01");
  const [to, setTo] = useState(todayISO());

  useEffect(() => {
    const load = async () => {
      const [m, p, a] = await Promise.all([
        supabase.from("members").select("*").order("full_name"),
        supabase.from("member_payments").select("*").order("paid_at", { ascending: false }).limit(1000),
        supabase.from("attendance").select("*").order("check_in_at", { ascending: false }).limit(1000),
      ]);
      setMembers((m.data ?? []) as Member[]);
      setPayments((p.data ?? []) as MemberPayment[]);
      setAttendance((a.data ?? []) as AttendanceRow[]);
      setLoading(false);
    };
    load();
  }, []);

  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const inRange = (iso: string) => iso.slice(0, 10) >= from && iso.slice(0, 10) <= to;

  const activeRows = members
    .filter((m) => memberStatus(m) === "active")
    .map((m) => ({
      member_id: m.member_code,
      name: m.full_name,
      phone: m.phone,
      email: m.email ?? "",
      start: m.membership_start ?? "",
      expiry: m.membership_expiry ?? "",
      days_left: daysLeft(m.membership_expiry) ?? "",
    }));

  const expiredRows = members
    .filter((m) => isExpired(m.membership_expiry))
    .map((m) => ({
      member_id: m.member_code,
      name: m.full_name,
      phone: m.phone,
      expiry: m.membership_expiry ?? "never assigned",
      days_overdue: m.membership_expiry ? Math.abs(daysLeft(m.membership_expiry) ?? 0) : "",
    }));

  const attendanceRows = attendance
    .filter((a) => inRange(a.check_in_date))
    .map((a) => ({
      date: a.check_in_date,
      time: fmtDateTime(a.check_in_at),
      member_id: memberById.get(a.member_id)?.member_code ?? "",
      name: memberById.get(a.member_id)?.full_name ?? "",
      phone: memberById.get(a.member_id)?.phone ?? "",
      method: a.method,
    }));

  const revenueRows = payments
    .filter((p) => inRange(p.paid_at))
    .map((p) => ({
      receipt_no: p.receipt_no,
      date: fmtDateTime(p.paid_at),
      member_id: memberById.get(p.member_id)?.member_code ?? "",
      name: memberById.get(p.member_id)?.full_name ?? "",
      phone: memberById.get(p.member_id)?.phone ?? "",
      plan: p.plan_name ?? "",
      method: p.payment_method,
      amount: Number(p.amount),
    }));

  const renewalRows = members
    .filter((m) => {
      const d = daysLeft(m.membership_expiry);
      return m.is_active && d !== null && d <= 10;
    })
    .map((m) => ({
      member_id: m.member_code,
      name: m.full_name,
      phone: m.phone,
      expiry: m.membership_expiry ?? "",
      days_left: daysLeft(m.membership_expiry) ?? "",
      status: memberStatus(m),
    }));

  const revenueTotal = revenueRows.reduce((s, r) => s + r.amount, 0);
  const byMethod = revenueRows.reduce<Record<string, number>>((acc, r) => {
    acc[r.method] = (acc[r.method] ?? 0) + r.amount;
    return acc;
  }, {});

  const exportRows = (name: string, rows: Record<string, unknown>[]) => {
    if (!downloadCsv(`${name}-${todayISO()}.csv`, rows)) toast({ title: "Nothing to export", variant: "destructive" });
  };

  const Table = ({ rows }: { rows: Record<string, unknown>[] }) => {
    if (!rows.length) return <p className="text-muted-foreground text-sm py-8 text-center">No records for this report.</p>;
    const headers = Object.keys(rows[0]);
    return (
      <div className="overflow-x-auto rounded-lg border border-primary/20">
        <table className="w-full text-sm">
          <thead className="bg-primary/10">
            <tr>
              {headers.map((h) => (
                <th key={h} className="text-left px-3 py-2 text-[11px] uppercase tracking-wider text-primary whitespace-nowrap">{h.replace(/_/g, " ")}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 200).map((r, i) => (
              <tr key={i} className="border-t border-primary/10">
                {headers.map((h) => (
                  <td key={h} className="px-3 py-2 text-muted-foreground whitespace-nowrap">{String(r[h] ?? "")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const Report = ({ name, rows, extra }: { name: string; rows: Record<string, unknown>[]; extra?: React.ReactNode }) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm text-muted-foreground">{rows.length} record{rows.length === 1 ? "" : "s"}</p>
        <Button size="sm" variant="outline" onClick={() => exportRows(name, rows)} className="border-primary/30 text-primary text-xs uppercase">
          <Download className="w-3 h-3 mr-1" /> Export CSV
        </Button>
      </div>
      {extra}
      <Table rows={rows} />
    </motion.div>
  );

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <Card className="bg-card/10 border-primary/20">
        <CardContent className="p-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">From</label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground" />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">To</label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">Date range applies to attendance and revenue reports.</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="active">
        <TabsList className="bg-card/10 border border-primary/20 flex-wrap h-auto">
          <TabsTrigger value="active" className="text-xs uppercase tracking-wider">Active</TabsTrigger>
          <TabsTrigger value="expired" className="text-xs uppercase tracking-wider">Expired</TabsTrigger>
          <TabsTrigger value="attendance" className="text-xs uppercase tracking-wider">Attendance</TabsTrigger>
          <TabsTrigger value="revenue" className="text-xs uppercase tracking-wider">Revenue</TabsTrigger>
          <TabsTrigger value="renewal" className="text-xs uppercase tracking-wider">Renewal Due</TabsTrigger>
        </TabsList>
        <div className="mt-4">
          <TabsContent value="active"><Report name="active-members" rows={activeRows} /></TabsContent>
          <TabsContent value="expired"><Report name="expired-members" rows={expiredRows} /></TabsContent>
          <TabsContent value="attendance"><Report name="attendance" rows={attendanceRows} /></TabsContent>
          <TabsContent value="revenue">
            <Report
              name="revenue"
              rows={revenueRows}
              extra={
                <Card className="bg-card/10 border-primary/20">
                  <CardContent className="p-4 flex flex-wrap gap-6">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Total</p>
                      <p className="font-display text-3xl text-sport-dark-foreground tracking-wider">{fmtINR(revenueTotal)}</p>
                    </div>
                    {Object.entries(byMethod).map(([m, v]) => (
                      <div key={m}>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{m}</p>
                        <p className="font-display text-3xl text-sport-dark-foreground tracking-wider">{fmtINR(v)}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              }
            />
          </TabsContent>
          <TabsContent value="renewal"><Report name="renewal-due" rows={renewalRows} /></TabsContent>
        </div>
      </Tabs>
      <p className="text-xs text-muted-foreground">Tables preview up to 200 rows; CSV exports include everything. Report generated {fmtDate(todayISO())}.</p>
    </div>
  );
};

export default ReportsTab;
