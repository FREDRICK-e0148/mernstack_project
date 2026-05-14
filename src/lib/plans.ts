export interface Plan {
  id: string;
  category: string;
  name: string;
  duration: string;
  price: number;
  highlight?: boolean;
  note?: string;
}

export const PLANS: Plan[] = [
  // Memberships & Plans
  { id: "ind-5y", category: "Memberships & Plans", name: "Individual", duration: "5 Years", price: 30000 },
  { id: "1+1-5y", category: "Memberships & Plans", name: "1+1 Family", duration: "5 Years", price: 40000 },
  { id: "2+2-5y", category: "Memberships & Plans", name: "2+2 Family", duration: "5 Years", price: 50000 },
  { id: "4+2-5y", category: "Memberships & Plans", name: "4+2 Family", duration: "5 Years", price: 60000 },
  { id: "2+2-10y", category: "Memberships & Plans", name: "2+2 Family", duration: "10 Years", price: 80000 },
  { id: "4+2-10y", category: "Memberships & Plans", name: "4+2 Family", duration: "10 Years", price: 100000, highlight: true },

  // Yearly Plans
  { id: "ind-1y", category: "Yearly Plans", name: "Individual", duration: "1 Year", price: 15000 },
  { id: "ind-nom-1y", category: "Yearly Plans", name: "Individual + 1 Nominee", duration: "1 Year", price: 25000 },
  { id: "fam-1y-28", category: "Yearly Plans", name: "One Family", duration: "1 Year", price: 28000 },
  { id: "fam-1y-30", category: "Yearly Plans", name: "One Family (Premium)", duration: "1 Year", price: 30000 },
  { id: "fam-2nom-1y", category: "Yearly Plans", name: "One Family + 2 Nominees", duration: "1 Year", price: 50000 },
  { id: "sr-1y", category: "Yearly Plans", name: "Senior Citizen Individual", duration: "1 Year", price: 12000 },
  { id: "sr-nom-1y", category: "Yearly Plans", name: "Senior Citizen + 1 Nominee", duration: "1 Year", price: 18000 },
  { id: "sr-2y", category: "Yearly Plans", name: "Senior Citizen Individual", duration: "2 Years", price: 20000 },
  { id: "sr-5y", category: "Yearly Plans", name: "Senior Citizen Individual", duration: "5 Years", price: 25000 },
  { id: "sr-nom-5y", category: "Yearly Plans", name: "Senior Citizen + 1 Nominee", duration: "5 Years", price: 35000 },

  // Regular Coaching
  { id: "reg-3m", category: "Regular Coaching", name: "Regular Coaching", duration: "3 Months", price: 10000 },
  { id: "reg-15-ch", category: "Regular Coaching", name: "Children Coaching", duration: "15 Days", price: 3000 },
  { id: "reg-15-ad", category: "Regular Coaching", name: "Ladies & Adults Coaching", duration: "15 Days", price: 3500 },
  { id: "reg-30-ch", category: "Regular Coaching", name: "Children Coaching", duration: "30 Days", price: 5500 },
  { id: "reg-30-ad", category: "Regular Coaching", name: "Ladies & Adults Coaching", duration: "30 Days", price: 6000 },

  // Advanced Coaching
  { id: "adv-1m", category: "Advanced Coaching", name: "Advanced Coaching", duration: "1 Month", price: 3500, note: "Free Style, Backstroke, Breaststroke, Butterfly" },

  // Weekend Plans
  { id: "wk-15-ch", category: "Weekend Plans", name: "Weekend Coaching (Children)", duration: "15 Days", price: 4000 },
  { id: "wk-30-ch", category: "Weekend Plans", name: "Weekend Coaching (Children)", duration: "30 Days", price: 6000 },
  { id: "wk-mem-4m", category: "Weekend Plans", name: "Weekend Membership", duration: "4 Months", price: 8000 },
  { id: "wk-mem-10m", category: "Weekend Plans", name: "Weekend Membership", duration: "10 Months", price: 12000 },

  // Gym, Shuttle, Badminton
  { id: "gym-reg", category: "Gym & Shuttle", name: "Gym, Shuttle & Badminton Registration", duration: "One-time", price: 250 },
  { id: "gym-1m", category: "Gym & Shuttle", name: "Gym Membership", duration: "1 Month", price: 500 },
  { id: "shuttle-1m", category: "Gym & Shuttle", name: "Shuttle Membership", duration: "1 Month", price: 1250 },

  // Aqua Zumba
  { id: "aqua-zumba", category: "Aqua Zumba", name: "Aqua Zumba (Ladies Only)", duration: "Monthly · 2 days/week", price: 2000, note: "Weight Loss Program" },
];

// Categories where classes are scheduled (Mondays are holidays).
// Excludes one-time / open-access categories like Gym & Shuttle and Aqua Zumba.
export const isClassPlanCategory = (category?: string | null) => {
  if (!category) return false;
  return (
    category.includes("Coaching") ||
    category.includes("Membership") ||
    category === "Memberships & Plans" ||
    category === "Yearly Plans" ||
    category === "Weekend Plans"
  );
};

// Mondays are weekly holidays. Count non-Monday days in [start, end).
export const countClassDays = (start: Date, end: Date) => {
  if (end <= start) return 0;
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  let count = 0;
  for (let d = new Date(s); d < e; d.setDate(d.getDate() + 1)) {
    if (d.getDay() !== 1) count++; // 1 = Monday
  }
  return count;
};

export const planDurationDays = (duration: string): number => {
  const d = duration.toLowerCase();
  const num = parseInt(d.match(/\d+/)?.[0] ?? "0", 10);
  if (d.includes("year")) return num * 365;
  if (d.includes("month")) return num * 30;
  if (d.includes("day")) return num;
  return 30;
};

export const PLAN_CATEGORIES = [
  "Memberships & Plans",
  "Yearly Plans",
  "Regular Coaching",
  "Advanced Coaching",
  "Weekend Plans",
  "Gym & Shuttle",
  "Aqua Zumba",
];
