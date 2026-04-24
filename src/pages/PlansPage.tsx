import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Waves } from "lucide-react";
import AquaBackground from "@/components/AquaBackground";
import { PLANS, PLAN_CATEGORIES, Plan } from "@/lib/plans";

const PlansPage = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Plan | null>(null);
  const [activeCat, setActiveCat] = useState(PLAN_CATEGORIES[0]);

  const filtered = PLANS.filter((p) => p.category === activeCat);

  const proceed = () => {
    if (!selected) return;
    sessionStorage.setItem("selectedPlan", JSON.stringify(selected));
    navigate("/payment");
  };

  return (
    <div className="min-h-screen relative px-4 py-10 overflow-hidden">
      <AquaBackground bubbles={22} />
      <div className="relative z-10 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center mx-auto mb-3 glow-aqua">
            <Waves className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-aqua text-4xl text-white tracking-wider">CHOOSE YOUR PLAN</h1>
          <p className="text-cyan-100/70 text-sm mt-2">Pick the swimming plan that matches your goals.</p>
        </motion.div>

        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {PLAN_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wider font-semibold transition-all ${
                activeCat === cat
                  ? "bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-900"
                  : "bg-slate-900/40 text-cyan-200 border border-cyan-400/30 hover:bg-cyan-500/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((plan) => {
            const isSel = selected?.id === plan.id;
            return (
              <motion.div
                key={plan.id}
                whileHover={{ y: -4 }}
                onClick={() => setSelected(plan)}
                className="cursor-pointer"
              >
                <Card
                  className={`relative overflow-hidden transition-all ${
                    isSel
                      ? "bg-gradient-to-br from-cyan-500/30 to-teal-500/20 border-cyan-300 glow-aqua"
                      : "bg-white/5 backdrop-blur-xl border-cyan-400/20 hover:border-cyan-400/50"
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-400 to-orange-400 text-slate-900 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-bl-lg">
                      Best Value
                    </div>
                  )}
                  <CardContent className="p-5">
                    <h3 className="font-aqua text-lg text-white tracking-wider leading-tight">{plan.name}</h3>
                    <p className="text-cyan-300 text-[10px] uppercase tracking-[0.25em] mt-1">{plan.duration}</p>
                    {plan.note && <p className="text-cyan-100/60 text-xs mt-2 italic">{plan.note}</p>}
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="font-aqua text-3xl text-gradient-aqua">₹{plan.price.toLocaleString("en-IN")}</span>
                    </div>
                    {isSel && (
                      <div className="mt-3 flex items-center gap-1 text-cyan-300 text-xs uppercase tracking-wider font-semibold">
                        <Check className="w-4 h-4" /> Selected
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="sticky bottom-4 mt-8">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-cyan-400/30 rounded-2xl p-4 flex items-center justify-between glow-aqua">
            <div>
              <p className="text-cyan-300 text-[10px] uppercase tracking-[0.3em]">Selected Plan</p>
              <p className="text-white font-semibold">
                {selected ? `${selected.name} · ${selected.duration} · ₹${selected.price.toLocaleString("en-IN")}` : "None yet — pick one above"}
              </p>
            </div>
            <Button
              onClick={proceed}
              disabled={!selected}
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold uppercase tracking-wider text-xs group disabled:opacity-40"
            >
              Confirm & Pay <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlansPage;
