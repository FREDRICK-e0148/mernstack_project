import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSendLink = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      setSent(true);
      toast({ title: "Link Sent! 📧", description: "Check your email and click the verification link." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to send link", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sport-dark flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 diagonal-stripe opacity-20" />
      <div className="absolute top-20 left-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-20 right-1/4 w-[300px] h-[300px] bg-accent/10 rounded-full blur-[100px]" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-secondary" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="font-display text-primary-foreground text-3xl leading-none">F</span>
          </div>
          <h1 className="font-display text-4xl text-sport-dark-foreground tracking-wider">FRIENDS</h1>
          <p className="text-primary text-sm uppercase tracking-[0.3em] font-semibold">Sports Academy</p>
        </div>

        <Card className="bg-card/10 backdrop-blur-lg border-primary/20">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-display text-3xl text-sport-dark-foreground tracking-wider">
              {sent ? "CHECK YOUR EMAIL" : "LOGIN"}
            </CardTitle>
            <p className="text-muted-foreground text-sm mt-1">
              {sent
                ? "We sent a magic link to your email. Click it to log in!"
                : "Enter your email to receive a login link"}
            </p>
          </CardHeader>

          <CardContent className="space-y-5 pt-4">
            {!sent ? (
              <>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendLink()}
                    className="pl-11 bg-sport-dark/50 border-primary/30 text-sport-dark-foreground placeholder:text-muted-foreground/50 h-12 text-lg"
                  />
                </div>
                <Button
                  onClick={handleSendLink}
                  disabled={loading || !email}
                  className="w-full bg-sport-energy hover:bg-sport-energy/90 text-sport-energy-foreground font-semibold uppercase tracking-wider h-12 text-sm group"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Send Login Link <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </Button>
              </>
            ) : (
              <div className="text-center space-y-4 py-4">
                <CheckCircle className="w-16 h-16 text-primary mx-auto" />
                <p className="text-sport-dark-foreground text-lg font-semibold">
                  Link sent to <span className="text-primary">{email}</span>
                </p>
                <p className="text-muted-foreground text-sm">
                  Open your email and click the login link. You'll be redirected back automatically.
                </p>
                <button
                  onClick={() => { setSent(false); setEmail(""); }}
                  className="text-sm text-primary hover:text-primary/80 transition-colors uppercase tracking-wider"
                >
                  ← Use a different email
                </button>
              </div>
            )}

            <p className="text-xs text-muted-foreground/60 text-center pt-2">
              By logging in, you agree to our Terms of Service and Privacy Policy
            </p>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <a href="/" className="text-sm text-primary hover:text-primary/80 transition-colors uppercase tracking-wider">
            ← Back to Home
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
