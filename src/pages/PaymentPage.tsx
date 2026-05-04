import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Banknote,
  Smartphone,
  Check,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Trophy,
  Lock,
  ShieldCheck,
  Sparkles,
  BadgePercent,
} from "lucide-react";
import { Plan } from "@/lib/plans";
import { planDurationDays } from "@/lib/diet";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Method = "card" | "cash" | "gpay";

const methods: { id: Method; label: string; sub: string; icon: any; tag?: string }[] = [
  { id: "card", label: "Credit / Debit Card", sub: "Visa, Mastercard, Rupay", icon: CreditCard, tag: "Secure" },
  { id: "gpay", label: "GPay / UPI", sub: "Pay with any UPI app", icon: Smartphone, tag: "Instant" },
  { id: "cash", label: "Cash at Academy", sub: "Pay on your first visit", icon: Banknote, tag: "On-site" },
];

const PaymentPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [method, setMethod] = useState<Method | null>(null);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("selectedPlan");
    if (!raw) {
      navigate("/plans");
      return;
    }
    setPlan(JSON.parse(raw));
  }, [navigate]);

  const handlePay = async () => {
    if (!method || !plan) return;
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1400));
    const paidAt = new Date();
    const durationDays = planDurationDays(plan.duration);
    const expiresAt = new Date(paidAt.getTime() + durationDays * 86400000);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("paid_plans").insert({
          user_id: user.id,
          plan_id: plan.id,
          plan_name: plan.name,
          plan_category: plan.category,
          plan_duration: plan.duration,
          plan_price: plan.price,
          payment_method: method,
          paid_at: paidAt.toISOString(),
          duration_days: durationDays,
          expires_at: expiresAt.toISOString(),
        });
      }
      localStorage.setItem(
        "paidPlan",
        JSON.stringify({ plan, method, paidAt: paidAt.toISOString(), durationDays, expiresAt: expiresAt.toISOString() })
      );
      sessionStorage.removeItem("selectedPlan");
    } catch (e) {
      console.error("Failed to persist paid plan", e);
    }
    setProcessing(false);
    setDone(true);
    toast({
      title: "Payment recorded!",
      description: method === "cash" ? "Pay at the academy on your first visit." : "We'll confirm your payment shortly.",
    });
  };

  if (!plan) return null;

  const tax = Math.round(plan.price * 0.0); // displayed for transparency; no GST applied
  const total = plan.price + tax;

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-10 overflow-hidden bg-sport-dark">
      {/* Diagonal stripes background — match homepage */}
      <div className="absolute inset-0 diagonal-stripe opacity-30" />
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px]" />
      <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-primary via-accent to-secondary" />
      <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-secondary via-accent to-primary opacity-60" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/30 rounded-full px-4 py-1.5 mb-4">
            <Trophy className="w-4 h-4 text-secondary fill-secondary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Step 3 of 3 — Payment</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display text-sport-dark-foreground tracking-wide">
            <span className="text-gradient-sport">CHECKOUT</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2 flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-accent" /> Secure & encrypted
          </p>
        </div>

        <Card className="bg-sport-dark-foreground/5 backdrop-blur-xl border-2 border-primary/30 overflow-hidden shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.4)]">
          <div className="h-1 bg-gradient-to-r from-primary via-accent to-secondary" />
          <AnimatePresence mode="wait">
            {!done ? (
              <motion.div key="pay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-2xl text-sport-dark-foreground tracking-wide flex items-center gap-2">
                    <BadgePercent className="w-5 h-5 text-secondary" /> ORDER SUMMARY
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="rounded-lg bg-sport-dark/60 border border-primary/20 p-4 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
                    <div className="flex items-start justify-between gap-2 relative">
                      <div>
                        <p className="text-primary text-[10px] uppercase tracking-[0.3em] font-semibold">{plan.category}</p>
                        <p className="text-sport-dark-foreground font-semibold mt-1">{plan.name}</p>
                        <p className="text-muted-foreground text-xs">{plan.duration}</p>
                      </div>
                      {plan.highlight && (
                        <span className="bg-secondary text-secondary-foreground text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                          Best Value
                        </span>
                      )}
                    </div>

                    <div className="border-t border-primary/20 mt-3 pt-3 space-y-1.5 relative">
                      <div className="flex items-center justify-between text-xs text-sport-dark-foreground/70">
                        <span>Subtotal</span>
                        <span>₹{plan.price.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-sport-dark-foreground/70">
                        <span>Taxes & fees</span>
                        <span className="text-accent">Included</span>
                      </div>
                      <div className="flex items-baseline justify-between pt-2 border-t border-primary/10">
                        <span className="text-primary text-xs uppercase tracking-wider font-semibold">Total</span>
                        <span className="font-display text-3xl text-gradient-sport">₹{total.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-primary text-[10px] uppercase tracking-[0.25em] mb-2 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Payment Method
                    </p>
                    <div className="space-y-2">
                      {methods.map((m) => {
                        const sel = method === m.id;
                        const Icon = m.icon;
                        return (
                          <button
                            key={m.id}
                            onClick={() => setMethod(m.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left relative overflow-hidden ${
                              sel
                                ? "bg-primary/10 border-primary shadow-[0_0_20px_-5px_hsl(var(--primary)/0.5)]"
                                : "bg-sport-dark/60 border-sport-dark-foreground/10 hover:border-primary/40"
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-md flex items-center justify-center ${sel ? "bg-gradient-to-br from-primary to-accent" : "bg-sport-dark-foreground/5"}`}>
                              <Icon className={`w-5 h-5 ${sel ? "text-primary-foreground" : "text-primary"}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sport-dark-foreground text-sm font-semibold">{m.label}</p>
                                {m.tag && (
                                  <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-accent/15 text-accent border border-accent/30">
                                    {m.tag}
                                  </span>
                                )}
                              </div>
                              <p className="text-muted-foreground text-xs">{m.sub}</p>
                            </div>
                            {sel && <Check className="w-5 h-5 text-primary" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Trust footer */}
                  <div className="flex items-center justify-center gap-4 text-[10px] uppercase tracking-wider text-sport-dark-foreground/50">
                    <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-accent" /> SSL Secure</span>
                    <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-primary" /> Private</span>
                    <span className="flex items-center gap-1"><Check className="w-3 h-3 text-secondary" /> Verified</span>
                  </div>

                  <div className="flex gap-3 pt-1">
                    <Button
                      variant="outline"
                      onClick={() => navigate("/plans")}
                      className="border-primary/40 bg-transparent text-sport-dark-foreground hover:bg-primary/10 hover:text-sport-dark-foreground uppercase tracking-wider text-xs flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" /> Change Plan
                    </Button>
                    <Button
                      onClick={handlePay}
                      disabled={!method || processing}
                      className="bg-sport-energy hover:bg-sport-energy/90 text-sport-energy-foreground font-semibold uppercase tracking-wider text-xs flex-1 shadow-[0_8px_25px_-8px_hsl(var(--sport-energy)/0.7)]"
                    >
                      {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : `Pay ₹${total.toLocaleString("en-IN")}`}
                    </Button>
                  </div>
                </CardContent>
              </motion.div>
            ) : (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <CardContent className="text-center py-12 space-y-4">
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent mx-auto flex items-center justify-center shadow-[0_0_40px_hsl(var(--primary)/0.6)]"
                  >
                    <CheckCircle className="w-10 h-10 text-primary-foreground" />
                  </motion.div>
                  <h2 className="font-display text-4xl text-gradient-sport tracking-wide">ALL SET!</h2>
                  <p className="text-muted-foreground">
                    {method === "cash"
                      ? "Visit the academy to complete your payment."
                      : "Your payment is being processed. We'll be in touch shortly."}
                  </p>
                  <div className="rounded-lg bg-sport-dark/60 border border-primary/20 p-3 max-w-xs mx-auto text-left">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-primary font-semibold">Confirmation</p>
                    <p className="text-sport-dark-foreground text-sm font-semibold mt-1">{plan.name}</p>
                    <p className="text-muted-foreground text-xs">{plan.duration} · ₹{total.toLocaleString("en-IN")}</p>
                  </div>
                  <Button
                    onClick={() => navigate("/")}
                    className="bg-sport-energy hover:bg-sport-energy/90 text-sport-energy-foreground font-semibold uppercase tracking-wider text-sm mt-4"
                  >
                    Back to Home
                  </Button>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
};

export default PaymentPage;
