import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { User, Lock, ArrowRight, Loader2, Waves } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import AquaBackground from "@/components/AquaBackground";

const toEmail = (username: string) => {
  const u = username.trim().toLowerCase();
  if (!u) return "";
  if (u.includes("@")) return u;
  // Map plain usernames -> deterministic email so Supabase accepts it
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
    if (user) navigate("/enroll");
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
      // Try sign-in first
      let { error } = await supabase.auth.signInWithPassword({ email, password });

      // If account doesn't exist -> auto sign up, then sign in
      if (error && /invalid login credentials|invalid_credentials|user not found/i.test(error.message)) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/enroll` },
        });
        if (signUpError) throw signUpError;
        const retry = await supabase.auth.signInWithPassword({ email, password });
        if (retry.error) throw retry.error;
        toast({ title: "Account created! 🌊", description: "Welcome aboard." });
      } else if (error) {
        throw error;
      } else {
        toast({ title: "Welcome back! 🌊" });
      }
      navigate("/enroll");
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-10 overflow-hidden">
      <AquaBackground bubbles={22} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center mx-auto mb-4 glow-aqua">
            <Waves className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-aqua text-4xl text-white tracking-wider">FRIENDS SPORTS</h1>
          <p className="text-cyan-300 text-xs uppercase tracking-[0.4em] font-semibold mt-1">Aquatic Academy</p>
        </div>

        <Card className="bg-white/5 backdrop-blur-xl border-cyan-400/30 glow-aqua">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-aqua text-2xl text-white tracking-wider">DIVE IN</CardTitle>
            <p className="text-cyan-100/70 text-sm mt-1">
              Sign in or create your account — it's instant.
            </p>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-[10px] uppercase tracking-[0.25em] text-cyan-300 mb-1 block">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                  <Input
                    type="text"
                    autoComplete="username"
                    placeholder="swimmer123"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-11 bg-slate-900/60 border-cyan-400/30 text-white placeholder:text-cyan-100/30 h-12"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.25em] text-cyan-300 mb-1 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                  <Input
                    type="password"
                    autoComplete="current-password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 bg-slate-900/60 border-cyan-400/30 text-white placeholder:text-cyan-100/30 h-12"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold uppercase tracking-wider h-12 text-sm group glow-aqua"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>Continue <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" /></>
                )}
              </Button>
              <p className="text-[11px] text-cyan-100/50 text-center">
                New here? Just enter a username + password — we'll create your account automatically.
              </p>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <a href="/" className="text-sm text-cyan-300 hover:text-cyan-200 transition-colors uppercase tracking-wider">
            ← Back to Home
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
