import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { FileDown, IndianRupee, Loader2, Printer, Receipt, Search, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { logAudit } from "@/lib/audit";
import { downloadReceiptPdf, shareReceiptPdf } from "@/lib/receiptPdf";
import {
  addDaysISO,
  fmtDate,
  fmtDateTime,
  fmtINR,
  PAYMENT_METHODS,
  todayISO,
  type Member,
  type MemberPayment,
  type MembershipPlan,
  type OrgSettings,
} from "@/lib/mgmt";

const PaymentsTab = () => {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [payments, setPayments] = useState<MemberPayment[]>([]);
  const [org, setOrg] = useState<OrgSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState<MemberPayment | null>(null);
  const [filter, setFilter] = useState("");

  const [memberId, setMemberId] = useState("");
  const [planId, setPlanId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string>("cash");
  const [notes, setNotes] = useState("");
  const [start, setStart] = useState(todayISO());

  const load = async () => {
    const [m, p, pay, o] = await Promise.all([
      supabase.from("members").select("*").order("full_name"),
      supabase.from("membership_plans").select("*").order("fee"),
      supabase.from("member_payments").select("*").order("paid_at", { ascending: false }).limit(300),
      supabase.from("org_settings").select("*").limit(1).maybeSingle(),
    ]);
    setMembers((m.data ?? []) as Member[]);
    setPlans((p.data ?? []) as MembershipPlan[]);
    setPayments((pay.data ?? []) as MemberPayment[]);
    setOrg((o.data ?? null) as OrgSettings | null);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const selectPlan = (id: string) => {
    setPlanId(id);
    const p = plans.find((x) => x.id === id);
    if (p) setAmount(String(p.fee));
  };

  const collect = async () => {
    const plan = plans.find((p) => p.id === planId);
    if (!memberId || !amount) {
      toast({ title: "Select a member and enter an amount", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const period_end = plan ? addDaysISO(start, plan.duration_days) : null;
      const { data, error } = await supabase
        .from("member_payments")
        .insert({
          member_id: memberId,
          plan_id: planId || null,
          plan_name: plan?.name ?? null,
          amount: Number(amount),
          payment_method: method,
          period_start: start,
          period_end,
          notes: notes.trim() || null,
        })
        .select()
        .single();
      if (error) throw error;

      if (plan) {
        await supabase
          .from("members")
          .update({ plan_id: plan.id, membership_start: start, membership_expiry: period_end, is_active: true })
          .eq("id", memberId);
      }

      await logAudit({
        action: "payment.create",
        entity: "payment",
        entity_id: (data as MemberPayment).id,
        entity_label: `${data.receipt_no} · ${memberById.get(memberId)?.full_name ?? "member"}`,
        details: { amount: Number(amount), method, plan: plan?.name ?? "none" },
      });

      toast({ title: "Payment recorded", description: `Receipt ${data.receipt_no}` });
      setOpen(false);
      setNotes("");
      setAmount("");
      setReceipt(data as MemberPayment);
      load();
    } catch (e) {
      toast({ title: "Payment failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const q = filter.trim().toLowerCase();
  const filtered = q
    ? payments.filter((p) => {
        const m = memberById.get(p.member_id);
        return [p.receipt_no, m?.full_name ?? "", m?.phone ?? ""].some((v) => v.toLowerCase().includes(q));
      })
    : payments;

  const total = filtered.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search receipt no., member name or phone" className="pl-9 bg-sport-dark/50 border-primary/30 text-sport-dark-foreground" />
        </div>
        <Button onClick={() => setOpen(true)} className="bg-sport-energy hover:bg-sport-energy/90 text-sport-energy-foreground uppercase tracking-wider text-xs">
          <IndianRupee className="w-4 h-4 mr-1" /> Collect Fee
        </Button>
      </div>

      <Card className="bg-card/10 border-primary/20">
        <CardContent className="p-4 flex flex-wrap gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Payments shown</p>
            <p className="font-display text-3xl text-sport-dark-foreground tracking-wider">{filtered.length}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Total collected</p>
            <p className="font-display text-3xl text-sport-dark-foreground tracking-wider">{fmtINR(total)}</p>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">No payments recorded yet.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((p, i) => {
            const m = memberById.get(p.member_id);
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.25) }}>
                <Card className="bg-card/10 border-primary/20">
                  <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-semibold text-sport-dark-foreground">{m?.full_name ?? "Unknown member"}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.receipt_no} · {fmtDateTime(p.paid_at)} {p.plan_name ? `· ${p.plan_name}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="uppercase text-[10px] border-primary/40 text-primary">{p.payment_method}</Badge>
                      <span className="font-display text-2xl text-sport-dark-foreground tracking-wider">{fmtINR(p.amount)}</span>
                      <Button size="sm" variant="outline" onClick={() => setReceipt(p)} className="h-7 text-[11px] border-primary/30 text-primary">
                        <Receipt className="w-3 h-3 mr-1" /> Receipt
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReceiptPdf(p, memberById.get(p.member_id), org)} className="h-7 text-[11px] border-primary/30 text-primary">
                        <FileDown className="w-3 h-3 mr-1" /> PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-sport-dark border-primary/30 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl tracking-wider text-sport-dark-foreground">Collect Membership Fee</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={memberId} onValueChange={setMemberId}>
              <SelectTrigger className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground"><SelectValue placeholder="Select member" /></SelectTrigger>
              <SelectContent className="bg-sport-dark border-primary/30 max-h-72">
                {members.map((m) => <SelectItem key={m.id} value={m.id}>{m.full_name} · {m.phone}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={planId} onValueChange={selectPlan}>
              <SelectTrigger className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground"><SelectValue placeholder="Select plan (renewal)" /></SelectTrigger>
              <SelectContent className="bg-sport-dark border-primary/30 max-h-72">
                {plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} · {fmtINR(p.fee)} / {p.duration_days}d</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Amount (₹)</label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground" />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Start date</label>
                <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground" />
              </div>
            </div>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-sport-dark border-primary/30">
                {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m.toUpperCase()}</SelectItem>)}
              </SelectContent>
            </Select>
            <Textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground" />
            <Button onClick={collect} disabled={saving} className="w-full bg-sport-energy hover:bg-sport-energy/90 text-sport-energy-foreground uppercase tracking-wider text-xs h-11">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Record payment & generate receipt"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!receipt} onOpenChange={(o) => !o && setReceipt(null)}>
        <DialogContent className="bg-sport-dark border-primary/30 max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl tracking-wider text-sport-dark-foreground">Receipt</DialogTitle>
          </DialogHeader>
          {receipt && (
            <div id="receipt-print" className="bg-background text-foreground rounded-lg p-4 space-y-2 text-sm">
              <div className="text-center border-b border-border pb-2">
                <p className="font-display text-xl tracking-wider">{org?.org_name ?? "Friends Sports Academy"}</p>
                {org?.address && <p className="text-[11px] text-muted-foreground">{org.address}</p>}
                {org?.phone && <p className="text-[11px] text-muted-foreground">{org.phone}</p>}
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">Receipt no.</span><span className="font-mono">{receipt.receipt_no}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{fmtDateTime(receipt.paid_at)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Member</span><span>{memberById.get(receipt.member_id)?.full_name ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Member ID</span><span className="font-mono">{memberById.get(receipt.member_id)?.member_code ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span>{receipt.plan_name ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Valid</span><span>{fmtDate(receipt.period_start)} – {fmtDate(receipt.period_end)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Method</span><span className="uppercase">{receipt.payment_method}</span></div>
              <div className="flex justify-between border-t border-border pt-2 font-semibold"><span>Amount paid</span><span>{fmtINR(receipt.amount)}</span></div>
              {org?.receipt_footer && <p className="text-[11px] text-center text-muted-foreground pt-2">{org.receipt_footer}</p>}
            </div>
          )}
          <Button variant="outline" onClick={() => window.print()} className="border-primary/30 text-primary text-xs uppercase">
            <Printer className="w-3 h-3 mr-1" /> Print receipt
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentsTab;
