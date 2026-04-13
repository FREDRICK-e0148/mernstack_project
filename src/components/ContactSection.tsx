import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Clock, Mail } from "lucide-react";

const contactInfo = [
  {
    icon: MapPin,
    title: "Location",
    detail: "2/1256, Ramapuram, Thiruvalluvar Nagar, Mugalivakkam, Chennai 600125",
  },
  { icon: Phone, title: "Phone", detail: "+91 XXXXX XXXXX" },
  { icon: Mail, title: "Email", detail: "info@friendssportsacademy.com" },
  { icon: Clock, title: "Timings", detail: "Mon–Sat: 5:30 AM – 8:00 PM | Sun: 6:00 AM – 12:00 PM" },
];

const ContactSection = () => {
  return (
    <section id="contact" className="py-20 bg-background relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <Badge variant="outline" className="mb-4 uppercase tracking-widest text-xs border-primary/40 text-primary">
            Get In Touch
          </Badge>
          <h2 className="text-5xl md:text-6xl font-display text-foreground">
            JOIN THE <span className="text-gradient-sport">TEAM</span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            {contactInfo.map((info) => (
              <Card key={info.title} className="border-border/60">
                <CardContent className="flex items-start gap-4 p-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <info.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm uppercase tracking-wider">{info.title}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{info.detail}</div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Embedded map */}
            <div className="rounded-xl overflow-hidden border border-border/60 h-48">
              <iframe
                title="Friends Sports Academy Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.123456789!2d80.1234567!3d13.0234567!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sFriends+Sports+Academy!5e0!3m2!1sen!2sin!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
              />
            </div>
          </motion.div>

          {/* Enquiry Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Card className="border-border/60">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-display text-3xl text-foreground mb-2">ENQUIRE NOW</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input placeholder="Full Name" className="bg-muted/50" />
                  <Input placeholder="Phone Number" className="bg-muted/50" />
                </div>
                <Input placeholder="Email Address" className="bg-muted/50" />
                <Input placeholder="Child's Age (if applicable)" className="bg-muted/50" />
                <Textarea placeholder="Message or questions..." className="bg-muted/50 min-h-[100px]" />
                <Button className="w-full bg-sport-energy hover:bg-sport-energy/90 text-sport-energy-foreground font-semibold uppercase tracking-wider">
                  Send Enquiry
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
