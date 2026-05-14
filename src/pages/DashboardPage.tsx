import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { buildDietPlan, planDurationDays, type DietType } from "@/lib/diet";
import { isClassPlanCategory, countClassDays } from "@/lib/plans";
import {
  Loader2, LogOut, Waves, Users, CalendarCheck, CreditCard, ArrowRight,
  UserPlus, Trophy, CheckCircle2, Clock, Mail, Phone, Hash, ShieldCheck,
  Apple, Drumstick, Leaf, Droplet, Flame, Activity, Bell, Settings,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Candidate {
  id: string;
  name: string;
  dob: string;
  contact_no: string;
  email: string;
  photo_url: string | null;
  height: string | null;
  weight: string | null;
}

interface Enrollment {
  id: string;
  created_at: string;
  enrollment_candidates: Candidate[];
}

interface PaidPlan {
  id?: string;
  plan: { id: string; name: string; category: string; duration: string; price: number };
  method: string;
  paidAt: string;
  updatedAt?: string;
  durationDays?: number;
  expiresAt?: string;
  status?: "active" | "cancelled" | "refunded";
  cancellationReason?: string | null;
}

const ageFromDob = (dob: string) => {
  if (!dob) return 0;
  const d = new Date(dob);
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000)));
};

const DashboardPage = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [paidPlan, setPaidPlan] = useState<PaidPlan | null>(null);
  const [dietType, setDietType] = useState<DietType | null>(
    () => (localStorage.getItem("dietType") as DietType | null) || null
  );
  const [activeSwimmerId, setActiveSwimmerId] = useState<string | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  // Reminder preferences
  type ReminderPrefs = { enabled: boolean; threeDay: boolean; oneDay: boolean; expiry: boolean };
  const defaultPrefs: ReminderPrefs = { enabled: true, threeDay: true, oneDay: true, expiry: true };
  const [reminderPrefs, setReminderPrefs] = useState<ReminderPrefs>(() => {
    try {
      const raw = localStorage.getItem("reminderPrefs");
      if (raw) return { ...defaultPrefs, ...JSON.parse(raw) };
    } catch {}
    return defaultPrefs;
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  useEffect(() => {
    try { localStorage.setItem("reminderPrefs", JSON.stringify(reminderPrefs)); } catch {}
  }, [reminderPrefs]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  // Live tick every second so remaining time updates in real-time
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [enrollRes, paidRes] = await Promise.all([
        supabase
          .from("enrollments")
          .select("id, created_at, enrollment_candidates(id, name, dob, contact_no, email, photo_url, height, weight)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("paid_plans")
          .select("*")
          .eq("user_id", user.id)
          .order("paid_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (!enrollRes.error && enrollRes.data) setEnrollments(enrollRes.data as any);

      const sp = sessionStorage.getItem("selectedPlan");
      if (sp) { try { setSelectedPlan(JSON.parse(sp)); } catch {} }

      if (!paidRes.error && paidRes.data) {
        const row: any = paidRes.data;
        const synced: PaidPlan = {
          id: row.id,
          plan: {
            id: row.plan_id,
            name: row.plan_name,
            category: row.plan_category,
            duration: row.plan_duration,
            price: Number(row.plan_price),
          },
          method: row.payment_method,
          paidAt: row.paid_at,
          updatedAt: row.updated_at,
          durationDays: row.duration_days,
          expiresAt: row.expires_at,
          status: row.status ?? "active",
          cancellationReason: row.cancellation_reason ?? null,
        };
        setPaidPlan(synced);
        try { localStorage.setItem("paidPlan", JSON.stringify(synced)); } catch {}
      } else {
        const pp = localStorage.getItem("paidPlan");
        if (pp) { try { setPaidPlan(JSON.parse(pp)); } catch {} }
      }
      setLoading(false);
    })();

    // Realtime: react instantly when admin cancels/refunds the plan
    const channel = supabase
      .channel(`paid_plans_user_${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "paid_plans", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row: any = payload.new ?? payload.old;
          if (!row) return;
          if (payload.eventType === "DELETE") {
            setPaidPlan(null);
            try { localStorage.removeItem("paidPlan"); } catch {}
            return;
          }
          const synced: PaidPlan = {
            id: row.id,
            plan: {
              id: row.plan_id,
              name: row.plan_name,
              category: row.plan_category,
              duration: row.plan_duration,
              price: Number(row.plan_price),
            },
            method: row.payment_method,
            paidAt: row.paid_at,
            updatedAt: row.updated_at,
            durationDays: row.duration_days,
            expiresAt: row.expires_at,
            status: row.status ?? "active",
            cancellationReason: row.cancellation_reason ?? null,
          };
          setPaidPlan(synced);
          try { localStorage.setItem("paidPlan", JSON.stringify(synced)); } catch {}
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const allSwimmers = useMemo(
    () => enrollments.flatMap((e) => e.enrollment_candidates || []),
    [enrollments]
  );

  useEffect(() => {
    if (!activeSwimmerId && allSwimmers.length) setActiveSwimmerId(allSwimmers[0].id);
  }, [allSwimmers, activeSwimmerId]);

  const activeSwimmer = allSwimmers.find((s) => s.id === activeSwimmerId) || null;

  // Member ID — short, deterministic from user id
  const memberId = useMemo(() => {
    if (!user?.id) return "—";
    const hex = user.id.replace(/-/g, "").slice(0, 6).toUpperCase();
    return `FSA-${hex}`;
  }, [user?.id]);

  // Plan validity — recomputed every second via `now` for live countdown
  const validity = useMemo(() => {
    if (!paidPlan) return null;
    const start = new Date(paidPlan.paidAt);
    const days = paidPlan.durationDays ?? planDurationDays(paidPlan.plan.duration);
    const end = paidPlan.expiresAt ? new Date(paidPlan.expiresAt) : new Date(start.getTime() + days * 86400000);
    const totalMs = Math.max(1, end.getTime() - start.getTime());
    const isCancelled = paidPlan.status === "cancelled" || paidPlan.status === "refunded";
    const remainingMs = isCancelled ? 0 : Math.max(0, end.getTime() - now);
    const elapsedMs = Math.min(totalMs, Math.max(0, now - start.getTime()));
    const remainingDays = Math.floor(remainingMs / 86400000);
    const remainingHours = Math.floor((remainingMs % 86400000) / 3600000);
    const remainingMinutes = Math.floor((remainingMs % 3600000) / 60000);
    const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);
    const progressPct = isCancelled ? 100 : Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
    const expired = remainingMs <= 0;
    return { start, end, days, remainingDays, remainingHours, remainingMinutes, remainingSeconds, remainingMs, progressPct, expired, isCancelled, status: paidPlan.status ?? "active" };
  }, [paidPlan, now]);

  // Class count (Mondays are weekly holidays). Only for coaching / membership plans.
  const classStats = useMemo(() => {
    if (!paidPlan || !validity) return null;
    if (!isClassPlanCategory(paidPlan.plan.category)) return null;
    const today = new Date(now);
    const cappedToday = today < validity.end ? today : validity.end;
    const total = countClassDays(validity.start, validity.end);
    const completed = validity.isCancelled
      ? 0
      : countClassDays(validity.start, cappedToday);
    const remaining = Math.max(0, total - completed);
    return { total, completed, remaining };
  }, [paidPlan, validity, now]);

  // Expiry reminder notifications: 3 days, 1 day, and on expiry.
  // Keyed on the paid_plans row id + updated_at so any admin change
  // (cancel/refund/extend) invalidates prior reminders and avoids stale fires.
  const notifiedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!reminderPrefs.enabled) return;
    if (!paidPlan || !validity || validity.isCancelled) return;
    const planKey = paidPlan.id ?? paidPlan.plan.id;
    const version = paidPlan.updatedAt ?? paidPlan.paidAt;
    const key = `expiryNotified:${planKey}:${version}`;
    try {
      const prefix = `expiryNotified:${planKey}:`;
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix) && k !== key) localStorage.removeItem(k);
      }
    } catch {}
    let fired: string[] = [];
    try { fired = JSON.parse(localStorage.getItem(key) || "[]"); } catch {}
    const fire = (id: string, fn: () => void) => {
      if (fired.includes(id) || notifiedRef.current.has(`${key}:${id}`)) return;
      notifiedRef.current.add(`${key}:${id}`);
      fired.push(id);
      try { localStorage.setItem(key, JSON.stringify(fired)); } catch {}
      fn();
    };
    const ms = validity.remainingMs;
    const dayMs = 86400000;
    if (ms <= 0 && reminderPrefs.expiry) {
      fire("expired", () => toast.error("Your swim plan has expired", {
        description: "Renew now to continue your training.",
        duration: 8000,
      }));
    } else if (ms <= dayMs && reminderPrefs.oneDay) {
      fire("1d", () => toast.warning("Your plan expires in less than 1 day", {
        description: `${paidPlan.plan.name} ends ${validity.end.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}.`,
        duration: 8000,
      }));
    } else if (ms <= 3 * dayMs && reminderPrefs.threeDay) {
      fire("3d", () => toast("Your plan expires in 3 days", {
        description: `${paidPlan.plan.name} ends ${validity.end.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}.`,
        duration: 8000,
      }));
    }
  }, [paidPlan, validity, reminderPrefs]);

  const totalSwimmers = allSwimmers.length;
  const latest = enrollments[0];

  const dietPlan = useMemo(() => {
    if (!activeSwimmer || !dietType) return null;
    return buildDietPlan(
      activeSwimmer.height,
      activeSwimmer.weight,
      dietType,
      ageFromDob(activeSwimmer.dob)
    );
  }, [activeSwimmer, dietType]);

  const pieData = useMemo(() => {
    if (validity) {
      return [
        { name: "Days Used", value: Math.round(validity.progressPct) },
        { name: "Days Left", value: Math.round(100 - validity.progressPct) },
      ];
    }
    // Fallback: enrollment progress (steps completed)
    const steps = [
      enrollments.length > 0,
      !!selectedPlan,
      !!paidPlan,
    ];
    const done = steps.filter(Boolean).length;
    return [
      { name: "Completed", value: Math.round((done / steps.length) * 100) },
      { name: "Pending", value: Math.round(((steps.length - done) / steps.length) * 100) },
    ];
  }, [validity, enrollments.length, selectedPlan, paidPlan]);

  const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--muted))"];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center bg-sport-dark">
        <Loader2 className="w-8 h-8 text-primary animate-spin relative z-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative px-4 py-8 overflow-hidden bg-sport-dark">
      <div className="absolute inset-0 diagonal-stripe opacity-30 pointer-events-none" />
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-primary via-accent to-secondary pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
              <Waves className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl text-sport-dark-foreground tracking-wider leading-none">MY DASHBOARD</h1>
              <p className="text-primary text-[10px] uppercase tracking-[0.3em] font-semibold mt-1">
                Friends Aquatic Academy
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSettingsOpen(true)}
              className="border-primary/40 bg-sport-dark/40 backdrop-blur text-primary hover:bg-primary/20 hover:text-sport-dark-foreground uppercase tracking-wider text-xs"
            >
              <Settings className="w-3 h-3 mr-1" /> Settings
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => { await signOut(); navigate("/login"); }}
              className="border-primary/40 bg-sport-dark/40 backdrop-blur text-primary hover:bg-primary/20 hover:text-sport-dark-foreground uppercase tracking-wider text-xs"
            >
              <LogOut className="w-3 h-3 mr-1" /> Sign out
            </Button>
          </div>
        </div>

        {/* Welcome + Member ID */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="font-display text-4xl md:text-5xl text-gradient-sport tracking-wider">
              WELCOME BACK, CHAMP!
            </h2>
            <p className="text-muted-foreground mt-2">
              {enrollments.length === 0
                ? "Ready to dive in? Start by enrolling your swimmers."
                : "Track your plan, progress and personalized diet."}
            </p>
          </div>
          <Card className="bg-card/5 backdrop-blur-xl border-primary/40 shadow-lg shadow-primary/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Hash className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-primary/80 text-[10px] uppercase tracking-[0.3em] font-semibold">Member ID</p>
                <p className="font-display text-2xl text-sport-dark-foreground tracking-[0.15em]">{memberId}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Users} label="Swimmers" value={String(totalSwimmers)} />
          <StatCard icon={CalendarCheck} label="Enrollments" value={String(enrollments.length)} />
          <StatCard icon={Trophy} label="Plan" value={paidPlan?.plan.name || selectedPlan?.name || "Not Chosen"} />
          <StatCard
            icon={ShieldCheck}
            label="Status"
            value={
              !paidPlan ? "Pending" :
              validity?.status === "refunded" ? "Refunded" :
              validity?.status === "cancelled" ? "Cancelled" :
              validity && !validity.expired ? "Active" : "Expired"
            }
          />
        </div>

        {/* Plan validity + Progress pie */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Card className="bg-card/5 backdrop-blur-xl border-primary/30 lg:col-span-2">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-primary text-[10px] uppercase tracking-[0.3em] font-semibold">Plan Validity</p>
                  <h3 className="font-display text-2xl text-sport-dark-foreground tracking-wider">
                    {paidPlan?.plan.name || "No Active Plan"}
                  </h3>
                  {paidPlan && (
                    <p className="text-muted-foreground text-xs mt-1">
                      {paidPlan.plan.category} · {paidPlan.plan.duration}
                    </p>
                  )}
                </div>
                {paidPlan && validity && (
                  <Badge className={
                    validity.status === "refunded"
                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40"
                      : validity.status === "cancelled"
                      ? "bg-destructive/20 text-destructive border border-destructive/40"
                      : !validity.expired
                      ? "bg-primary/20 text-primary border border-primary/40 font-mono"
                      : "bg-destructive/20 text-destructive border border-destructive/40"
                  }>
                    {validity.status === "refunded"
                      ? "Refunded"
                      : validity.status === "cancelled"
                      ? "Cancelled"
                      : !validity.expired
                      ? `${validity.remainingDays}d ${String(validity.remainingHours).padStart(2,"0")}h ${String(validity.remainingMinutes).padStart(2,"0")}m ${String(validity.remainingSeconds).padStart(2,"0")}s left`
                      : "Expired"}
                  </Badge>
                )}
              </div>

              {paidPlan && validity ? (
                <>
                  <Progress value={validity.progressPct} className="h-2 mb-3" />
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <Mini
                      label="Start Date"
                      value={validity.start.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    />
                    <Mini
                      label="Expiration Date"
                      value={validity.end.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    />
                    <Mini
                      label="Remaining"
                      value={validity.expired ? "0 days" : `${validity.remainingDays} days`}
                    />
                  </div>
                  {validity.isCancelled && (
                    <div className="mt-4 p-3 rounded border border-destructive/30 bg-destructive/10 text-xs">
                      <p className="text-destructive font-semibold uppercase tracking-wider mb-1">
                        Plan {validity.status === "refunded" ? "Refunded" : "Cancelled"} by Admin
                      </p>
                      {paidPlan?.cancellationReason && (
                        <p className="text-muted-foreground">Reason: {paidPlan.cancellationReason}</p>
                      )}
                    </div>
                  )}
                  {classStats && (
                    <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-primary text-[10px] uppercase tracking-[0.3em] font-semibold">
                          Class Count · Mondays Off
                        </p>
                        <Badge className="bg-sport-energy/20 text-sport-energy border border-sport-energy/40 text-[10px] uppercase">
                          Holiday: Mon
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <Mini label="Total Classes" value={String(classStats.total)} />
                        <Mini label="Completed" value={String(classStats.completed)} />
                        <Mini label="Remaining" value={String(classStats.remaining)} />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground text-sm mb-3">
                    {selectedPlan ? "Complete your payment to activate the plan." : "Choose a plan to get started."}
                  </p>
                  <Button
                    onClick={() => navigate(selectedPlan ? "/payment" : "/plans")}
                    className="bg-sport-energy hover:bg-sport-energy/90 text-sport-energy-foreground font-semibold uppercase tracking-wider text-xs"
                  >
                    {selectedPlan ? "Proceed to Pay" : "View Plans"}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/5 backdrop-blur-xl border-primary/30">
            <CardContent className="p-5">
              <p className="text-primary text-[10px] uppercase tracking-[0.3em] font-semibold mb-1">
                {validity ? "Plan Progress" : "Onboarding Progress"}
              </p>
              <h3 className="font-display text-xl text-sport-dark-foreground tracking-wider mb-2">
                {validity ? `${Math.round(validity.progressPct)}% Used` : `${pieData[0].value}% Done`}
              </h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" innerRadius={40} outerRadius={65} paddingAngle={2} stroke="none">
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--sport-dark))", border: "1px solid hsl(var(--primary) / 0.4)", borderRadius: 8, fontSize: 12 }}
                      formatter={(v: any) => `${v}%`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-around text-[10px] uppercase tracking-wider">
                <span className="flex items-center gap-1 text-primary">
                  <span className="w-2 h-2 rounded-full bg-primary" /> {pieData[0].name}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-muted" /> {pieData[1].name}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <ActionCard
            icon={UserPlus}
            title={enrollments.length === 0 ? "Enroll Now" : "Add More Swimmers"}
            desc="Register new candidates and get them in the pool."
            cta={enrollments.length === 0 ? "Start Enrollment" : "New Enrollment"}
            onClick={() => navigate("/enroll")}
            highlight={enrollments.length === 0}
          />
          <ActionCard
            icon={Trophy}
            title={paidPlan ? "Plan Active" : "Choose Your Plan"}
            desc={paidPlan ? "Manage or upgrade your membership." : "Browse memberships and coaching tiers."}
            cta={paidPlan ? "Browse Plans" : selectedPlan ? "Change Plan" : "View Plans"}
            onClick={() => navigate("/plans")}
            highlight={enrollments.length > 0 && !paidPlan && !selectedPlan}
          />
        </div>

        {/* Pending payment banner */}
        {selectedPlan && !paidPlan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
            <Card className="bg-card/5 backdrop-blur-xl border-primary/30 shadow-lg shadow-primary/30">
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-primary text-[10px] uppercase tracking-[0.3em] font-semibold">Pending Payment</p>
                  <h3 className="font-display text-xl text-sport-dark-foreground tracking-wider">{selectedPlan.name}</h3>
                  <p className="text-muted-foreground text-sm">
                    ₹{selectedPlan.price?.toLocaleString?.() ?? selectedPlan.price} · {selectedPlan.category}
                  </p>
                </div>
                <Button
                  onClick={() => navigate("/payment")}
                  className="bg-sport-energy hover:bg-sport-energy/90 text-sport-energy-foreground font-semibold uppercase tracking-wider text-xs group"
                >
                  Proceed to Pay <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Diet Plan Section */}
        {allSwimmers.length > 0 && (
          <Card className="bg-card/5 backdrop-blur-xl border-primary/30 mb-6">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <Apple className="w-4 h-4 text-primary" />
                <p className="text-primary text-[10px] uppercase tracking-[0.3em] font-semibold">Personalized Diet</p>
              </div>
              <h3 className="font-display text-2xl text-sport-dark-foreground tracking-wider mb-4">
                WEIGHT REDUCTION PLAN
              </h3>

              {/* Swimmer selector */}
              {allSwimmers.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {allSwimmers.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setActiveSwimmerId(s.id)}
                      className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-wider border transition-colors ${
                        activeSwimmerId === s.id
                          ? "bg-primary text-white border-primary"
                          : "bg-sport-dark/40 text-muted-foreground border-primary/30 hover:border-primary/60"
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}

              {activeSwimmer && (!activeSwimmer.height || !activeSwimmer.weight) ? (
                <p className="text-muted-foreground text-sm">
                  Add height & weight for <strong>{activeSwimmer.name}</strong> to generate a diet plan.
                </p>
              ) : (
                <>
                  {/* Veg / Non-Veg selector */}
                  <div className="mb-5">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                      Are you Vegetarian or Non-Vegetarian?
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setDietType("veg"); localStorage.setItem("dietType", "veg"); }}
                        className={`flex-1 max-w-[180px] flex items-center justify-center gap-2 px-4 py-3 rounded-lg border uppercase tracking-wider text-xs font-semibold transition-all ${
                          dietType === "veg"
                            ? "bg-primary/20 border-primary text-primary shadow-lg shadow-primary/20"
                            : "bg-sport-dark/40 border-primary/30 text-muted-foreground hover:border-primary/60"
                        }`}
                      >
                        <Leaf className="w-4 h-4" /> Vegetarian
                      </button>
                      <button
                        onClick={() => { setDietType("nonveg"); localStorage.setItem("dietType", "nonveg"); }}
                        className={`flex-1 max-w-[180px] flex items-center justify-center gap-2 px-4 py-3 rounded-lg border uppercase tracking-wider text-xs font-semibold transition-all ${
                          dietType === "nonveg"
                            ? "bg-sport-energy/20 border-sport-energy text-sport-energy shadow-lg shadow-sport-energy/20"
                            : "bg-sport-dark/40 border-primary/30 text-muted-foreground hover:border-primary/60"
                        }`}
                      >
                        <Drumstick className="w-4 h-4" /> Non-Vegetarian
                      </button>
                    </div>
                  </div>

                  {dietPlan && (
                    <>
                      {/* Stats grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                        <DietStat icon={Activity} label="BMI" value={`${dietPlan.bmi}`} sub={dietPlan.bmiCategory} />
                        <DietStat icon={Trophy} label="Target Weight" value={`${dietPlan.targetWeightKg} kg`} />
                        <DietStat icon={Flame} label="Daily Calories" value={`${dietPlan.dailyCalories}`} sub="kcal" />
                        <DietStat icon={Droplet} label="Water" value={`${dietPlan.waterLitres} L`} sub="per day" />
                      </div>

                      {/* Macros */}
                      <div className="grid grid-cols-3 gap-3 mb-5 text-center">
                        <Macro label="Protein" value={`${dietPlan.proteinG}g`} color="primary" />
                        <Macro label="Carbs" value={`${dietPlan.carbsG}g`} color="accent" />
                        <Macro label="Fats" value={`${dietPlan.fatsG}g`} color="sport-energy" />
                      </div>

                      {/* Meal plan */}
                      <div className="space-y-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
                          {dietType === "veg" ? "Vegetarian" : "Non-Vegetarian"} Meal Plan · Natural Foods Only
                        </p>
                        {dietPlan.meals.map((meal, i) => (
                          <div
                            key={i}
                            className="bg-sport-dark/40 border border-primary/20 rounded-lg p-3 hover:border-primary/40 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-display text-sm text-sport-dark-foreground tracking-wider">
                                {meal.title}
                              </p>
                              <span className="text-[10px] uppercase tracking-wider text-primary">{meal.time}</span>
                            </div>
                            <ul className="text-sm text-muted-foreground space-y-0.5">
                              {meal.items.map((it, j) => (
                                <li key={j} className="flex gap-2">
                                  <span className="text-primary">•</span> <span>{it}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>

                      {/* Tips */}
                      <div className="mt-5 p-4 rounded-lg bg-primary/5 border border-primary/20">
                        <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-2">Coach's Tips</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {dietPlan.tips.map((t, i) => (
                            <li key={i} className="flex gap-2">
                              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /> {t}
                            </li>
                          ))}
                        </ul>
                        <p className="text-[10px] text-muted-foreground mt-3 italic">
                          * General guidance only. Consult a doctor or dietitian for medical conditions.
                        </p>
                      </div>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Latest enrollment */}
        {latest && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-xl text-sport-dark-foreground tracking-wider">YOUR SWIMMERS</h3>
              <span className="text-primary/70 text-xs uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(latest.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {latest.enrollment_candidates?.map((c) => (
                <Card key={c.id} className="bg-card/5 backdrop-blur-xl border-primary/30 hover:border-primary/60 transition-colors">
                  <CardContent className="p-4 flex items-center gap-4">
                    {c.photo_url ? (
                      <img src={c.photo_url} alt={c.name} className="w-16 h-16 rounded-lg object-cover border-2 border-primary/50" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-sport-dark/60 border-2 border-primary/30 flex items-center justify-center">
                        <Users className="w-7 h-7 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-lg text-sport-dark-foreground tracking-wider truncate">{c.name}</p>
                      <p className="text-muted-foreground text-xs truncate flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {c.email}
                      </p>
                      <p className="text-muted-foreground text-xs truncate flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {c.contact_no}
                      </p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="bg-sport-dark border-primary/30 text-sport-dark-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl tracking-wider flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" /> Reminder Settings
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Choose when you'd like to be alerted about your plan expiry.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-card/5 p-3">
              <div>
                <Label className="text-sm font-semibold text-sport-dark-foreground">Enable reminders</Label>
                <p className="text-xs text-muted-foreground">Master switch for all expiry alerts.</p>
              </div>
              <Switch
                checked={reminderPrefs.enabled}
                onCheckedChange={(v) => setReminderPrefs((p) => ({ ...p, enabled: v }))}
              />
            </div>
            {([
              { key: "threeDay", label: "3 days before expiry", desc: "Heads-up reminder." },
              { key: "oneDay", label: "1 day before expiry", desc: "Final renewal nudge." },
              { key: "expiry", label: "On expiry", desc: "Notify when the plan expires." },
            ] as const).map((opt) => (
              <div key={opt.key} className={`flex items-center justify-between rounded-lg border border-primary/20 bg-card/5 p-3 ${!reminderPrefs.enabled ? "opacity-50" : ""}`}>
                <div>
                  <Label className="text-sm font-semibold text-sport-dark-foreground">{opt.label}</Label>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
                <Switch
                  disabled={!reminderPrefs.enabled}
                  checked={reminderPrefs[opt.key]}
                  onCheckedChange={(v) => setReminderPrefs((p) => ({ ...p, [opt.key]: v }))}
                />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <Card className="bg-card/5 backdrop-blur-xl border-primary/30">
    <CardContent className="p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-primary/80 text-[10px] uppercase tracking-[0.25em] font-semibold">{label}</p>
        <p className="font-display text-xl text-sport-dark-foreground tracking-wider truncate">{value}</p>
      </div>
    </CardContent>
  </Card>
);

const Mini = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-sport-dark/40 border border-primary/20 rounded-lg p-2">
    <p className="text-[9px] uppercase tracking-[0.25em] text-primary/80 font-semibold">{label}</p>
    <p className="font-display text-sm text-sport-dark-foreground tracking-wider">{value}</p>
  </div>
);

const DietStat = ({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) => (
  <div className="bg-sport-dark/40 border border-primary/20 rounded-lg p-3 flex items-center gap-3">
    <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4 text-primary" />
    </div>
    <div className="min-w-0">
      <p className="text-[9px] uppercase tracking-[0.25em] text-primary/80 font-semibold">{label}</p>
      <p className="font-display text-base text-sport-dark-foreground tracking-wider">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground -mt-0.5">{sub}</p>}
    </div>
  </div>
);

const MACRO_STYLES: Record<string, { wrap: string; text: string }> = {
  primary: { wrap: "bg-primary/10 border-primary/30", text: "text-primary" },
  accent: { wrap: "bg-accent/10 border-accent/30", text: "text-accent" },
  "sport-energy": { wrap: "bg-sport-energy/10 border-sport-energy/30", text: "text-sport-energy" },
};
const Macro = ({ label, value, color }: { label: string; value: string; color: string }) => {
  const s = MACRO_STYLES[color] || MACRO_STYLES.primary;
  return (
    <div className={`rounded-lg p-3 border ${s.wrap}`}>
      <p className={`text-[10px] uppercase tracking-[0.2em] font-semibold ${s.text}`}>{label}</p>
      <p className="font-display text-xl text-sport-dark-foreground tracking-wider">{value}</p>
    </div>
  );
};

const ActionCard = ({
  icon: Icon, title, desc, cta, onClick, highlight,
}: { icon: any; title: string; desc: string; cta: string; onClick: () => void; highlight?: boolean }) => (
  <Card
    className={`bg-white/5 backdrop-blur-xl border transition-all cursor-pointer hover:scale-[1.01] ${
      highlight ? "border-primary/60 shadow-lg shadow-primary/30" : "border-primary/30 hover:border-primary/50"
    }`}
    onClick={onClick}
  >
    <CardContent className="p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30 shrink-0">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-display text-lg text-sport-dark-foreground tracking-wider">{title}</h3>
          <p className="text-muted-foreground text-sm">{desc}</p>
        </div>
      </div>
      <Button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className="w-full bg-sport-energy hover:bg-sport-energy/90 text-sport-energy-foreground font-semibold uppercase tracking-wider text-xs group"
      >
        {cta} <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
      </Button>
    </CardContent>
  </Card>
);

export default DashboardPage;
