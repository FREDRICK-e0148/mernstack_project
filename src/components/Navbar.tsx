import { useState } from "react";
import { Menu, X, Phone, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Programs", href: "#programs" },
  { label: "About", href: "#about" },
  { label: "Coaches", href: "#coaches" },
  { label: "Gallery", href: "#gallery" },
  { label: "Contact", href: "#contact" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-sport-dark/95 backdrop-blur-md border-b border-primary/20">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <a href="#home" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <span className="font-display text-primary-foreground text-xl leading-none">F</span>
          </div>
          <div className="leading-tight">
            <span className="font-display text-xl text-primary-foreground tracking-wider">FRIENDS</span>
            <span className="block text-[10px] uppercase tracking-[0.25em] text-primary font-semibold -mt-1">Sports Academy</span>
          </div>
        </a>

        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
            >
              {link.label}
            </a>
          ))}
          <Button size="sm" className="bg-sport-energy hover:bg-sport-energy/90 text-sport-energy-foreground font-semibold uppercase tracking-wider text-xs">
            <Phone className="w-3 h-3 mr-1" /> Call Now
          </Button>
        </div>

        <button className="md:hidden text-primary-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-sport-dark border-t border-primary/20 overflow-hidden"
          >
            <div className="flex flex-col p-4 gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium text-muted-foreground hover:text-primary py-2 uppercase tracking-wider"
                >
                  {link.label}
                </a>
              ))}
              <Button size="sm" className="bg-sport-energy hover:bg-sport-energy/90 text-sport-energy-foreground font-semibold uppercase tracking-wider text-xs w-full mt-2">
                <Phone className="w-3 h-3 mr-1" /> Call Now
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
