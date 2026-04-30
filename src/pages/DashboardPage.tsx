import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AquaBackground from "@/components/AquaBackground";
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
      <div className="min-h-screen relative flex items-center justify-center">
        <AquaBackground bubbles={10} />
        <Loader2 className="w-8 h-8 text-cyan-300 animate-spin relative z-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative px-4 py-8 overflow-hidden">
      <AquaBackground bubbles={26} />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center glow-aqua">
              <Waves className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-aqua text-2xl text-white tracking-wider leading-none">MY DASHBOARD</h1>
              <p className="text-cyan-300 text-[10px] uppercase tracking-[0.3em] font-semibold mt-1">
                Friends Aquatic Academy
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => { await signOut(); navigate("/login"); }}
            className="border-cyan-400/40 bg-slate-900/40 backdrop-blur text-cyan-200 hover:bg-cyan-500/20 hover:text-white uppercase tracking-wider text-xs"
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
          <h2 className="font-aqua text-4xl md:text-5xl text-gradient-aqua tracking-wider">
            WELCOME BACK, CHAMP!
          </h2>
          <p className="text-cyan-100/70 mt-2">
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
            <Card className="bg-white/5 backdrop-blur-xl border-cyan-400/30 glow-aqua">
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shrink-0">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-cyan-300 text-[10px] uppercase tracking-[0.3em] font-semibold">Pending Payment</p>
                  <h3 className="font-aqua text-xl text-white tracking-wider">{selectedPlan.name}</h3>
                  <p className="text-cyan-100/70 text-sm">
                    ₹{selectedPlan.price?.toLocaleString?.() ?? selectedPlan.price} · {selectedPlan.category}
                  </p>
                </div>
                <Button
                  onClick={() => navigate("/payment")}
                  className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold uppercase tracking-wider text-xs group"
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
              <h3 className="font-aqua text-xl text-white tracking-wider">YOUR SWIMMERS</h3>
              <span className="text-cyan-300/70 text-xs uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(latest.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {latest.enrollment_candidates?.map((c) => (
                <Card key={c.id} className="bg-white/5 backdrop-blur-xl border-cyan-400/30 hover:border-cyan-400/60 transition-colors">
                  <CardContent className="p-4 flex items-center gap-4">
                    {c.photo_url ? (
                      <img src={c.photo_url} alt={c.name} className="w-16 h-16 rounded-lg object-cover border-2 border-cyan-400/50" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-slate-900/60 border-2 border-cyan-400/30 flex items-center justify-center">
                        <Users className="w-7 h-7 text-cyan-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-aqua text-lg text-white tracking-wider truncate">{c.name}</p>
                      <p className="text-cyan-100/60 text-xs truncate flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {c.email}
                      </p>
                      <p className="text-cyan-100/60 text-xs truncate flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {c.contact_no}
                      </p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-cyan-300 shrink-0" />
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
  <Card className="bg-white/5 backdrop-blur-xl border-cyan-400/30">
    <CardContent className="p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400/30 to-teal-500/30 flex items-center justify-center">
        <Icon className="w-5 h-5 text-cyan-300" />
      </div>
      <div className="min-w-0">
        <p className="text-cyan-300/80 text-[10px] uppercase tracking-[0.25em] font-semibold">{label}</p>
        <p className="font-aqua text-xl text-white tracking-wider truncate">{value}</p>
      </div>
    </CardContent>
  </Card>
);

const ActionCard = ({
  icon: Icon, title, desc, cta, onClick, highlight,
}: { icon: any; title: string; desc: string; cta: string; onClick: () => void; highlight?: boolean }) => (
  <Card
    className={`bg-white/5 backdrop-blur-xl border transition-all cursor-pointer hover:scale-[1.01] ${
      highlight ? "border-cyan-400/60 glow-aqua" : "border-cyan-400/30 hover:border-cyan-400/50"
    }`}
    onClick={onClick}
  >
    <CardContent className="p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center glow-aqua shrink-0">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-aqua text-lg text-white tracking-wider">{title}</h3>
          <p className="text-cyan-100/70 text-sm">{desc}</p>
        </div>
      </div>
      <Button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold uppercase tracking-wider text-xs group"
      >
        {cta} <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
      </Button>
    </CardContent>
  </Card>
);

export default DashboardPage;
