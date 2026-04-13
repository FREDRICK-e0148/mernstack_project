import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

const highlights = [
  "Olympic-size & learner pools",
  "Certified & experienced coaches",
  "Small batch sizes (max 8 per coach)",
  "Temperature-controlled water",
  "Video analysis for technique",
  "Annual swimming competitions",
];

const AboutSection = () => {
  return (
    <section id="about" className="py-20 bg-muted/50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-secondary" />

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Visual side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-sport-dark rounded-2xl p-8 relative overflow-hidden">
              <div className="diagonal-stripe absolute inset-0 opacity-20" />
              <div className="relative z-10 text-center py-12">
                <span className="text-8xl mb-4 block">🏆</span>
                <h3 className="font-display text-4xl text-sport-dark-foreground mb-2">15+ YEARS</h3>
                <p className="text-primary text-lg font-semibold uppercase tracking-wider">Of Excellence in Swimming</p>
                <div className="flex justify-center gap-6 mt-8">
                  <div>
                    <div className="font-display text-3xl text-secondary">50+</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Medal Winners</div>
                  </div>
                  <div className="w-px bg-primary/30" />
                  <div>
                    <div className="font-display text-3xl text-accent">12</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Expert Coaches</div>
                  </div>
                  <div className="w-px bg-primary/30" />
                  <div>
                    <div className="font-display text-3xl text-sport-energy">6</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Pool Lanes</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Text side */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Badge variant="outline" className="mb-4 uppercase tracking-widest text-xs border-primary/40 text-primary">
              About Us
            </Badge>
            <h2 className="text-5xl md:text-6xl font-display text-foreground mb-6">
              BUILT FOR <span className="text-gradient-sport">CHAMPIONS</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Friends Sports Academy has been shaping swimmers in Chennai since 2009. Located in the heart of Mugalivakkam, 
              we provide world-class training facilities and a pathway from water confidence to competitive excellence. 
              Our coaches are nationally certified with decades of combined experience.
            </p>

            <div className="grid sm:grid-cols-2 gap-3">
              {highlights.map((item) => (
                <div key={item} className="flex items-center gap-3 bg-card rounded-lg p-3 border border-border/60">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
