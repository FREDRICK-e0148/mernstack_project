import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  Upload,
  CheckCircle,
  UserPlus,
  Waves,
  LogOut,
  Minus,
  Plus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CandidateForm {
  name: string;
  dob: string;
  gender: "" | "male" | "female" | "other";
  contact_no: string;
  address: string;
  email: string;
  photo: File | null;
  photoPreview: string;
  height: string;
  weight: string;
}

const emptyCandidateForm = (): CandidateForm => ({
  name: "",
  dob: "",
  gender: "",
  contact_no: "",
  address: "",
  email: "",
  photo: null,
  photoPreview: "",
  height: "",
  weight: "",
});

const calcAge = (dob: string) => {
  if (!dob) return "";
  const d = new Date(dob);
  if (isNaN(d.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age >= 0 ? `${age} yrs` : "";
};

const EnrollmentPage = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<"count" | "details" | "done">("count");
  const [count, setCount] = useState(1);
  const [candidates, setCandidates] = useState<CandidateForm[]>([emptyCandidateForm()]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  const handleCountConfirm = () => {
    const c = Math.max(1, Math.min(10, count));
    setCount(c);
    const forms: CandidateForm[] = [];
    for (let i = 0; i < c; i++) forms.push(candidates[i] || emptyCandidateForm());
    setCandidates(forms);
    setCurrentIndex(0);
    setStep("details");
  };

  const updateCandidate = (field: keyof CandidateForm, value: any) => {
    setCandidates((prev) => {
      const updated = [...prev];
      updated[currentIndex] = { ...updated[currentIndex], [field]: value };
      return updated;
    });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Photo must be under 5MB.", variant: "destructive" });
      return;
    }
    updateCandidate("photo", file);
    updateCandidate("photoPreview", URL.createObjectURL(file));
  };

  const validateCurrent = () => {
    const c = candidates[currentIndex];
    if (!c.name.trim()) return "Name is required";
    if (!c.dob) return "Date of birth is required";
    if (!c.contact_no.trim()) return "Contact number is required";
    if (!c.address.trim()) return "Address is required";
    if (!c.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) return "Valid email is required";
    return null;
  };

  const handleNext = () => {
    const err = validateCurrent();
    if (err) {
      toast({ title: "Missing info", description: err, variant: "destructive" });
      return;
    }
    if (currentIndex < count - 1) setCurrentIndex(currentIndex + 1);
  };

  const handleSubmit = async () => {
    const err = validateCurrent();
    if (err) {
      toast({ title: "Missing info", description: err, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data: enrollment, error: enrollErr } = await supabase
        .from("enrollments")
        .insert({ user_id: user!.id })
        .select("id")
        .single();
      if (enrollErr) throw enrollErr;

      for (const c of candidates) {
        let photo_url: string | null = null;
        if (c.photo) {
          const ext = c.photo.name.split(".").pop();
          const path = `${user!.id}/${enrollment.id}/${crypto.randomUUID()}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("candidate-photos")
            .upload(path, c.photo);
          if (upErr) throw upErr;
          const { data: urlData } = supabase.storage.from("candidate-photos").getPublicUrl(path);
          photo_url = urlData.publicUrl;
        }
        const { error: candErr } = await supabase.from("enrollment_candidates").insert({
          enrollment_id: enrollment.id,
          name: c.name.trim(),
          dob: c.dob,
          contact_no: c.contact_no.trim(),
          address: c.address.trim(),
          email: c.email.trim(),
          photo_url,
          height: c.height.trim() || null,
          weight: c.weight.trim() || null,
        });
        if (candErr) throw candErr;
      }

      setStep("done");
      toast({ title: "Enrollment Submitted! 🌊", description: "Welcome to the team — we'll be in touch." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to submit enrollment", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center bg-sport-dark">
        
        <Loader2 className="w-8 h-8 text-primary animate-spin relative z-10" />
      </div>
    );
  }

  const current = candidates[currentIndex];

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-sport-dark px-4 py-10 overflow-hidden bg-sport-dark">
      <div className="absolute inset-0 diagonal-stripe opacity-30 pointer-events-none" />
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-primary via-accent to-secondary pointer-events-none" />

      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            await signOut();
            navigate("/login");
          }}
          className="border-primary/40 bg-sport-dark/40 backdrop-blur text-primary hover:bg-primary/20 hover:text-sport-dark-foreground uppercase tracking-wider text-xs"
        >
          <LogOut className="w-3 h-3 mr-1" /> Sign out
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-xl relative z-10"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary/30">
            <Waves className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-3xl text-sport-dark-foreground tracking-wider">JOIN THE SQUAD</h1>
          <p className="text-primary text-xs uppercase tracking-[0.4em] font-semibold mt-1">Friends Aquatic Academy</p>
        </div>

        <Card className="bg-card/5 backdrop-blur-xl border-primary/30 shadow-lg shadow-primary/30 overflow-hidden">
          <AnimatePresence mode="wait">
            {step === "count" && (
              <motion.div key="count" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <CardHeader className="text-center pb-2">
                  <CardTitle className="font-display text-2xl text-sport-dark-foreground tracking-wider">HOW MANY SWIMMERS?</CardTitle>
                  <p className="text-muted-foreground text-sm mt-1">Tell us how many people are joining today.</p>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                  <div className="flex items-center justify-center gap-5">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setCount(Math.max(1, count - 1))}
                      className="border-primary/40 bg-sport-dark/40 text-primary hover:bg-primary/20 hover:text-sport-dark-foreground h-14 w-14"
                    >
                      <Minus className="w-6 h-6" />
                    </Button>
                    <div className="font-display text-7xl text-gradient-sport w-28 text-center leading-none">{count}</div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setCount(Math.min(10, count + 1))}
                      className="border-primary/40 bg-sport-dark/40 text-primary hover:bg-primary/20 hover:text-sport-dark-foreground h-14 w-14"
                    >
                      <Plus className="w-6 h-6" />
                    </Button>
                  </div>
                  <Button
                    onClick={handleCountConfirm}
                    className="w-full bg-sport-energy hover:bg-sport-energy/90 text-sport-energy-foreground font-semibold uppercase tracking-wider h-12 text-sm group"
                  >
                    Continue <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </motion.div>
            )}

            {step === "details" && current && (
              <motion.div key={`details-${currentIndex}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-xl text-sport-dark-foreground tracking-wider">
                    <UserPlus className="w-5 h-5 inline mr-2 text-primary" />
                    SWIMMER {currentIndex + 1} / {count}
                  </CardTitle>
                  {count > 1 && (
                    <div className="flex gap-1 mt-2">
                      {Array.from({ length: count }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            i <= currentIndex ? "bg-gradient-to-r from-primary to-accent" : "bg-cyan-400/20"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4 pt-3">
                  <div>
                    <Label className="text-primary text-[10px] uppercase tracking-[0.25em]">Full Name *</Label>
                    <Input
                      value={current.name}
                      onChange={(e) => updateCandidate("name", e.target.value)}
                      placeholder="Enter full name"
                      className="bg-sport-dark/60 border-primary/30 text-white placeholder:text-muted-foreground/50 mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-primary text-[10px] uppercase tracking-[0.25em]">Age (Date of Birth) *</Label>
                      <Input
                        type="date"
                        value={current.dob}
                        onChange={(e) => updateCandidate("dob", e.target.value)}
                        className="bg-sport-dark/60 border-primary/30 text-white mt-1"
                      />
                      {current.dob && (
                        <p className="text-[10px] text-primary mt-1 uppercase tracking-wider">{calcAge(current.dob)}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-primary text-[10px] uppercase tracking-[0.25em]">Contact No. *</Label>
                      <Input
                        value={current.contact_no}
                        onChange={(e) => updateCandidate("contact_no", e.target.value)}
                        placeholder="+91 98765 43210"
                        className="bg-sport-dark/60 border-primary/30 text-white placeholder:text-muted-foreground/50 mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-primary text-[10px] uppercase tracking-[0.25em]">Email *</Label>
                    <Input
                      type="email"
                      value={current.email}
                      onChange={(e) => updateCandidate("email", e.target.value)}
                      placeholder="swimmer@email.com"
                      className="bg-sport-dark/60 border-primary/30 text-white placeholder:text-muted-foreground/50 mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-primary text-[10px] uppercase tracking-[0.25em]">Address *</Label>
                    <Input
                      value={current.address}
                      onChange={(e) => updateCandidate("address", e.target.value)}
                      placeholder="Full address"
                      className="bg-sport-dark/60 border-primary/30 text-white placeholder:text-muted-foreground/50 mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-primary text-[10px] uppercase tracking-[0.25em]">Height (optional)</Label>
                      <Input
                        value={current.height}
                        onChange={(e) => updateCandidate("height", e.target.value)}
                        placeholder={`e.g. 5'6"`}
                        className="bg-sport-dark/60 border-primary/30 text-white placeholder:text-muted-foreground/50 mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-primary text-[10px] uppercase tracking-[0.25em]">Weight (optional)</Label>
                      <Input
                        value={current.weight}
                        onChange={(e) => updateCandidate("weight", e.target.value)}
                        placeholder="e.g. 60 kg"
                        className="bg-sport-dark/60 border-primary/30 text-white placeholder:text-muted-foreground/50 mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-primary text-[10px] uppercase tracking-[0.25em]">Passport Size Photo</Label>
                    <div className="mt-1 flex items-center gap-4">
                      {current.photoPreview ? (
                        <img
                          src={current.photoPreview}
                          alt="Preview"
                          className="w-20 h-20 rounded-lg object-cover border-2 border-primary/50 shadow-lg shadow-primary/30"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-sport-dark/60 border-2 border-dashed border-primary/40 flex items-center justify-center">
                          <Upload className="w-6 h-6 text-primary" />
                        </div>
                      )}
                      <label className="cursor-pointer">
                        <span className="text-sm text-primary hover:text-muted-foreground uppercase tracking-wider font-semibold">
                          {current.photoPreview ? "Change Photo" : "Upload Photo"}
                        </span>
                        <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
                        else setStep("count");
                      }}
                      className="border-primary/40 bg-sport-dark/40 text-primary hover:bg-primary/20 hover:text-sport-dark-foreground uppercase tracking-wider text-xs flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" /> Back
                    </Button>

                    {currentIndex < count - 1 ? (
                      <Button
                        onClick={handleNext}
                        className="bg-sport-energy hover:bg-sport-energy/90 text-sport-energy-foreground font-semibold uppercase tracking-wider text-xs flex-1 group"
                      >
                        Next <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="bg-sport-energy hover:bg-sport-energy/90 text-sport-energy-foreground font-semibold uppercase tracking-wider text-xs flex-1"
                      >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Enrollment"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </motion.div>
            )}

            {step === "done" && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <CardContent className="text-center py-12 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent mx-auto flex items-center justify-center shadow-lg shadow-primary/30">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="font-display text-3xl text-gradient-sport tracking-wider">YOU'RE IN!</h2>
                  <p className="text-muted-foreground">
                    Enrollment for {count} swimmer{count > 1 ? "s" : ""} submitted. We'll contact you shortly.
                  </p>
                  <Button
                    onClick={() => navigate("/dashboard")}
                    className="bg-sport-energy hover:bg-sport-energy/90 text-sport-energy-foreground font-semibold uppercase tracking-wider text-sm mt-4"
                  >
                    Go to Dashboard →
                  </Button>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
};

export default EnrollmentPage;
