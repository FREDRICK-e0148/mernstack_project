import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Users, UserCheck, UserX, CalendarCheck, AlarmClock, IndianRupee } from "lucide-react";
import { fmtINR, isExpired, daysLeft, todayISO, type Member } from "@/lib/mgmt";

const StatCard = ({
  icon: Icon,
  label,
  value,
  hint,
  delay,
}: { icon: typeof Users; label: string; value: string; hint?: string; delay: number }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.35 }}>
    <Card className="bg-card/10 border-primary/20 backdrop-blur-sm hover:border-primary/50 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
            <p className="font-display text-4xl text-sport-dark-foreground tracking-wider mt-1">{value}</p>
            {hint && <p className="text-xs text-primary mt-1">{hint}</p>}
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const OverviewTab = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [checkins, setCheckins] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [revenueCount, setRevenueCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const today = todayISO();
      const [m, a, p] = await Promise.all([
        supabase.from("members").select("*"),
        supabase.from("attendance").select("id").eq("check_in_date", today),
        supabase.from("member_payments").select("amount, paid_at").gte("paid_at", `${today}T00:00:00`),
      ]);
      setMembers((m.data ?? []) as Member[]);
      setCheckins(a.data?.length ?? 0);
      const pay = (p.data ?? []) as { amount: number }[];
      setRevenue(pay.reduce((s, x) => s + Number(x.amount), 0));
      setRevenueCount(pay.length);
    };
    load();
  }, []);

  const active = members.filter((m) => m.is_active && !isExpired(m.membership_expiry));
  const expired = members.filter((m) => isExpired(m.membership_expiry));
  const expiringSoon = active.filter((m) => {
    const d = daysLeft(m.membership_expiry);
    return d !== null && d <= 7;
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard icon={Users} label="Total Members" value={String(members.length)} delay={0} />
      <StatCard icon={UserCheck} label="Active Memberships" value={String(active.length)} delay={0.05} />
      <StatCard icon={UserX} label="Expired Memberships" value={String(expired.length)} delay={0.1} />
      <StatCard icon={CalendarCheck} label="Today's Check-ins" value={String(checkins)} delay={0.15} />
      <StatCard
        icon={AlarmClock}
        label="Expiring Soon"
        value={String(expiringSoon.length)}
        hint="Within 7 days"
        delay={0.2}
      />
      <StatCard
        icon={IndianRupee}
        label="Today's Revenue"
        value={fmtINR(revenue)}
        hint={`${revenueCount} payment${revenueCount === 1 ? "" : "s"} today`}
        delay={0.25}
      />
    </div>
  );
};

export default OverviewTab;
