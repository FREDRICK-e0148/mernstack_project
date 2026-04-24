import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Check,
  ChevronRight,
  Trophy,
  Crown,
  CalendarRange,
  Waves,
  Zap,
  Sun,
  Dumbbell,
  Flame,
  Sparkles,
  ShieldCheck,
  Users,
  Clock,
} from "lucide-react";
import { PLANS, PLAN_CATEGORIES, Plan } from "@/lib/plans";

const CATEGORY_META: Record<
  string,
  { icon: any; tagline: string }
> = {
  "Memberships & Plans": { icon: Crown, tagline: "Long-term value · Family inclusive" },
  "Yearly Plans": { icon: CalendarRange, tagline: "Flexible annual access" },
  "Regular Coaching": { icon: Waves, tagline: "Structured learning programs" },
  "Advanced Coaching": { icon: Zap, tagline: "All four strokes mastered" },
  "Weekend Plans": { icon: Sun, tagline: "Perfect for busy schedules" },
  "Gym & Shuttle": { icon: Dumbbell, tagline: "Beyond the pool" },
  "Aqua Zumba": { icon: Flame, tagline: "Fitness · Fun · Ladies only" },
};

const PlansPage = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Plan | null>(null);
  const [activeCat, setActiveCat] = useState(PLAN_CATEGORIES[0]);

  const filtered = useMemo(() => PLANS.filter((p) => p.category === activeCat), [activeCat]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    PLANS.forEach((p) => {
      c[p.category] = (c[p.category] || 0) + 1;
    });
    return c;
  }, []);

  const minPrice = useMemo(() => Math.min(...filtered.map((p) => p.price)), [filtered]);

  const proceed = () => {
    if (!selected) return;
    sessionStorage.setItem("selectedPlan", JSON.stringify(selected));
    navigate("/payment");
  };

  const ActiveIcon = CATEGORY_META[activeCat]?.icon ?? Trophy;

  return (
    <div className="min-h-screen relative px-4 py-12 overflow-hidden bg-sport-dark">
      {/* Diagonal stripes background — match homepage */}
      <div className="absolute inset-0 diagonal-stripe opacity-30" />
      {/* Accent blobs */}
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[140px]" />
      {/* Side color bar */}
      <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-primary via-accent to-secondary" />
      <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-secondary via-accent to-primary opacity-60" />

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

          {/* Trust strip */}
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-[11px] uppercase tracking-wider">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sport-dark-foreground/5 border border-sport-dark-foreground/10 text-sport-dark-foreground/80">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" /> Certified Coaches
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sport-dark-foreground/5 border border-sport-dark-foreground/10 text-sport-dark-foreground/80">
              <Users className="w-3.5 h-3.5 text-primary" /> 5000+ Trained
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sport-dark-foreground/5 border border-sport-dark-foreground/10 text-sport-dark-foreground/80">
              <Sparkles className="w-3.5 h-3.5 text-secondary" /> Best Value Picks
            </div>
          </div>
        </motion.div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {PLAN_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_META[cat]?.icon ?? Trophy;
            const active = activeCat === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setActiveCat(cat);
                  setSelected(null);
                }}
                className={`group relative flex items-center gap-2 px-4 py-2 rounded-md text-xs uppercase tracking-wider font-semibold transition-all ${
                  active
                    ? "bg-sport-energy text-sport-energy-foreground shadow-[0_8px_25px_-8px_hsl(var(--sport-energy)/0.7)]"
                    : "bg-sport-dark-foreground/5 text-sport-dark-foreground/70 border border-sport-dark-foreground/15 hover:border-primary/50 hover:text-sport-dark-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat}
                <span className={`ml-1 px-1.5 py-0.5 rounded text-[9px] ${active ? "bg-sport-dark/30" : "bg-sport-dark-foreground/10"}`}>
                  {counts[cat]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Category header */}
        <motion.div
          key={activeCat}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 mb-5 p-4 rounded-xl bg-sport-dark-foreground/5 border border-sport-dark-foreground/10"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_8px_20px_-8px_hsl(var(--primary)/0.6)]">
              <ActiveIcon className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-display text-xl text-sport-dark-foreground tracking-wide leading-none">{activeCat}</p>
              <p className="text-muted-foreground text-xs mt-1">{CATEGORY_META[activeCat]?.tagline}</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] uppercase tracking-[0.25em] text-primary font-semibold">Starts From</p>
            <p className="font-display text-2xl text-gradient-sport leading-none">₹{minPrice.toLocaleString("en-IN")}</p>
          </div>
        </motion.div>

        {/* Plans grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCat}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filtered.map((plan, idx) => {
              const isSel = selected?.id === plan.id;
              const isCheapest = plan.price === minPrice && filtered.length > 1;
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  whileHover={{ y: -4 }}
                  onClick={() => setSelected(plan)}
                  className="cursor-pointer"
                >
                  <Card
                    className={`relative overflow-hidden transition-all border-2 h-full ${
                      isSel
                        ? "bg-primary/10 border-primary shadow-[0_0_30px_hsl(var(--primary)/0.3)]"
                        : "bg-sport-dark-foreground/5 border-sport-dark-foreground/10 hover:border-primary/40 hover:shadow-[0_10px_30px_-15px_hsl(var(--primary)/0.4)]"
                    }`}
                  >
                    {/* Corner badges */}
                    {plan.highlight && (
                      <div className="absolute top-0 right-0 bg-secondary text-secondary-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 flex items-center gap-1">
                        <Trophy className="w-3 h-3 fill-secondary-foreground" /> Best Value
                      </div>
                    )}
                    {!plan.highlight && isCheapest && (
                      <div className="absolute top-0 right-0 bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                        Lowest Price
                      </div>
                    )}

                    {/* Top accent line */}
                    <div className={`absolute top-0 left-0 h-1 transition-all ${isSel ? "w-full bg-gradient-to-r from-primary via-accent to-secondary" : "w-0"}`} />

                    {/* Diagonal watermark stripe */}
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />

                    <CardContent className="p-5 relative">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-primary text-[10px] uppercase tracking-[0.25em] font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {plan.duration}
                          </p>
                          <h3 className="font-display text-2xl text-sport-dark-foreground tracking-wide leading-tight mt-1">
                            {plan.name}
                          </h3>
                        </div>
                      </div>

                      {plan.note && (
                        <p className="text-muted-foreground text-xs mt-2 italic border-l-2 border-accent/50 pl-2">
                          {plan.note}
                        </p>
                      )}

                      <div className="mt-4 flex items-baseline gap-1">
                        <span className="font-display text-4xl text-gradient-sport">₹{plan.price.toLocaleString("en-IN")}</span>
                      </div>

                      {/* Mini feature list */}
                      <ul className="mt-3 space-y-1">
                        <li className="flex items-center gap-1.5 text-[11px] text-sport-dark-foreground/70">
                          <Check className="w-3 h-3 text-accent" /> Full access during plan
                        </li>
                        <li className="flex items-center gap-1.5 text-[11px] text-sport-dark-foreground/70">
                          <Check className="w-3 h-3 text-accent" /> Certified coach guidance
                        </li>
                      </ul>

                      {isSel ? (
                        <div className="mt-3 flex items-center gap-1 text-primary text-xs uppercase tracking-wider font-semibold">
                          <Check className="w-4 h-4" /> Selected
                        </div>
                      ) : (
                        <div className="mt-3 flex items-center gap-1 text-sport-dark-foreground/40 text-xs uppercase tracking-wider font-semibold group-hover:text-primary">
                          Tap to select <ChevronRight className="w-3 h-3" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Sticky confirm bar */}
        <div className="sticky bottom-4 mt-10">
          <div className="bg-sport-dark/90 backdrop-blur-xl border border-primary/30 rounded-xl p-4 flex items-center justify-between shadow-[0_10px_40px_-10px_hsl(var(--primary)/0.4)] gap-3">
            <div className="min-w-0">
              <p className="text-primary text-[10px] uppercase tracking-[0.3em] font-semibold">Selected Plan</p>
              <p className="text-sport-dark-foreground font-semibold truncate">
                {selected ? `${selected.name} · ${selected.duration} · ₹${selected.price.toLocaleString("en-IN")}` : "None yet — pick one above"}
              </p>
            </div>
            <Button
              onClick={proceed}
              disabled={!selected}
              size="lg"
              className="bg-sport-energy hover:bg-sport-energy/90 text-sport-energy-foreground font-semibold uppercase tracking-wider text-sm px-6 group disabled:opacity-40 shrink-0"
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
