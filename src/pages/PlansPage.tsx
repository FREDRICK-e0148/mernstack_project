import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ChevronRight, Trophy } from "lucide-react";
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
    <div className="min-h-screen relative px-4 py-12 overflow-hidden bg-sport-dark">
      {/* Diagonal stripes background — match homepage */}
      <div className="absolute inset-0 diagonal-stripe opacity-30" />
      {/* Accent blobs */}
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px]" />
      {/* Side color bar */}
      <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-primary via-accent to-secondary" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/30 rounded-full px-4 py-1.5 mb-5">
            <Trophy className="w-4 h-4 text-secondary fill-secondary" />
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Step 2 of 3 — Choose Plan</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-display text-sport-dark-foreground leading-[0.9] mb-3">
            CHOOSE YOUR <span className="text-gradient-sport">PLAN</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Pick the swimming plan that matches your goals — from beginner coaching to lifetime memberships.
          </p>
        </motion.div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {PLAN_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`px-4 py-2 rounded-md text-xs uppercase tracking-wider font-semibold transition-all ${
                activeCat === cat
                  ? "bg-sport-energy text-sport-energy-foreground"
                  : "bg-sport-dark-foreground/5 text-sport-dark-foreground/70 border border-sport-dark-foreground/15 hover:border-primary/50 hover:text-sport-dark-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Plans grid */}
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
                  className={`relative overflow-hidden transition-all border-2 ${
                    isSel
                      ? "bg-primary/10 border-primary shadow-[0_0_30px_hsl(var(--primary)/0.3)]"
                      : "bg-sport-dark-foreground/5 border-sport-dark-foreground/10 hover:border-primary/40"
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute top-0 right-0 bg-secondary text-secondary-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                      Best Value
                    </div>
                  )}
                  {/* Top accent line */}
                  <div className={`absolute top-0 left-0 h-1 transition-all ${isSel ? "w-full bg-gradient-to-r from-primary via-accent to-secondary" : "w-0"}`} />
                  <CardContent className="p-5">
                    <p className="text-primary text-[10px] uppercase tracking-[0.25em] font-semibold">{plan.duration}</p>
                    <h3 className="font-display text-2xl text-sport-dark-foreground tracking-wide leading-tight mt-1">{plan.name}</h3>
                    {plan.note && <p className="text-muted-foreground text-xs mt-2 italic">{plan.note}</p>}
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="font-display text-4xl text-gradient-sport">₹{plan.price.toLocaleString("en-IN")}</span>
                    </div>
                    {isSel && (
                      <div className="mt-3 flex items-center gap-1 text-primary text-xs uppercase tracking-wider font-semibold">
                        <Check className="w-4 h-4" /> Selected
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Sticky confirm bar */}
        <div className="sticky bottom-4 mt-10">
          <div className="bg-sport-dark/90 backdrop-blur-xl border border-primary/30 rounded-xl p-4 flex items-center justify-between shadow-[0_10px_40px_-10px_hsl(var(--primary)/0.4)]">
            <div>
              <p className="text-primary text-[10px] uppercase tracking-[0.3em] font-semibold">Selected Plan</p>
              <p className="text-sport-dark-foreground font-semibold">
                {selected ? `${selected.name} · ${selected.duration} · ₹${selected.price.toLocaleString("en-IN")}` : "None yet — pick one above"}
              </p>
            </div>
            <Button
              onClick={proceed}
              disabled={!selected}
              size="lg"
              className="bg-sport-energy hover:bg-sport-energy/90 text-sport-energy-foreground font-semibold uppercase tracking-wider text-sm px-6 group disabled:opacity-40"
            >
              Confirm & Pay <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlansPage;
