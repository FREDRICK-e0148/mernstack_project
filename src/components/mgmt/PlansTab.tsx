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
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { logAudit } from "@/lib/audit";
import { fmtINR, type MembershipPlan } from "@/lib/mgmt";

const CATEGORIES = ["membership", "coaching", "weekend", "gym", "shuttle", "aqua-zumba"];

const emptyForm = { name: "", description: "", category: "membership", duration_days: "30", fee: "0", is_active: true };

const PlansTab = ({ isAdmin }: { isAdmin: boolean }) => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MembershipPlan | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("membership_plans").select("*").order("category").order("fee");
    setPlans((data ?? []) as MembershipPlan[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setOpen(true);
  };

  const openEdit = (p: MembershipPlan) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description ?? "",
      category: p.category,
      duration_days: String(p.duration_days),
      fee: String(p.fee),
      is_active: p.is_active,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast({ title: "Plan name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category,
      duration_days: Number(form.duration_days) || 30,
      fee: Number(form.fee) || 0,
      is_active: form.is_active,
    };
    const { error } = editing
      ? await supabase.from("membership_plans").update(payload).eq("id", editing.id)
      : await supabase.from("membership_plans").insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editing ? "Plan updated" : "Plan created" });
    setOpen(false);
    load();
  };

  const remove = async (p: MembershipPlan) => {
    const { error } = await supabase.from("membership_plans").delete().eq("id", p.id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else load();
  };

  return (
    <div className="space-y-4">
      {isAdmin && (
        <Button onClick={openNew} className="bg-sport-energy hover:bg-sport-energy/90 text-sport-energy-foreground uppercase tracking-wider text-xs">
          <Plus className="w-4 h-4 mr-1" /> Create Plan
        </Button>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : plans.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">No plans yet. Create your first membership plan.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}>
              <Card className="bg-card/10 border-primary/20 backdrop-blur-sm h-full">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sport-dark-foreground">{p.name}</p>
                    <Badge variant="outline" className="text-[10px] uppercase border-primary/40 text-primary">{p.category}</Badge>
                  </div>
                  <p className="font-display text-3xl text-sport-dark-foreground tracking-wider">{fmtINR(p.fee)}</p>
                  <p className="text-xs text-muted-foreground">{p.duration_days} days{p.is_active ? "" : " · inactive"}</p>
                  {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                  {isAdmin && (
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={() => openEdit(p)} className="h-7 text-[11px] border-primary/30 text-primary">
                        <Pencil className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => remove(p)} className="h-7 text-[11px] border-destructive/40 text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-sport-dark border-primary/30 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl tracking-wider text-sport-dark-foreground">
              {editing ? "Edit Plan" : "Create Plan"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Plan name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground" />
            <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground" />
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-sport-dark border-primary/30">
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Duration (days)</label>
                <Input type="number" min="1" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground" />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Fee (₹)</label>
                <Input type="number" min="0" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              Active (visible for assignment)
            </label>
            <Button onClick={save} disabled={saving} className="w-full bg-sport-energy hover:bg-sport-energy/90 text-sport-energy-foreground uppercase tracking-wider text-xs h-11">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save plan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlansTab;
