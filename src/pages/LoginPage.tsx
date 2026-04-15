import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      setStep("otp");
      toast({ title: "OTP Sent! 📧", description: "Check your email for the 6-digit code." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to send OTP", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast({ title: "Invalid OTP", description: "Please enter the 6-digit code.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: "email" });
      if (error) throw error;
      toast({ title: "Welcome! 🎉", description: "You're now logged in." });
      navigate("/enroll");
    } catch (err: any) {
      toast({ title: "Verification failed", description: err.message || "Invalid or expired code.", variant: "destructive" });
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
              {step === "email" ? "LOGIN / SIGN UP" : "VERIFY OTP"}
            </CardTitle>
            <p className="text-muted-foreground text-sm mt-1">
              {step === "email"
                ? "Enter your email to receive a 6-digit verification code"
                : `Enter the 6-digit code sent to ${email}`}
            </p>
          </CardHeader>

          <CardContent className="space-y-5 pt-4">
            {step === "email" ? (
              <>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                    className="pl-11 bg-sport-dark/50 border-primary/30 text-sport-dark-foreground placeholder:text-muted-foreground/50 h-12 text-lg"
                  />
                </div>
                <Button
                  onClick={handleSendOtp}
                  disabled={loading || !email}
                  className="w-full bg-sport-energy hover:bg-sport-energy/90 text-sport-energy-foreground font-semibold uppercase tracking-wider h-12 text-sm group"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Send OTP <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </Button>
              </>
            ) : (
              <div className="space-y-5">
                <div className="flex justify-center">
                  <ShieldCheck className="w-12 h-12 text-primary" />
                </div>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground text-xl w-12 h-14" />
                      <InputOTPSlot index={1} className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground text-xl w-12 h-14" />
                      <InputOTPSlot index={2} className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground text-xl w-12 h-14" />
                      <InputOTPSlot index={3} className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground text-xl w-12 h-14" />
                      <InputOTPSlot index={4} className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground text-xl w-12 h-14" />
                      <InputOTPSlot index={5} className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground text-xl w-12 h-14" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-sport-energy hover:bg-sport-energy/90 text-sport-energy-foreground font-semibold uppercase tracking-wider h-12 text-sm group"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Verify & Continue <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </Button>
                <button
                  onClick={() => { setStep("email"); setOtp(""); }}
                  className="w-full text-sm text-primary hover:text-primary/80 transition-colors uppercase tracking-wider"
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
