import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Phone, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const LoginPage = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const formatPhone = (value: string) => {
    // Keep only digits
    const digits = value.replace(/\D/g, "");
    return digits;
  };

  const getFullPhone = () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
    if (digits.length === 10) return `+91${digits}`;
    return `+${digits}`;
  };

  const handleSendOtp = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      toast({ title: "Invalid number", description: "Please enter a valid 10-digit mobile number.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: getFullPhone() });
      if (error) throw error;
      setStep("otp");
      toast({ title: "OTP Sent! 📱", description: "Check your phone for the verification code." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to send OTP", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      toast({ title: "Invalid OTP", description: "Please enter the 6-digit code.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: getFullPhone(),
        token: otp,
        type: "sms",
      });
      if (error) throw error;
      toast({ title: "Welcome! 🎉", description: "You're now logged in." });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Verification Failed", description: err.message || "Invalid OTP", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sport-dark flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background effects */}
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
              {step === "phone" ? "LOGIN" : "VERIFY OTP"}
            </CardTitle>
            <p className="text-muted-foreground text-sm mt-1">
              {step === "phone"
                ? "Enter your mobile number to receive an OTP"
                : "Enter the 6-digit code sent to your phone"}
            </p>
          </CardHeader>

          <CardContent className="space-y-5 pt-4">
            {step === "phone" ? (
              <>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                  <span className="absolute left-10 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">+91</span>
                  <Input
                    type="tel"
                    placeholder="Enter 10-digit number"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    maxLength={10}
                    className="pl-[4.5rem] bg-sport-dark/50 border-primary/30 text-sport-dark-foreground placeholder:text-muted-foreground/50 h-12 text-lg tracking-wider"
                  />
                </div>
                <Button
                  onClick={handleSendOtp}
                  disabled={loading || phone.replace(/\D/g, "").length < 10}
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
              <>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-accent" />
                  <Input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    className="pl-11 bg-sport-dark/50 border-primary/30 text-sport-dark-foreground placeholder:text-muted-foreground/50 h-12 text-2xl tracking-[0.5em] text-center font-mono"
                  />
                </div>
                <Button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length < 6}
                  className="w-full bg-sport-energy hover:bg-sport-energy/90 text-sport-energy-foreground font-semibold uppercase tracking-wider h-12 text-sm group"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Verify & Login <ShieldCheck className="w-4 h-4 ml-1" /></>
                  )}
                </Button>
                <button
                  onClick={() => { setStep("phone"); setOtp(""); }}
                  className="w-full text-sm text-primary hover:text-primary/80 transition-colors uppercase tracking-wider"
                >
                  ← Change Number
                </button>
              </>
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
