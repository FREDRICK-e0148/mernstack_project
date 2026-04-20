import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Shield, Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ADMIN_EMAIL = "fsa@321.com";
const ADMIN_PASSWORD = "fsa@321";

const AdminLoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    try {
      // Accept either "fsa@321" or full email
      const email = username.includes("@") && username.includes(".")
        ? username
        : ADMIN_EMAIL;

      // Try login first
      let { error } = await supabase.auth.signInWithPassword({ email, password });

      // If user doesn't exist & this is the default admin, sign them up
      if (error && email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (signUpError) throw signUpError;
        // Sign in after signup
        const retry = await supabase.auth.signInWithPassword({ email, password });
        if (retry.error) throw retry.error;
      } else if (error) {
        throw error;
      }

      // Check role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Login failed");

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roles) {
        await supabase.auth.signOut();
        throw new Error("You do not have admin access.");
      }

      toast({ title: "Welcome, Admin! 🛡️", description: "Redirecting to dashboard..." });
      navigate("/admin");
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sport-dark flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 diagonal-stripe opacity-20" />
      <div className="absolute top-20 left-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-secondary" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-sport-energy flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-sport-energy-foreground" />
          </div>
          <h1 className="font-display text-4xl text-sport-dark-foreground tracking-wider">ADMIN PORTAL</h1>
          <p className="text-primary text-sm uppercase tracking-[0.3em] font-semibold">Friends Sports Academy</p>
        </div>

        <Card className="bg-card/10 backdrop-blur-lg border-primary/20">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-display text-3xl text-sport-dark-foreground tracking-wider">SIGN IN</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">Authorized personnel only</p>
          </CardHeader>

          <CardContent className="space-y-5 pt-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Username</label>
              <Input
                type="text"
                placeholder="fsa@321"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground h-12"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground h-12"
              />
            </div>
            <Button
              onClick={handleLogin}
              disabled={loading || !username || !password}
              className="w-full bg-sport-energy hover:bg-sport-energy/90 text-sport-energy-foreground font-semibold uppercase tracking-wider h-12 text-sm group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" /></>
              )}
            </Button>
            <p className="text-xs text-muted-foreground/60 text-center pt-2">
              Default credentials: <span className="text-primary">fsa@321</span> / <span className="text-primary">fsa@321</span>
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

export default AdminLoginPage;
