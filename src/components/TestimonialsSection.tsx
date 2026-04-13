import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Priya Ramanathan",
    role: "Parent of 8-year-old",
    text: "My son couldn't even float 6 months ago. Now he's competing at district level! The coaches are incredibly patient and skilled.",
    rating: 5,
  },
  {
    name: "Karthik Venkatesh",
    role: "Adult Learner",
    text: "At 35, I learned to swim here. The adult batch is pressure-free and the coaches make it so comfortable. Highly recommended!",
    rating: 5,
  },
  {
    name: "Deepa Krishnan",
    role: "Parent of twins",
    text: "Both my kids train here. The facility is clean, well-maintained, and the coaching methodology is systematic and professional.",
    rating: 4,
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-20 bg-sport-dark relative overflow-hidden">
      <div className="diagonal-stripe absolute inset-0 opacity-20" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary via-primary to-accent" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <Badge variant="outline" className="mb-4 uppercase tracking-widest text-xs border-primary/40 text-primary">
            Testimonials
          </Badge>
          <h2 className="text-5xl md:text-6xl font-display text-sport-dark-foreground">
            WHAT <span className="text-gradient-sport">SWIMMERS</span> SAY
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <Card className="bg-card/10 backdrop-blur border-primary/20 h-full">
                <CardContent className="pt-6">
                  <Quote className="w-8 h-8 text-primary/40 mb-4" />
                  <p className="text-sport-dark-foreground/80 leading-relaxed mb-6 text-sm">"{t.text}"</p>
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`w-4 h-4 ${idx < t.rating ? "text-secondary fill-secondary" : "text-muted-foreground/30"}`}
                      />
                    ))}
                  </div>
                  <div>
                    <div className="font-semibold text-sport-dark-foreground text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
