import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Banknote, Smartphone, Check, ArrowLeft, Loader2, CheckCircle, Waves } from "lucide-react";
import AquaBackground from "@/components/AquaBackground";
import { Plan } from "@/lib/plans";
import { useToast } from "@/hooks/use-toast";

type Method = "card" | "cash" | "gpay";

const methods: { id: Method; label: string; sub: string; icon: any }[] = [
  { id: "card", label: "Credit / Debit Card", sub: "Visa, Mastercard, Rupay", icon: CreditCard },
  { id: "gpay", label: "GPay / UPI", sub: "Pay with any UPI app", icon: Smartphone },
  { id: "cash", label: "Cash at Academy", sub: "Pay on your first visit", icon: Banknote },
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
    setProcessing(false);
    setDone(true);
    toast({ title: "Payment recorded! 🌊", description: method === "cash" ? "Pay at the academy on your first visit." : "We'll confirm your payment shortly." });
  };

  if (!plan) return null;

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-10 overflow-hidden">
      <AquaBackground bubbles={20} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center mx-auto mb-3 glow-aqua">
            <Waves className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-aqua text-3xl text-white tracking-wider">CHECKOUT</h1>
        </div>

        <Card className="bg-white/5 backdrop-blur-xl border-cyan-400/30 glow-aqua overflow-hidden">
          <AnimatePresence mode="wait">
            {!done ? (
              <motion.div key="pay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <CardHeader className="pb-2">
                  <CardTitle className="font-aqua text-xl text-white tracking-wider">ORDER SUMMARY</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="rounded-lg bg-slate-900/60 border border-cyan-400/20 p-4">
                    <p className="text-cyan-300 text-[10px] uppercase tracking-[0.3em]">{plan.category}</p>
                    <p className="text-white font-semibold mt-1">{plan.name}</p>
                    <p className="text-cyan-100/70 text-xs">{plan.duration}</p>
                    <div className="border-t border-cyan-400/20 mt-3 pt-3 flex items-baseline justify-between">
                      <span className="text-cyan-300 text-xs uppercase tracking-wider">Total</span>
                      <span className="font-aqua text-3xl text-gradient-aqua">₹{plan.price.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-cyan-300 text-[10px] uppercase tracking-[0.25em] mb-2">Payment Method</p>
                    <div className="space-y-2">
                      {methods.map((m) => {
                        const sel = method === m.id;
                        const Icon = m.icon;
                        return (
                          <button
                            key={m.id}
                            onClick={() => setMethod(m.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                              sel
                                ? "bg-gradient-to-r from-cyan-500/30 to-teal-500/20 border-cyan-300 glow-aqua"
                                : "bg-slate-900/60 border-cyan-400/20 hover:border-cyan-400/50"
                            }`}
                          >
                            <Icon className="w-5 h-5 text-cyan-300" />
                            <div className="flex-1">
                              <p className="text-white text-sm font-semibold">{m.label}</p>
                              <p className="text-cyan-100/60 text-xs">{m.sub}</p>
                            </div>
                            {sel && <Check className="w-5 h-5 text-cyan-300" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => navigate("/plans")}
                      className="border-cyan-400/40 bg-slate-900/40 text-cyan-200 hover:bg-cyan-500/20 hover:text-white uppercase tracking-wider text-xs flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" /> Change Plan
                    </Button>
                    <Button
                      onClick={handlePay}
                      disabled={!method || processing}
                      className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold uppercase tracking-wider text-xs flex-1"
                    >
                      {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : `Pay ₹${plan.price.toLocaleString("en-IN")}`}
                    </Button>
                  </div>
                </CardContent>
              </motion.div>
            ) : (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <CardContent className="text-center py-12 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 mx-auto flex items-center justify-center glow-aqua">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="font-aqua text-3xl text-gradient-aqua tracking-wider">ALL SET!</h2>
                  <p className="text-cyan-100/80">
                    {method === "cash"
                      ? "Visit the academy to complete your payment."
                      : "Your payment is being processed. We'll be in touch shortly."}
                  </p>
                  <Button
                    onClick={() => navigate("/")}
                    className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold uppercase tracking-wider text-sm mt-4"
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
