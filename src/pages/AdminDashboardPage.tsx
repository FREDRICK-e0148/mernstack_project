import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, LogOut, Shield, Users, Trash2, Plus, Pencil, UserPlus, Dumbbell, CreditCard, Ban, Undo2, MessageCircle, Phone, Search, Eye, CalendarPlus, CalendarMinus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { isClassPlanCategory } from "@/lib/plans";

interface Program {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  duration: string | null;
  is_active: boolean;
}

interface AuthUser {
  id: string;
  email: string | null;
  phone?: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

interface Profile {
  user_id: string;
  full_name: string | null;
  phone: string | null;
}

const AdminDashboardPage = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [checking, setChecking] = useState(true);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [paidPlans, setPaidPlans] = useState<any[]>([]);
  const [contactClicks, setContactClicks] = useState<{ id: string; channel: string; created_at: string; user_id: string | null }[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [enrollmentsAll, setEnrollmentsAll] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [viewUser, setViewUser] = useState<AuthUser | null>(null);

  // refund/cancel dialog
  const [planActionOpen, setPlanActionOpen] = useState(false);
  const [planAction, setPlanAction] = useState<"cancelled" | "refunded">("cancelled");
  const [planActionTarget, setPlanActionTarget] = useState<any>(null);
  const [planActionReason, setPlanActionReason] = useState("");

  // program dialog state
  const [progOpen, setProgOpen] = useState(false);
  const [editProg, setEditProg] = useState<Program | null>(null);
  const [progForm, setProgForm] = useState({ name: "", description: "", price: "", duration: "" });

  // user dialog state
  const [userOpen, setUserOpen] = useState(false);
  const [userForm, setUserForm] = useState({ email: "", password: "" });

  const loadAll = async () => {
    const [c, p, u, pp, cc, pr, en] = await Promise.all([
      supabase.from("enrollment_candidates").select("*").order("created_at", { ascending: false }),
      supabase.from("programs").select("*").order("created_at", { ascending: false }),
      supabase.functions.invoke("admin-users", { body: { action: "list" } }),
      supabase.from("paid_plans").select("*").order("paid_at", { ascending: false }),
      supabase.from("contact_clicks").select("id, channel, created_at, user_id").order("created_at", { ascending: false }).limit(500),
      supabase.from("profiles").select("user_id, full_name, phone"),
      supabase.from("enrollments").select("id, user_id, created_at, enrollment_candidates(*)").order("created_at", { ascending: false }),
    ]);
    setCandidates(c.data ?? []);
    setPrograms((p.data as Program[]) ?? []);
    setUsers(u.data?.users ?? []);
    setPaidPlans(pp.data ?? []);
    setContactClicks((cc.data as any[]) ?? []);
    setProfiles((pr.data as Profile[]) ?? []);
    setEnrollmentsAll((en.data as any[]) ?? []);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/admin-login");
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("user_roles").select("role")
        .eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (!data) {
        toast({ title: "Access denied", description: "Admin only.", variant: "destructive" });
        navigate("/");
        return;
      }
      await loadAll();
      setChecking(false);
    })();
  }, [user, authLoading, navigate, toast]);

  const openNewProgram = () => {
    setEditProg(null);
    setProgForm({ name: "", description: "", price: "", duration: "" });
    setProgOpen(true);
  };
  const openEditProgram = (p: Program) => {
    setEditProg(p);
    setProgForm({
      name: p.name,
      description: p.description ?? "",
      price: p.price?.toString() ?? "",
      duration: p.duration ?? "",
    });
    setProgOpen(true);
  };
  const saveProgram = async () => {
    const payload = {
      name: progForm.name,
      description: progForm.description || null,
      price: progForm.price ? Number(progForm.price) : null,
      duration: progForm.duration || null,
    };
    const { error } = editProg
      ? await supabase.from("programs").update(payload).eq("id", editProg.id)
      : await supabase.from("programs").insert(payload);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: editProg ? "Program updated" : "Program added" });
    setProgOpen(false);
    loadAll();
  };
  const deleteProgram = async (id: string) => {
    if (!confirm("Delete this program?")) return;
    const { error } = await supabase.from("programs").delete().eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Program deleted" });
    loadAll();
  };

  const deleteCandidate = async (id: string) => {
    if (!confirm("Delete this candidate?")) return;
    const { error } = await supabase.from("enrollment_candidates").delete().eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Candidate deleted" });
    loadAll();
  };

  const createUser = async () => {
    const { error } = await supabase.functions.invoke("admin-users", {
      body: { action: "create", email: userForm.email, password: userForm.password },
    });
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "User created" });
    setUserOpen(false);
    setUserForm({ email: "", password: "" });
    loadAll();
  };
  const deleteUser = async (id: string) => {
    if (!confirm("Delete this user account? This cannot be undone.")) return;
    const { error } = await supabase.functions.invoke("admin-users", {
      body: { action: "delete", user_id: id },
    });
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "User deleted" });
    loadAll();
  };

  const openPlanAction = (plan: any, action: "cancelled" | "refunded") => {
    setPlanActionTarget(plan);
    setPlanAction(action);
    setPlanActionReason("");
    setPlanActionOpen(true);
  };

  const confirmPlanAction = async () => {
    if (!planActionTarget) return;
    const { error } = await supabase
      .from("paid_plans")
      .update({
        status: planAction,
        cancellation_reason: planActionReason || null,
        cancelled_at: new Date().toISOString(),
        // immediately void validity so user dashboard reflects the change
        expires_at: new Date().toISOString(),
      })
      .eq("id", planActionTarget.id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({
      title: planAction === "refunded" ? "Plan refunded" : "Plan cancelled",
      description: "User dashboard will update immediately.",
    });
    setPlanActionOpen(false);
    loadAll();
  };

  const userEmail = (uid: string) => users.find((u) => u.id === uid)?.email ?? uid.slice(0, 8);

  // Build phone index: profile.phone OR any candidate.contact_no for the user.
  const userPhones = (uid: string) => {
    const out = new Set<string>();
    const p = profiles.find((x) => x.user_id === uid)?.phone;
    if (p) out.add(p);
    enrollmentsAll
      .filter((e) => e.user_id === uid)
      .forEach((e) => (e.enrollment_candidates ?? []).forEach((c: any) => c.contact_no && out.add(c.contact_no)));
    return Array.from(out);
  };
  const userFullName = (uid: string) =>
    profiles.find((x) => x.user_id === uid)?.full_name ?? null;

  const filteredUsers = users.filter((u) => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return true;
    if ((u.email ?? "").toLowerCase().includes(q)) return true;
    if ((u.phone ?? "").toLowerCase().includes(q)) return true;
    const name = userFullName(u.id);
    if (name && name.toLowerCase().includes(q)) return true;
    return userPhones(u.id).some((ph) => ph.toLowerCase().includes(q));
  });

  // Add or remove days for an active coaching/membership plan.
  const adjustPlanDays = async (plan: any, deltaDays: number) => {
    if (!isClassPlanCategory(plan.plan_category)) {
      return toast({ title: "Not allowed", description: "Only Coaching & Membership plans can be adjusted.", variant: "destructive" });
    }
    const current = new Date(plan.expires_at).getTime();
    const next = new Date(current + deltaDays * 86400000);
    const newDuration = Math.max(1, (plan.duration_days ?? 0) + deltaDays);
    const { error } = await supabase
      .from("paid_plans")
      .update({ expires_at: next.toISOString(), duration_days: newDuration })
      .eq("id", plan.id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({
      title: deltaDays > 0 ? `Added ${deltaDays} day${deltaDays > 1 ? "s" : ""}` : `Removed ${Math.abs(deltaDays)} day${Math.abs(deltaDays) > 1 ? "s" : ""}`,
      description: "User dashboard will update immediately.",
    });
    loadAll();
  };

  const userPaidPlans = (uid: string) => paidPlans.filter((p) => p.user_id === uid);
  const userEnrollments = (uid: string) => enrollmentsAll.filter((e) => e.user_id === uid);


  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-sport-dark flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sport-dark p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-sport-energy flex items-center justify-center">
              <Shield className="w-6 h-6 text-sport-energy-foreground" />
            </div>
            <div>
              <h1 className="font-display text-3xl text-sport-dark-foreground tracking-wider">ADMIN DASHBOARD</h1>
              <p className="text-primary text-xs uppercase tracking-[0.3em]">Friends Sports Academy</p>
            </div>
          </div>
          <Button onClick={() => { signOut(); navigate("/"); }} variant="outline" className="border-primary/40 text-primary hover:bg-primary/10">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>

        <Tabs defaultValue="enrollments" className="w-full">
          <TabsList className="bg-card/10 border border-primary/20 mb-6">
            <TabsTrigger value="enrollments"><Users className="w-4 h-4 mr-2" />Enrollments</TabsTrigger>
            <TabsTrigger value="programs"><Dumbbell className="w-4 h-4 mr-2" />Programs</TabsTrigger>
            <TabsTrigger value="plans"><CreditCard className="w-4 h-4 mr-2" />Paid Plans</TabsTrigger>
            <TabsTrigger value="users"><UserPlus className="w-4 h-4 mr-2" />Users</TabsTrigger>
            <TabsTrigger value="inquiries"><MessageCircle className="w-4 h-4 mr-2" />Inquiries</TabsTrigger>
          </TabsList>

          {/* ENROLLMENTS */}
          <TabsContent value="enrollments">
            <Card className="bg-card/10 backdrop-blur-lg border-primary/20">
              <CardHeader>
                <CardTitle className="font-display text-2xl text-sport-dark-foreground tracking-wider">
                  ENROLLED CANDIDATES ({candidates.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {candidates.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No enrollments yet.</p>
                ) : (
                  <div className="space-y-3">
                    {candidates.map((c) => (
                      <div key={c.id} className="bg-sport-dark/50 border border-primary/20 rounded-lg p-4 flex items-center gap-4">
                        {c.photo_url ? (
                          <img src={c.photo_url} alt={c.name} className="w-16 h-16 rounded-full object-cover border-2 border-primary/40" />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-xl">
                            {c.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div><span className="text-muted-foreground text-xs uppercase">Name</span><p className="text-sport-dark-foreground font-semibold">{c.name}</p></div>
                          <div><span className="text-muted-foreground text-xs uppercase">DOB</span><p className="text-sport-dark-foreground">{c.dob}</p></div>
                          <div><span className="text-muted-foreground text-xs uppercase">Contact</span><p className="text-sport-dark-foreground">{c.contact_no}</p></div>
                          <div><span className="text-muted-foreground text-xs uppercase">Email</span><p className="text-sport-dark-foreground truncate">{c.email}</p></div>
                          <div className="col-span-2 md:col-span-4"><span className="text-muted-foreground text-xs uppercase">Enrollment ID</span><p className="text-primary text-xs font-mono">{c.enrollment_id}</p></div>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => deleteCandidate(c.id)} className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PROGRAMS */}
          <TabsContent value="programs">
            <Card className="bg-card/10 backdrop-blur-lg border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-display text-2xl text-sport-dark-foreground tracking-wider">
                  PROGRAMS ({programs.length})
                </CardTitle>
                <Button onClick={openNewProgram} className="bg-sport-energy text-sport-energy-foreground hover:bg-sport-energy/90">
                  <Plus className="w-4 h-4 mr-2" /> Add Program
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {programs.map((p) => (
                    <div key={p.id} className="bg-sport-dark/50 border border-primary/20 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-display text-lg text-sport-dark-foreground">{p.name}</h3>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEditProgram(p)} className="text-primary hover:bg-primary/10 h-8 w-8">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteProgram(p.id)} className="text-destructive hover:bg-destructive/10 h-8 w-8">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{p.description}</p>
                      <div className="flex gap-4 text-xs">
                        {p.price !== null && <span className="text-primary">₹{p.price}</span>}
                        {p.duration && <span className="text-muted-foreground">{p.duration}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PAID PLANS */}
          <TabsContent value="plans">
            <Card className="bg-card/10 backdrop-blur-lg border-primary/20">
              <CardHeader>
                <CardTitle className="font-display text-2xl text-sport-dark-foreground tracking-wider">
                  PAID PLANS ({paidPlans.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paidPlans.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No paid plans yet.</p>
                ) : (
                  <div className="space-y-2">
                    {paidPlans.map((p) => {
                      const expired = new Date(p.expires_at).getTime() < Date.now();
                      const status = p.status ?? "active";
                      const badgeClass =
                        status === "refunded"
                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40"
                          : status === "cancelled"
                          ? "bg-destructive/20 text-destructive border border-destructive/40"
                          : expired
                          ? "bg-muted/40 text-muted-foreground border border-muted/40"
                          : "bg-primary/20 text-primary border border-primary/40";
                      const label = status !== "active" ? status : expired ? "expired" : "active";
                      return (
                        <div key={p.id} className="bg-sport-dark/50 border border-primary/20 rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-3">
                          <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                            <div><span className="text-muted-foreground text-xs uppercase">User</span><p className="text-sport-dark-foreground truncate">{userEmail(p.user_id)}</p></div>
                            <div><span className="text-muted-foreground text-xs uppercase">Plan</span><p className="text-sport-dark-foreground font-semibold">{p.plan_name}</p></div>
                            <div><span className="text-muted-foreground text-xs uppercase">Price</span><p className="text-primary">₹{Number(p.plan_price).toLocaleString()}</p></div>
                            <div><span className="text-muted-foreground text-xs uppercase">Paid</span><p className="text-sport-dark-foreground">{new Date(p.paid_at).toLocaleDateString()}</p></div>
                            <div>
                              <span className="text-muted-foreground text-xs uppercase">Status</span>
                              <div><Badge className={`${badgeClass} uppercase text-[10px] mt-1`}>{label}</Badge></div>
                            </div>
                            {p.cancellation_reason && (
                              <div className="col-span-2 md:col-span-5">
                                <span className="text-muted-foreground text-xs uppercase">Reason</span>
                                <p className="text-sport-dark-foreground text-xs">{p.cancellation_reason}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 shrink-0">
                            {isClassPlanCategory(p.plan_category) && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={status !== "active"}
                                  onClick={() => adjustPlanDays(p, 1)}
                                  className="border-primary/40 text-primary hover:bg-primary/10"
                                  title="Extend by 1 day"
                                >
                                  <CalendarPlus className="w-3 h-3 mr-1" /> +1d
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={status !== "active"}
                                  onClick={() => adjustPlanDays(p, 7)}
                                  className="border-primary/40 text-primary hover:bg-primary/10"
                                  title="Extend by 7 days"
                                >
                                  <CalendarPlus className="w-3 h-3 mr-1" /> +7d
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={status !== "active"}
                                  onClick={() => adjustPlanDays(p, -1)}
                                  className="border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10"
                                  title="Reduce by 1 day"
                                >
                                  <CalendarMinus className="w-3 h-3 mr-1" /> -1d
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={status !== "active"}
                              onClick={() => openPlanAction(p, "cancelled")}
                              className="border-destructive/40 text-destructive hover:bg-destructive/10"
                            >
                              <Ban className="w-3 h-3 mr-1" /> Cancel
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={status !== "active"}
                              onClick={() => openPlanAction(p, "refunded")}
                              className="border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10"
                            >
                              <Undo2 className="w-3 h-3 mr-1" /> Refund
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* USERS */}
          <TabsContent value="users">
            <Card className="bg-card/10 backdrop-blur-lg border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-display text-2xl text-sport-dark-foreground tracking-wider">
                  USERS ({users.length})
                </CardTitle>
                <Button onClick={() => setUserOpen(true)} className="bg-sport-energy text-sport-energy-foreground hover:bg-sport-energy/90">
                  <UserPlus className="w-4 h-4 mr-2" /> Add User
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {users.map((u) => (
                    <div key={u.id} className="bg-sport-dark/50 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
                      <div className="text-sm">
                        <p className="text-sport-dark-foreground font-semibold">{u.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(u.created_at).toLocaleDateString()} · Last login {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "never"}
                        </p>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => deleteUser(u.id)} className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* INQUIRIES (contact button clicks) */}
          <TabsContent value="inquiries">
            {(() => {
              const now = Date.now();
              const since = (days: number) => contactClicks.filter((c) => now - new Date(c.created_at).getTime() < days * 86400000);
              const wa = contactClicks.filter((c) => c.channel === "whatsapp");
              const call = contactClicks.filter((c) => c.channel === "call");
              const last7 = since(7);
              const wa7 = last7.filter((c) => c.channel === "whatsapp").length;
              const call7 = last7.filter((c) => c.channel === "call").length;
              const total = contactClicks.length || 1;
              const waPct = Math.round((wa.length / total) * 100);
              const callPct = 100 - waPct;
              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-card/10 backdrop-blur-lg border-primary/20">
                      <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Total clicks</CardTitle></CardHeader>
                      <CardContent><p className="font-display text-3xl text-sport-dark-foreground">{contactClicks.length}</p></CardContent>
                    </Card>
                    <Card className="bg-card/10 backdrop-blur-lg border-primary/20">
                      <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><MessageCircle className="w-4 h-4 text-[#25D366]" />WhatsApp</CardTitle></CardHeader>
                      <CardContent>
                        <p className="font-display text-3xl text-sport-dark-foreground">{wa.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">{waPct}% share · {wa7} this week</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-card/10 backdrop-blur-lg border-primary/20">
                      <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Phone className="w-4 h-4 text-primary" />Call</CardTitle></CardHeader>
                      <CardContent>
                        <p className="font-display text-3xl text-sport-dark-foreground">{call.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">{callPct}% share · {call7} this week</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-card/10 backdrop-blur-lg border-primary/20">
                      <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Top channel</CardTitle></CardHeader>
                      <CardContent>
                        <p className="font-display text-3xl text-sport-dark-foreground">
                          {contactClicks.length === 0 ? "—" : wa.length >= call.length ? "WhatsApp" : "Call"}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-card/10 backdrop-blur-lg border-primary/20">
                    <CardHeader>
                      <CardTitle className="font-display text-2xl text-sport-dark-foreground tracking-wider">RECENT INQUIRIES</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {contactClicks.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No contact button clicks yet.</p>
                      ) : (
                        <div className="space-y-2 max-h-[480px] overflow-y-auto">
                          {contactClicks.slice(0, 100).map((c) => (
                            <div key={c.id} className="bg-sport-dark/50 border border-primary/20 rounded-lg p-3 flex items-center gap-3 text-sm">
                              {c.channel === "whatsapp" ? (
                                <Badge className="bg-[#25D366] text-white"><MessageCircle className="w-3 h-3 mr-1" />WhatsApp</Badge>
                              ) : (
                                <Badge className="bg-primary text-primary-foreground"><Phone className="w-3 h-3 mr-1" />Call</Badge>
                              )}
                              <span className="text-sport-dark-foreground">{new Date(c.created_at).toLocaleString()}</span>
                              <span className="ml-auto text-xs font-mono text-muted-foreground">{c.user_id ? c.user_id.slice(0, 8) : "guest"}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })()}
          </TabsContent>
        </Tabs>
      </div>

      {/* Program dialog */}
      <Dialog open={progOpen} onOpenChange={setProgOpen}>
        <DialogContent className="bg-sport-dark border-primary/30">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-sport-dark-foreground tracking-wider">
              {editProg ? "EDIT PROGRAM" : "NEW PROGRAM"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Program name" value={progForm.name} onChange={(e) => setProgForm({ ...progForm, name: e.target.value })} />
            <Textarea placeholder="Description" value={progForm.description} onChange={(e) => setProgForm({ ...progForm, description: e.target.value })} />
            <Input type="number" placeholder="Price (₹)" value={progForm.price} onChange={(e) => setProgForm({ ...progForm, price: e.target.value })} />
            <Input placeholder="Duration (e.g. 1 month)" value={progForm.duration} onChange={(e) => setProgForm({ ...progForm, duration: e.target.value })} />
          </div>
          <DialogFooter>
            <Button onClick={saveProgram} disabled={!progForm.name} className="bg-sport-energy text-sport-energy-foreground hover:bg-sport-energy/90">
              {editProg ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User dialog */}
      <Dialog open={userOpen} onOpenChange={setUserOpen}>
        <DialogContent className="bg-sport-dark border-primary/30">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-sport-dark-foreground tracking-wider">NEW USER</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input type="email" placeholder="Email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
            <Input type="password" placeholder="Password (min 6 chars)" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
          </div>
          <DialogFooter>
            <Button onClick={createUser} disabled={!userForm.email || userForm.password.length < 6} className="bg-sport-energy text-sport-energy-foreground hover:bg-sport-energy/90">
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel/Refund dialog */}
      <Dialog open={planActionOpen} onOpenChange={setPlanActionOpen}>
        <DialogContent className="bg-sport-dark border-primary/30">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-sport-dark-foreground tracking-wider">
              {planAction === "refunded" ? "REFUND PLAN" : "CANCEL PLAN"}
            </DialogTitle>
          </DialogHeader>
          {planActionTarget && (
            <div className="space-y-3 text-sm">
              <div className="bg-card/10 border border-primary/20 rounded p-3">
                <p className="text-sport-dark-foreground"><span className="text-muted-foreground">User:</span> {userEmail(planActionTarget.user_id)}</p>
                <p className="text-sport-dark-foreground"><span className="text-muted-foreground">Plan:</span> {planActionTarget.plan_name}</p>
                <p className="text-sport-dark-foreground"><span className="text-muted-foreground">Amount:</span> ₹{Number(planActionTarget.plan_price).toLocaleString()}</p>
              </div>
              <p className="text-muted-foreground text-xs">
                The plan will be marked as <strong>{planAction}</strong> and validity will end immediately. The user's dashboard will reflect this change in real time.
              </p>
              <Textarea
                placeholder="Reason (optional)"
                value={planActionReason}
                onChange={(e) => setPlanActionReason(e.target.value)}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanActionOpen(false)} className="border-primary/40 text-primary">Back</Button>
            <Button
              onClick={confirmPlanAction}
              className={planAction === "refunded"
                ? "bg-yellow-500 hover:bg-yellow-500/90 text-sport-dark"
                : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"}
            >
              Confirm {planAction === "refunded" ? "Refund" : "Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboardPage;
