import { Waves } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-sport-dark py-12 border-t border-primary/20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Waves className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg text-sport-dark-foreground tracking-wider">FRIENDS SPORTS ACADEMY</span>
          </div>

          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#home" className="hover:text-primary transition-colors">Home</a>
            <a href="#programs" className="hover:text-primary transition-colors">Programs</a>
            <a href="#about" className="hover:text-primary transition-colors">About</a>
            <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
          </div>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Friends Sports Academy. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
