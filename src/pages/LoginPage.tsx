import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { User, Lock, ArrowRight, Loader2, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const toEmail = (username: string) => {
  const u = username.trim().toLowerCase();
  if (!u) return "";
  if (u.includes("@")) return u;
  const safe = u.replace(/[^a-z0-9._-]/g, "_");
  return `${safe}@fsa.user`;
};

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || password.length < 6) {
      toast({
        title: "Missing info",
        description: "Username required and password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    const email = toEmail(username);
    try {
      let { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error && /invalid login credentials|invalid_credentials|user not found/i.test(error.message)) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (signUpError) throw signUpError;
        const retry = await supabase.auth.signInWithPassword({ email, password });
        if (retry.error) throw retry.error;
        toast({ title: "Account created!", description: "Welcome aboard." });
      } else if (error) {
        throw error;
      } else {
        toast({ title: "Welcome back!" });
      }
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-10 overflow-hidden bg-sport-dark">
      <div className="absolute inset-0 diagonal-stripe opacity-30" />
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px]" />
      <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-primary via-accent to-secondary" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/40">
            <Trophy className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="font-display text-5xl text-sport-dark-foreground tracking-wider">
            FRIENDS <span className="text-gradient-sport">SPORTS</span>
          </h1>
          <p className="text-secondary text-xs uppercase tracking-[0.4em] font-semibold mt-2">Aquatic Academy</p>
        </div>

        <Card className="bg-card/5 backdrop-blur-xl border-primary/30">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-display text-3xl text-sport-dark-foreground tracking-wider">DIVE IN</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">
              Sign in or create your account — it's instant.
            </p>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-[10px] uppercase tracking-[0.25em] text-primary mb-1 block font-semibold">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                  <Input
                    type="text"
                    autoComplete="username"
                    placeholder="swimmer123"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-11 bg-sport-dark/60 border-primary/30 text-sport-dark-foreground placeholder:text-muted-foreground/50 h-12"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.25em] text-primary mb-1 block font-semibold">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                  <Input
                    type="password"
                    autoComplete="current-password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 bg-sport-dark/60 border-primary/30 text-sport-dark-foreground placeholder:text-muted-foreground/50 h-12"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-sport-energy hover:bg-sport-energy/90 text-sport-energy-foreground font-semibold uppercase tracking-wider h-12 text-sm group"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>Continue <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" /></>
                )}
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">
                New here? Just enter a username + password — we'll create your account automatically.
              </p>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <a href="/" className="text-sm text-primary hover:text-primary/80 transition-colors uppercase tracking-wider font-semibold">
            ← Back to Home
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
