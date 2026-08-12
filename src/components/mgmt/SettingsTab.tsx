import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { logAudit } from "@/lib/audit";
import type { OrgSettings } from "@/lib/mgmt";

const SettingsTab = ({ isAdmin }: { isAdmin: boolean }) => {
  const { toast } = useToast();
  const [org, setOrg] = useState<OrgSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("org_settings").select("*").limit(1).maybeSingle().then(({ data }) => setOrg((data ?? null) as OrgSettings | null));
  }, []);

  const save = async () => {
    if (!org) return;
    setSaving(true);
    const { error } = await supabase
      .from("org_settings")
      .update({
        org_name: org.org_name,
        pool_info: org.pool_info,
        address: org.address,
        phone: org.phone,
        email: org.email,
        receipt_footer: org.receipt_footer,
      })
      .eq("id", org.id);
    setSaving(false);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else toast({ title: "Organization settings saved" });
  };

  if (!org) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const field = (label: string, key: keyof OrgSettings, multiline = false) => (
    <div>
      <label className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</label>
      {multiline ? (
        <Textarea
          value={(org[key] as string) ?? ""}
          disabled={!isAdmin}
          onChange={(e) => setOrg({ ...org, [key]: e.target.value })}
          className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground"
        />
      ) : (
        <Input
          value={(org[key] as string) ?? ""}
          disabled={!isAdmin}
          onChange={(e) => setOrg({ ...org, [key]: e.target.value })}
          className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground"
        />
      )}
    </div>
  );

  return (
    <Card className="bg-card/10 border-primary/20 max-w-2xl">
      <CardContent className="p-5 space-y-3">
        {field("Organization name", "org_name")}
        {field("Swimming pool information", "pool_info", true)}
        {field("Address", "address", true)}
        <div className="grid sm:grid-cols-2 gap-3">
          {field("Phone", "phone")}
          {field("Email", "email")}
        </div>
        {field("Receipt footer (optional)", "receipt_footer", true)}
        {isAdmin ? (
          <Button onClick={save} disabled={saving} className="bg-sport-energy hover:bg-sport-energy/90 text-sport-energy-foreground uppercase tracking-wider text-xs">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" /> Save settings</>}
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">Only administrators can edit organization settings.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default SettingsTab;
