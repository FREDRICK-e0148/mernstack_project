import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Baby, Waves, Zap, Medal, Heart, Clock } from "lucide-react";

const programs = [
  {
    icon: Baby,
    title: "LITTLE SPLASHERS",
    age: "3–6 yrs",
    desc: "Water confidence & basic strokes in a fun, safe environment. Parent-assisted options available.",
    color: "text-secondary",
    tag: "Beginner",
  },
  {
    icon: Waves,
    title: "STROKE BUILDERS",
    age: "7–12 yrs",
    desc: "Master all four competitive strokes with proper technique. Build endurance and pool etiquette.",
    color: "text-primary",
    tag: "Intermediate",
  },
  {
    icon: Zap,
    title: "SPEED SQUAD",
    age: "13–18 yrs",
    desc: "Competition-ready training with race strategy, starts, turns, and interval workouts.",
    color: "text-sport-energy",
    tag: "Advanced",
  },
  {
    icon: Medal,
    title: "ELITE SQUAD",
    age: "Competitive",
    desc: "For state and national level swimmers. Periodized training, video analysis, and meet preparation.",
    color: "text-accent",
    tag: "Pro",
  },
  {
    icon: Heart,
    title: "ADULT FITNESS",
    age: "18+ yrs",
    desc: "Improve fitness, learn to swim, or refine technique. Flexible morning and evening batches.",
    color: "text-primary",
    tag: "All Levels",
  },
  {
    icon: Clock,
    title: "WEEKEND CRASH",
    age: "All Ages",
    desc: "Intensive weekend-only program. Perfect for busy schedules. Accelerated learning format.",
    color: "text-secondary",
    tag: "Special",
  },
];

const ProgramsSection = () => {
  return (
    <section id="programs" className="py-20 bg-background relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <Badge variant="outline" className="mb-4 uppercase tracking-widest text-xs border-primary/40 text-primary">
            Training Programs
          </Badge>
          <h2 className="text-5xl md:text-6xl font-display text-foreground">
            CHOOSE YOUR <span className="text-gradient-sport">LANE</span>
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Structured programs for every age and skill level. All coached by certified professionals.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((prog, i) => (
            <motion.div
              key={prog.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-border/60 h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center ${prog.color}`}>
                      <prog.icon className="w-6 h-6" />
                    </div>
                    <Badge variant="secondary" className="text-xs uppercase tracking-wider font-semibold">
                      {prog.tag}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-display tracking-wider">{prog.title}</CardTitle>
                  <span className="text-sm font-semibold text-primary">{prog.age}</span>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{prog.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProgramsSection;
