import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight, Star, Trophy, Users, LogIn, UserPlus, Phone, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import heroSwimmer from "@/assets/hero-swimmer.jpg";
import { trackContactClick } from "@/lib/track";

const HeroSection = () => {
  const [authOpen, setAuthOpen] = useState(false);
  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden bg-sport-dark">
      {/* Background swimmer image */}
      <div
        className="absolute inset-0 bg-cover bg-center sm:bg-center opacity-50 sm:opacity-40"
        style={{ backgroundImage: `url(${heroSwimmer})`, backgroundPosition: "70% center" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-sport-dark/70 via-sport-dark/85 to-sport-dark sm:bg-gradient-to-r sm:from-sport-dark sm:via-sport-dark/80 sm:to-sport-dark/40" />
      {/* Diagonal stripes background */}
      <div className="absolute inset-0 diagonal-stripe opacity-20" />
      
      {/* Dynamic accent shapes */}
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px]" />
      
      {/* Angled color bar */}
      <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-primary via-accent to-secondary" />

      <div className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/30 rounded-full px-4 py-1.5 mb-6">
              <Star className="w-4 h-4 text-secondary fill-secondary" />
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">4.1 ★ Rated — 261 Reviews</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-display text-sport-dark-foreground leading-[0.9] mb-4 sm:mb-6">
              DIVE INTO
              <br />
              <span className="text-gradient-sport">GREATNESS</span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-lg mb-6 sm:mb-8 leading-relaxed">
              Chennai's premier swimming academy. From beginners to competitive athletes — train with certified coaches in world-class facilities at Mugalivakkam.
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-8 sm:mb-10">
              <Button
                size="lg"
                onClick={() => setAuthOpen(true)}
                className="w-full sm:w-auto bg-sport-energy hover:bg-sport-energy/90 text-sport-energy-foreground font-semibold uppercase tracking-wider text-sm px-8 group"
              >
                Enroll Now <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto bg-[#25D366] hover:bg-[#25D366]/90 text-white font-semibold uppercase tracking-wider text-sm px-6"
              >
                <a
                  href="https://wa.me/919876543210?text=Hi%2C%20I%27m%20interested%20in%20joining%20Friends%20Sports%20Academy"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Chat on WhatsApp"
                  onClick={() => trackContactClick("whatsapp")}
                >
                  <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-primary/40 text-primary hover:bg-primary/10 font-semibold uppercase tracking-wider text-sm px-6"
              >
                <a href="tel:+919876543210" aria-label="Call Friends Sports Academy" onClick={() => trackContactClick("call")}>
                  <Phone className="w-4 h-4 mr-2" /> Call Now
                </a>
              </Button>
            </div>

            <Dialog open={authOpen} onOpenChange={setAuthOpen}>
              <DialogContent className="bg-sport-dark border-primary/30 text-sport-dark-foreground max-w-[92vw] sm:max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl sm:text-3xl tracking-wider text-center">
                    JOIN THE <span className="text-gradient-sport">ACADEMY</span>
                  </DialogTitle>
                  <DialogDescription className="text-center text-muted-foreground text-sm">
                    Already have an account, or new here? Pick one to continue.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <Link to="/login?mode=login" onClick={() => setAuthOpen(false)} className="w-full">
                    <Button className="w-full h-12 sm:h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold uppercase tracking-wider">
                      <LogIn className="w-4 h-4 mr-2" /> Login
                    </Button>
                  </Link>
                  <Link to="/login?mode=signup" onClick={() => setAuthOpen(false)} className="w-full">
                    <Button className="w-full h-12 sm:h-14 bg-sport-energy hover:bg-sport-energy/90 text-sport-energy-foreground font-semibold uppercase tracking-wider">
                      <UserPlus className="w-4 h-4 mr-2" /> Sign Up
                    </Button>
                  </Link>
                </div>
              </DialogContent>
            </Dialog>

            {/* Stats */}
            <div className="flex gap-4 sm:gap-8 flex-wrap">
              {[
                { icon: Users, value: "2500+", label: "Students Trained" },
                { icon: Trophy, value: "15+", label: "Years Experience" },
                { icon: Star, value: "98%", label: "Satisfaction" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <stat.icon className="w-5 h-5 text-primary mx-auto mb-1" />
                  <div className="font-display text-xl sm:text-2xl text-sport-dark-foreground">{stat.value}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative w-full aspect-square">
              {/* Orbit ring */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/15 animate-spin" style={{ animationDuration: "30s" }} />
              <div className="absolute inset-8 rounded-full border-4 border-primary/30" />
              {/* Accent dots */}
              <div className="absolute top-4 left-1/2 w-4 h-4 bg-secondary rounded-full" />
              <div className="absolute bottom-12 right-8 w-3 h-3 bg-accent rounded-full" />
              <div className="absolute top-1/3 left-4 w-2 h-2 bg-sport-energy rounded-full" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" className="w-full">
          <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z" fill="hsl(var(--background))" />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
