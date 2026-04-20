import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogOut, Shield, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const AdminDashboardPage = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [checking, setChecking] = useState(true);
  const [candidates, setCandidates] = useState<any[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/admin-login");
      return;
    }

    const verifyAdmin = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!data) {
        toast({ title: "Access denied", description: "Admin only.", variant: "destructive" });
        navigate("/");
        return;
      }

      const { data: cands } = await supabase
        .from("enrollment_candidates")
        .select("*")
        .order("created_at", { ascending: false });
      setCandidates(cands ?? []);
      setChecking(false);
    };

    verifyAdmin();
  }, [user, authLoading, navigate, toast]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-sport-dark flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sport-dark p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
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

        <Card className="bg-card/10 backdrop-blur-lg border-primary/20">
          <CardHeader>
            <CardTitle className="font-display text-2xl text-sport-dark-foreground tracking-wider flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" /> ENROLLED CANDIDATES ({candidates.length})
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
