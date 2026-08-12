import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Search, UserPlus, Loader2, QrCode, Pencil, Trash2, Power, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode";
import BulkImportDialog from "@/components/mgmt/BulkImportDialog";
import { logAudit } from "@/lib/audit";
import {
  addDaysISO,
  fmtDate,
  fmtINR,
  genMemberCode,
  memberStatus,
  todayISO,
  type Member,
  type MembershipPlan,
} from "@/lib/mgmt";

const emptyForm = {
  full_name: "",
  phone: "",
  email: "",
  dob: "",
  gender: "",
  address: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  emergency_contact_relation: "",
  plan_id: "",
  membership_start: todayISO(),
  notes: "",
};

const statusStyles: Record<string, string> = {
  active: "bg-primary/20 text-primary border-primary/40",
  expired: "bg-destructive/20 text-destructive border-destructive/40",
  inactive: "bg-muted text-muted-foreground border-border",
};

const MembersTab = ({ isAdmin }: { isAdmin: boolean }) => {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [qrMember, setQrMember] = useState<Member | null>(null);
  const [qrUrl, setQrUrl] = useState("");
  const [importOpen, setImportOpen] = useState(false);

  const load = async () => {
    const [m, p] = await Promise.all([
      supabase.from("members").select("*").order("created_at", { ascending: false }),
      supabase.from("membership_plans").select("*").order("fee"),
    ]);
    setMembers((m.data ?? []) as Member[]);
    setPlans((p.data ?? []) as MembershipPlan[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!qrMember) return;
    QRCode.toDataURL(qrMember.member_code, { width: 320, margin: 1 }).then(setQrUrl);
  }, [qrMember]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setPhoto(null);
    setOpen(true);
  };

  const openEdit = (m: Member) => {
    setEditing(m);
    setForm({
      full_name: m.full_name,
      phone: m.phone,
      email: m.email ?? "",
      dob: m.dob ?? "",
      gender: m.gender ?? "",
      address: m.address ?? "",
      emergency_contact_name: m.emergency_contact_name ?? "",
      emergency_contact_phone: m.emergency_contact_phone ?? "",
      emergency_contact_relation: m.emergency_contact_relation ?? "",
      plan_id: m.plan_id ?? "",
      membership_start: m.membership_start ?? todayISO(),
      notes: m.notes ?? "",
    });
    setPhoto(null);
    setOpen(true);
  };

  const save = async () => {
    if (!form.full_name.trim() || !form.phone.trim()) {
      toast({ title: "Name and phone are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let photo_url: string | undefined;
      if (photo) {
        const path = `members/${Date.now()}-${photo.name.replace(/[^\w.-]/g, "")}`;
        const { error } = await supabase.storage.from("candidate-photos").upload(path, photo);
        if (error) throw error;
        photo_url = supabase.storage.from("candidate-photos").getPublicUrl(path).data.publicUrl;
      }

      const plan = plans.find((p) => p.id === form.plan_id);
      const start = form.membership_start || todayISO();
      const payload: Record<string, unknown> = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        dob: form.dob || null,
        gender: form.gender || null,
        address: form.address.trim() || null,
        emergency_contact_name: form.emergency_contact_name.trim() || null,
        emergency_contact_phone: form.emergency_contact_phone.trim() || null,
        emergency_contact_relation: form.emergency_contact_relation.trim() || null,
        plan_id: form.plan_id || null,
        membership_start: form.plan_id ? start : null,
        membership_expiry: plan ? addDaysISO(start, plan.duration_days) : null,
        notes: form.notes.trim() || null,
      };
      if (photo_url) payload.photo_url = photo_url;

      if (editing) {
        const { error } = await supabase.from("members").update(payload as never).eq("id", editing.id);
        if (error) throw error;
        await logAudit({
          action: "member.update",
          entity: "member",
          entity_id: editing.id,
          entity_label: `${form.full_name.trim()} (${editing.member_code})`,
          details: { phone: form.phone.trim(), plan: plan?.name ?? "none" },
        });
        toast({ title: "Member updated" });
      } else {
        const member_code = genMemberCode();
        const { data, error } = await supabase
          .from("members")
          .insert({ ...payload, member_code } as never)
          .select()
          .single();
        if (error) throw error;
        await logAudit({
          action: "member.create",
          entity: "member",
          entity_id: (data as Member | null)?.id ?? null,
          entity_label: `${form.full_name.trim()} (${member_code})`,
          details: { phone: form.phone.trim(), plan: plan?.name ?? "none" },
        });
        toast({ title: "Member registered" });
      }
      setOpen(false);
      load();
    } catch (e) {
      toast({ title: "Save failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (m: Member) => {
    await supabase.from("members").update({ is_active: !m.is_active }).eq("id", m.id);
    await logAudit({
      action: m.is_active ? "member.deactivate" : "member.activate",
      entity: "member",
      entity_id: m.id,
      entity_label: `${m.full_name} (${m.member_code})`,
    });
    load();
  };

  const remove = async (m: Member) => {
    const { error } = await supabase.from("members").delete().eq("id", m.id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    await logAudit({
      action: "member.delete",
      entity: "member",
      entity_id: m.id,
      entity_label: `${m.full_name} (${m.member_code})`,
      details: { phone: m.phone },
    });
    load();
  };

  const q = query.trim().toLowerCase();
  const filtered = q
    ? members.filter((m) =>
        [m.full_name, m.phone, m.member_code, m.email ?? ""].some((v) => v.toLowerCase().includes(q)),
      )
    : members;

  const planName = (id: string | null) => plans.find((p) => p.id === id)?.name ?? "No plan";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, phone, member ID or email"
            className="pl-9 bg-sport-dark/50 border-primary/30 text-sport-dark-foreground"
          />
        </div>
        <Button variant="outline" onClick={() => setImportOpen(true)} className="border-primary/30 text-primary uppercase tracking-wider text-xs">
          <Upload className="w-4 h-4 mr-1" /> Import CSV
        </Button>
        <Button onClick={openNew} className="bg-sport-energy hover:bg-sport-energy/90 text-sport-energy-foreground uppercase tracking-wider text-xs">
          <UserPlus className="w-4 h-4 mr-1" /> Register Member
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">No members found.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((m, i) => {
            const status = memberStatus(m);
            return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}>
                <Card className="bg-card/10 border-primary/20 backdrop-blur-sm">
                  <CardContent className="p-4 flex gap-3">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-primary/15 shrink-0 flex items-center justify-center">
                      {m.photo_url ? (
                        <img src={m.photo_url} alt={`${m.full_name} photo`} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <span className="font-display text-xl text-primary">{m.full_name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sport-dark-foreground truncate">{m.full_name}</p>
                        <Badge variant="outline" className={`text-[10px] uppercase ${statusStyles[status]}`}>{status}</Badge>
                      </div>
                      <p className="text-xs text-primary font-mono">{m.member_code}</p>
                      <p className="text-xs text-muted-foreground">{m.phone}{m.email ? ` · ${m.email}` : ""}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {planName(m.plan_id)} · valid till {fmtDate(m.membership_expiry)}
                      </p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => openEdit(m)} className="h-7 text-[11px] border-primary/30 text-primary">
                          <Pencil className="w-3 h-3 mr-1" /> Edit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setQrMember(m)} className="h-7 text-[11px] border-primary/30 text-primary">
                          <QrCode className="w-3 h-3 mr-1" /> QR
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => toggleActive(m)} className="h-7 text-[11px] border-primary/30 text-muted-foreground">
                          <Power className="w-3 h-3 mr-1" /> {m.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        {isAdmin && (
                          <Button size="sm" variant="outline" onClick={() => remove(m)} className="h-7 text-[11px] border-destructive/40 text-destructive">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-sport-dark border-primary/30 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl tracking-wider text-sport-dark-foreground">
              {editing ? "Edit Member" : "Register Member"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Full name *" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground" />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Phone *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground" />
              <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Date of birth</label>
                <Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground" />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Gender</label>
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                  <SelectTrigger className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="bg-sport-dark border-primary/30">
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Textarea placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground" />
            <div className="grid grid-cols-3 gap-3">
              <Input placeholder="Emergency name" value={form.emergency_contact_name} onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })} className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground" />
              <Input placeholder="Emergency phone" value={form.emergency_contact_phone} onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })} className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground" />
              <Input placeholder="Relation" value={form.emergency_contact_relation} onChange={(e) => setForm({ ...form, emergency_contact_relation: e.target.value })} className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Membership plan</label>
                <Select value={form.plan_id} onValueChange={(v) => setForm({ ...form, plan_id: v })}>
                  <SelectTrigger className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground"><SelectValue placeholder="Assign plan" /></SelectTrigger>
                  <SelectContent className="bg-sport-dark border-primary/30">
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name} · {fmtINR(p.fee)} / {p.duration_days}d</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Start date</label>
                <Input type="date" value={form.membership_start} onChange={(e) => setForm({ ...form, membership_start: e.target.value })} className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground" />
              </div>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Photograph</label>
              <Input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground" />
            </div>
            <Textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground" />
            <Button onClick={save} disabled={saving} className="w-full bg-sport-energy hover:bg-sport-energy/90 text-sport-energy-foreground uppercase tracking-wider text-xs h-11">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? "Save changes" : "Register member"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!qrMember} onOpenChange={(o) => !o && setQrMember(null)}>
        <DialogContent className="bg-sport-dark border-primary/30 max-w-xs">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl tracking-wider text-sport-dark-foreground">Member QR</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-2">
            {qrUrl && <img src={qrUrl} alt="Member check-in QR code" className="mx-auto rounded-lg bg-white p-2" />}
            <p className="font-mono text-primary">{qrMember?.member_code}</p>
            <p className="text-sm text-muted-foreground">{qrMember?.full_name}</p>
            <Button variant="outline" onClick={() => window.print()} className="border-primary/30 text-primary w-full text-xs uppercase">Print</Button>
          </div>
        </DialogContent>
      </Dialog>

      <BulkImportDialog open={importOpen} onOpenChange={setImportOpen} onImported={load} />
    </div>
  );
};

export default MembersTab;
