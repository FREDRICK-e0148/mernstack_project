import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  LogOut,
  Waves,
  Users,
  CalendarCheck,
  CreditCard,
  ArrowRight,
  UserPlus,
  Trophy,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
} from "lucide-react";

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

const DashboardPage = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select("id, created_at, enrollment_candidates(id, name, dob, contact_no, email, photo_url, height, weight)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!error && data) setEnrollments(data as any);
      const sp = sessionStorage.getItem("selectedPlan");
      if (sp) {
        try { setSelectedPlan(JSON.parse(sp)); } catch {}
      }
      setLoading(false);
    })();
  }, [user]);

  const totalSwimmers = enrollments.reduce((sum, e) => sum + (e.enrollment_candidates?.length || 0), 0);
  const latest = enrollments[0];

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

      <div className="max-w-5xl mx-auto relative z-10">
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
          <Button
            size="sm"
            variant="outline"
            onClick={async () => { await signOut(); navigate("/login"); }}
            className="border-primary/40 bg-sport-dark/40 backdrop-blur text-primary hover:bg-primary/20 hover:text-sport-dark-foreground uppercase tracking-wider text-xs"
          >
            <LogOut className="w-3 h-3 mr-1" /> Sign out
          </Button>
        </div>

        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="font-display text-4xl md:text-5xl text-gradient-sport tracking-wider">
            WELCOME BACK, CHAMP!
          </h2>
          <p className="text-muted-foreground mt-2">
            {enrollments.length === 0
              ? "Ready to dive in? Start by enrolling your swimmers."
              : "Here's an overview of your aquatic journey."}
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard icon={Users} label="Swimmers Enrolled" value={String(totalSwimmers)} />
          <StatCard icon={CalendarCheck} label="Enrollments" value={String(enrollments.length)} />
          <StatCard
            icon={Trophy}
            label="Selected Plan"
            value={selectedPlan?.name ? selectedPlan.name : "Not Chosen"}
          />
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
            title="Choose Your Plan"
            desc="Browse memberships, coaching tiers and weekend plans."
            cta={selectedPlan ? "Change Plan" : "View Plans"}
            onClick={() => navigate("/plans")}
            highlight={enrollments.length > 0 && !selectedPlan}
          />
        </div>

        {/* Selected plan & payment status */}
        {selectedPlan && (
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
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <Card className="bg-card/5 backdrop-blur-xl border-primary/30">
    <CardContent className="p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-primary/80 text-[10px] uppercase tracking-[0.25em] font-semibold">{label}</p>
        <p className="font-display text-xl text-sport-dark-foreground tracking-wider truncate">{value}</p>
      </div>
    </CardContent>
  </Card>
);

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
