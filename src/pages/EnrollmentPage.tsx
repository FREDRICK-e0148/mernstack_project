import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Users, ArrowRight, ArrowLeft, Loader2, Upload, CheckCircle, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface CandidateForm {
  name: string;
  dob: string;
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
  contact_no: "",
  address: "",
  email: "",
  photo: null,
  photoPreview: "",
  height: "",
  weight: "",
});

const EnrollmentPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<"count" | "details" | "done">("count");
  const [count, setCount] = useState(1);
  const [candidates, setCandidates] = useState<CandidateForm[]>([emptyCandidateForm()]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const handleCountConfirm = () => {
    const c = Math.max(1, Math.min(10, count));
    setCount(c);
    const forms: CandidateForm[] = [];
    for (let i = 0; i < c; i++) {
      forms.push(candidates[i] || emptyCandidateForm());
    }
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
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Photo must be under 5MB.", variant: "destructive" });
        return;
      }
      updateCandidate("photo", file);
      updateCandidate("photoPreview", URL.createObjectURL(file));
    }
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
    if (currentIndex < count - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSubmit = async () => {
    const err = validateCurrent();
    if (err) {
      toast({ title: "Missing info", description: err, variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // Create enrollment
      const { data: enrollment, error: enrollErr } = await supabase
        .from("enrollments")
        .insert({ user_id: user!.id })
        .select("id")
        .single();
      if (enrollErr) throw enrollErr;

      // Upload photos and insert candidates
      for (const c of candidates) {
        let photo_url: string | null = null;
        if (c.photo) {
          const ext = c.photo.name.split(".").pop();
          const path = `${user!.id}/${enrollment.id}/${crypto.randomUUID()}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("candidate-photos")
            .upload(path, c.photo);
          if (upErr) throw upErr;
          const { data: urlData } = supabase.storage
            .from("candidate-photos")
            .getPublicUrl(path);
          photo_url = urlData.publicUrl;
        }

        const { error: candErr } = await supabase
          .from("enrollment_candidates")
          .insert({
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
      toast({ title: "Enrollment Submitted! 🎉", description: "We'll be in touch soon." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to submit enrollment", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-sport-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const current = candidates[currentIndex];

  return (
    <div className="min-h-screen bg-sport-dark flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 diagonal-stripe opacity-20" />
      <div className="absolute top-20 left-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-20 right-1/4 w-[300px] h-[300px] bg-accent/10 rounded-full blur-[100px]" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-secondary" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mx-auto mb-3">
            <span className="font-display text-primary-foreground text-2xl leading-none">F</span>
          </div>
          <h1 className="font-display text-3xl text-sport-dark-foreground tracking-wider">ENROLLMENT</h1>
          <p className="text-primary text-sm uppercase tracking-[0.3em] font-semibold">Friends Sports Academy</p>
        </div>

        <Card className="bg-card/10 backdrop-blur-lg border-primary/20">
          {step === "count" && (
            <>
              <CardHeader className="text-center pb-2">
                <CardTitle className="font-display text-2xl text-sport-dark-foreground tracking-wider">
                  HOW MANY CANDIDATES?
                </CardTitle>
                <p className="text-muted-foreground text-sm mt-1">
                  How many people would you like to enroll?
                </p>
              </CardHeader>
              <CardContent className="space-y-5 pt-4">
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCount(Math.max(1, count - 1))}
                    className="border-primary/30 text-primary hover:bg-primary/10 h-12 w-12 text-xl"
                  >
                    −
                  </Button>
                  <div className="font-display text-5xl text-sport-dark-foreground w-20 text-center">{count}</div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCount(Math.min(10, count + 1))}
                    className="border-primary/30 text-primary hover:bg-primary/10 h-12 w-12 text-xl"
                  >
                    +
                  </Button>
                </div>
                <Button
                  onClick={handleCountConfirm}
                  className="w-full bg-sport-energy hover:bg-sport-energy/90 text-sport-energy-foreground font-semibold uppercase tracking-wider h-12 text-sm group"
                >
                  Continue <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </>
          )}

          {step === "details" && current && (
            <>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display text-2xl text-sport-dark-foreground tracking-wider">
                    <UserPlus className="w-5 h-5 inline mr-2 text-primary" />
                    CANDIDATE {currentIndex + 1} OF {count}
                  </CardTitle>
                </div>
                {count > 1 && (
                  <div className="flex gap-1 mt-2">
                    {Array.from({ length: count }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${i <= currentIndex ? "bg-primary" : "bg-primary/20"}`}
                      />
                    ))}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4 pt-3">
                <div>
                  <Label className="text-sport-dark-foreground text-xs uppercase tracking-wider">Full Name *</Label>
                  <Input
                    value={current.name}
                    onChange={(e) => updateCandidate("name", e.target.value)}
                    placeholder="Enter full name"
                    className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground placeholder:text-muted-foreground/50 mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sport-dark-foreground text-xs uppercase tracking-wider">Date of Birth *</Label>
                    <Input
                      type="date"
                      value={current.dob}
                      onChange={(e) => updateCandidate("dob", e.target.value)}
                      className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sport-dark-foreground text-xs uppercase tracking-wider">Contact No. *</Label>
                    <Input
                      value={current.contact_no}
                      onChange={(e) => updateCandidate("contact_no", e.target.value)}
                      placeholder="+91 98765 43210"
                      className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground placeholder:text-muted-foreground/50 mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sport-dark-foreground text-xs uppercase tracking-wider">Email *</Label>
                  <Input
                    type="email"
                    value={current.email}
                    onChange={(e) => updateCandidate("email", e.target.value)}
                    placeholder="candidate@email.com"
                    className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground placeholder:text-muted-foreground/50 mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sport-dark-foreground text-xs uppercase tracking-wider">Address *</Label>
                  <Input
                    value={current.address}
                    onChange={(e) => updateCandidate("address", e.target.value)}
                    placeholder="Full address"
                    className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground placeholder:text-muted-foreground/50 mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sport-dark-foreground text-xs uppercase tracking-wider">Height (optional)</Label>
                    <Input
                      value={current.height}
                      onChange={(e) => updateCandidate("height", e.target.value)}
                      placeholder="e.g. 5'6&quot;"
                      className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground placeholder:text-muted-foreground/50 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sport-dark-foreground text-xs uppercase tracking-wider">Weight (optional)</Label>
                    <Input
                      value={current.weight}
                      onChange={(e) => updateCandidate("weight", e.target.value)}
                      placeholder="e.g. 60 kg"
                      className="bg-sport-dark/50 border-primary/30 text-sport-dark-foreground placeholder:text-muted-foreground/50 mt-1"
                    />
                  </div>
                </div>

                {/* Photo upload */}
                <div>
                  <Label className="text-sport-dark-foreground text-xs uppercase tracking-wider">Photo of Candidate</Label>
                  <div className="mt-1 flex items-center gap-4">
                    {current.photoPreview ? (
                      <img
                        src={current.photoPreview}
                        alt="Preview"
                        className="w-16 h-16 rounded-lg object-cover border-2 border-primary/30"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-sport-dark/50 border-2 border-dashed border-primary/30 flex items-center justify-center">
                        <Upload className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <label className="cursor-pointer">
                      <span className="text-sm text-primary hover:text-primary/80 uppercase tracking-wider font-semibold">
                        {current.photoPreview ? "Change Photo" : "Upload Photo"}
                      </span>
                      <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Navigation buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
                      else setStep("count");
                    }}
                    className="border-primary/30 text-primary hover:bg-primary/10 uppercase tracking-wider text-xs flex-1"
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
            </>
          )}

          {step === "done" && (
            <CardContent className="text-center py-10 space-y-4">
              <CheckCircle className="w-16 h-16 text-accent mx-auto" />
              <h2 className="font-display text-3xl text-sport-dark-foreground tracking-wider">ALL SET!</h2>
              <p className="text-muted-foreground">
                Your enrollment for {count} candidate{count > 1 ? "s" : ""} has been submitted successfully. We'll contact you shortly.
              </p>
              <Button
                onClick={() => navigate("/")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold uppercase tracking-wider text-sm mt-4"
              >
                Back to Home
              </Button>
            </CardContent>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default EnrollmentPage;
