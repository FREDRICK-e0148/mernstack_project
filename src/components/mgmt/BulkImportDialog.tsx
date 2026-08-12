import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle2, Download, Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { logAudit } from "@/lib/audit";
import { genMemberCode, type Member } from "@/lib/mgmt";

const FIELDS = [
  "full_name",
  "phone",
  "email",
  "dob",
  "gender",
  "address",
  "emergency_contact_name",
  "emergency_contact_phone",
  "emergency_contact_relation",
  "notes",
] as const;

type Row = Record<string, string>;
type Parsed = { row: Row; line: number; errors: string[] };

/** Minimal RFC4180-ish CSV parser (handles quotes, commas and newlines inside quotes) */
export const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let quoted = false;
  const src = text.replace(/\r\n?/g, "\n");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
};

const TEMPLATE = `${FIELDS.join(",")}\nRahul Kumar,9876543210,rahul@example.com,2005-04-12,male,"12 Pool Street, Chennai",Anita Kumar,9876500000,Mother,Beginner batch`;

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const normPhone = (v: string) => v.replace(/[^\d]/g, "");

const BulkImportDialog = ({ open, onOpenChange, onImported }: { open: boolean; onOpenChange: (o: boolean) => void; onImported: () => void }) => {
  const { toast } = useToast();
  const [parsed, setParsed] = useState<Parsed[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ inserted: number; skipped: number } | null>(null);

  const reset = () => {
    setParsed(null);
    setFileName("");
    setDone(null);
  };

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([TEMPLATE], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "member-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (file: File) => {
    setBusy(true);
    setDone(null);
    try {
      const rows = parseCsv(await file.text());
      if (rows.length < 2) {
        toast({ title: "CSV is empty", description: "Add at least one member row below the header.", variant: "destructive" });
        setParsed(null);
        return;
      }
      const headers = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
      const missingCols = ["full_name", "phone"].filter((c) => !headers.includes(c));
      if (missingCols.length) {
        toast({ title: "Missing columns", description: `CSV needs: ${missingCols.join(", ")}`, variant: "destructive" });
        setParsed(null);
        return;
      }

      const { data: existing } = await supabase.from("members").select("phone");
      const existingPhones = new Set(((existing ?? []) as Pick<Member, "phone">[]).map((m) => normPhone(m.phone)));
      const seen = new Set<string>();

      const out: Parsed[] = rows.slice(1).map((cells, idx) => {
        const row: Row = {};
        headers.forEach((h, i) => {
          if ((FIELDS as readonly string[]).includes(h)) row[h] = (cells[i] ?? "").trim();
        });
        const errors: string[] = [];
        if (!row.full_name) errors.push("Name is missing");
        const phone = normPhone(row.phone ?? "");
        if (!phone) errors.push("Phone is missing");
        else if (phone.length < 10) errors.push("Phone looks invalid");
        else if (existingPhones.has(phone)) errors.push("Phone already registered");
        else if (seen.has(phone)) errors.push("Duplicate phone in file");
        if (row.email && !isEmail(row.email)) errors.push("Invalid email");
        if (row.dob && !isDate(row.dob)) errors.push("DOB must be YYYY-MM-DD");
        if (row.gender && !["male", "female", "other"].includes(row.gender.toLowerCase())) errors.push("Gender must be male/female/other");
        if (!errors.length) seen.add(phone);
        return { row: { ...row, phone: row.phone?.trim() ?? "" }, line: idx + 2, errors };
      });

      setParsed(out);
      setFileName(file.name);
    } catch (e) {
      toast({ title: "Could not read file", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const valid = (parsed ?? []).filter((p) => !p.errors.length);
  const invalid = (parsed ?? []).filter((p) => p.errors.length);

  const importRows = async () => {
    if (!valid.length) return;
    setBusy(true);
    try {
      const payload = valid.map((p) => ({
        member_code: genMemberCode(),
        full_name: p.row.full_name,
        phone: p.row.phone,
        email: p.row.email || null,
        dob: p.row.dob || null,
        gender: p.row.gender ? p.row.gender.toLowerCase() : null,
        address: p.row.address || null,
        emergency_contact_name: p.row.emergency_contact_name || null,
        emergency_contact_phone: p.row.emergency_contact_phone || null,
        emergency_contact_relation: p.row.emergency_contact_relation || null,
        notes: p.row.notes || null,
      }));
      const { error } = await supabase.from("members").insert(payload as never);
      if (error) throw error;
      await logAudit({
        action: "member.import",
        entity: "import",
        entity_label: fileName,
        details: { imported: payload.length, skipped: invalid.length },
      });
      setDone({ inserted: payload.length, skipped: invalid.length });
      setParsed(null);
      toast({ title: `${payload.length} members imported` });
      onImported();
    } catch (e) {
      toast({ title: "Import failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="bg-sport-dark border-primary/30 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-wider text-sport-dark-foreground">Bulk Member Import</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Upload a CSV with the columns <span className="font-mono text-primary">full_name, phone</span> (required) plus any of email, dob,
            gender, address, emergency_contact_name, emergency_contact_phone, emergency_contact_relation, notes.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground"
            />
            <Button variant="outline" onClick={downloadTemplate} className="border-primary/30 text-primary text-xs uppercase shrink-0">
              <Download className="w-3 h-3 mr-1" /> Template
            </Button>
          </div>

          {busy && <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>}

          {done && (
            <Card className="bg-primary/10 border-primary/40">
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <p className="text-sm text-sport-dark-foreground">
                  Imported {done.inserted} member{done.inserted === 1 ? "" : "s"}
                  {done.skipped ? ` · ${done.skipped} row(s) skipped due to validation errors` : ""}.
                </p>
              </CardContent>
            </Card>
          )}

          {parsed && (
            <>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="border-primary/40 text-primary text-[10px] uppercase">{valid.length} ready</Badge>
                <Badge variant="outline" className="border-destructive/40 text-destructive text-[10px] uppercase">{invalid.length} with issues</Badge>
                <span className="text-xs text-muted-foreground self-center">{fileName}</span>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2">
                {parsed.map((p) => (
                  <Card key={p.line} className={p.errors.length ? "bg-destructive/10 border-destructive/30" : "bg-card/10 border-primary/20"}>
                    <CardContent className="p-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm text-sport-dark-foreground truncate">
                          <span className="text-muted-foreground font-mono text-xs mr-2">#{p.line}</span>
                          {p.row.full_name || "(no name)"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {p.row.phone || "no phone"}{p.row.email ? ` · ${p.row.email}` : ""}
                        </p>
                        {p.errors.length > 0 && (
                          <p className="text-xs text-destructive mt-1 flex items-start gap-1">
                            <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" /> {p.errors.join(" · ")}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button
                onClick={importRows}
                disabled={busy || !valid.length}
                className="w-full bg-sport-energy hover:bg-sport-energy/90 text-sport-energy-foreground uppercase tracking-wider text-xs h-11"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4 mr-1" /> Import {valid.length} member{valid.length === 1 ? "" : "s"}</>}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkImportDialog;
