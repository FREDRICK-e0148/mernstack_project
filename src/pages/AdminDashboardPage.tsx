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
import { Loader2, LogOut, Shield, Users, Trash2, Plus, Pencil, UserPlus, Dumbbell, CreditCard, Ban, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

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
  created_at: string;
  last_sign_in_at: string | null;
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
    const [c, p, u, pp] = await Promise.all([
      supabase.from("enrollment_candidates").select("*").order("created_at", { ascending: false }),
      supabase.from("programs").select("*").order("created_at", { ascending: false }),
      supabase.functions.invoke("admin-users", { body: { action: "list" } }),
      supabase.from("paid_plans").select("*").order("paid_at", { ascending: false }),
    ]);
    setCandidates(c.data ?? []);
    setPrograms((p.data as Program[]) ?? []);
    setUsers(u.data?.users ?? []);
    setPaidPlans(pp.data ?? []);
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
    </div>
  );
};

export default AdminDashboardPage;
