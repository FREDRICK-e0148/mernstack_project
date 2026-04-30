// Simple natural-foods diet plan suggester for weight reduction.
// All values are estimates. Not medical advice.

export type DietType = "veg" | "nonveg";

export interface DietPlan {
  bmi: number;
  bmiCategory: string;
  targetWeightKg: number;
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  waterLitres: number;
  meals: { time: string; title: string; items: string[] }[];
  tips: string[];
}

const parseNum = (v: string | null | undefined) => {
  if (!v) return 0;
  const n = parseFloat(String(v).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
};

export function buildDietPlan(
  heightRaw: string | null,
  weightRaw: string | null,
  type: DietType,
  ageYears: number = 25,
): DietPlan | null {
  let h = parseNum(heightRaw); // cm
  const w = parseNum(weightRaw); // kg
  if (!h || !w) return null;
  // If height looks like meters (<3), convert
  if (h < 3) h = h * 100;
  // If height looks like feet (3-8), approx convert
  if (h >= 3 && h < 8) h = h * 30.48;

  const hM = h / 100;
  const bmi = +(w / (hM * hM)).toFixed(1);
  let bmiCategory = "Normal";
  if (bmi < 18.5) bmiCategory = "Underweight";
  else if (bmi < 25) bmiCategory = "Normal";
  else if (bmi < 30) bmiCategory = "Overweight";
  else bmiCategory = "Obese";

  const targetWeightKg = +(22 * hM * hM).toFixed(1);

  // Mifflin-St Jeor BMR (assume male avg, lightly active)
  const bmr = 10 * w + 6.25 * h - 5 * ageYears + 5;
  const tdee = bmr * 1.375;
  const dailyCalories = Math.max(1200, Math.round(tdee - 500)); // 500 kcal deficit

  const proteinG = Math.round(w * 1.6);
  const fatsG = Math.round((dailyCalories * 0.25) / 9);
  const carbsG = Math.round((dailyCalories - proteinG * 4 - fatsG * 9) / 4);
  const waterLitres = +(w * 0.035).toFixed(1);

  const veg = type === "veg";

  const meals = [
    {
      time: "6:30 AM · Pre-Workout",
      title: "Hydrate & Energise",
      items: [
        "1 glass warm water with lemon",
        "5 soaked almonds + 2 walnuts",
        "1 banana or 1 apple",
      ],
    },
    {
      time: "8:30 AM · Breakfast",
      title: "Power Start",
      items: veg
        ? [
            "2 vegetable idlis or 1 bowl oats with milk",
            "1 bowl sprouts salad (moong / chana)",
            "1 cup green tea",
          ]
        : [
            "3 egg-white omelette + 1 whole egg with veggies",
            "2 slices multigrain toast",
            "1 cup green tea",
          ],
    },
    {
      time: "11:30 AM · Mid-Morning",
      title: "Light Snack",
      items: [
        "1 seasonal fruit (papaya / guava / orange)",
        "1 cup buttermilk (no sugar)",
      ],
    },
    {
      time: "1:30 PM · Lunch",
      title: "Balanced Plate",
      items: veg
        ? [
            "2 multigrain rotis",
            "1 bowl dal (moong / toor)",
            "1 bowl mixed vegetable curry",
            "1 bowl curd + cucumber-tomato salad",
          ]
        : [
            "2 multigrain rotis or 1 cup brown rice",
            "150 g grilled chicken / fish curry",
            "1 bowl sautéed vegetables",
            "1 bowl curd + salad",
          ],
    },
    {
      time: "4:30 PM · Evening",
      title: "Smart Snack",
      items: [
        "1 cup green tea or coconut water",
        veg ? "1 bowl roasted chana / makhana" : "2 boiled eggs or 30 g grilled paneer",
      ],
    },
    {
      time: "7:30 PM · Dinner",
      title: "Light & Early",
      items: veg
        ? [
            "1 bowl vegetable soup",
            "1 bowl quinoa / 2 small rotis",
            "1 bowl paneer bhurji or tofu stir-fry",
            "Steamed greens (spinach / broccoli)",
          ]
        : [
            "1 bowl chicken / fish soup",
            "1 bowl quinoa or 2 small rotis",
            "120 g grilled fish or chicken",
            "Steamed greens (spinach / broccoli)",
          ],
    },
    {
      time: "10:00 PM · Bedtime",
      title: "Wind Down",
      items: ["1 cup warm turmeric milk (low-fat) or chamomile tea"],
    },
  ];

  const tips = [
    "Drink water 30 mins before each meal — kills false hunger.",
    "No sugar, no fried food, no packaged snacks.",
    "Walk 20–30 mins after lunch & dinner.",
    "Sleep 7–8 hours; poor sleep = weight gain.",
    "Swim 4–5 days/week — your best fat-burner.",
    "Cheat meal allowed once a week, not a cheat day.",
  ];

  return { bmi, bmiCategory, targetWeightKg, dailyCalories, proteinG, carbsG, fatsG, waterLitres, meals, tips };
}

export function planDurationDays(duration: string): number {
  const d = duration.toLowerCase();
  const num = parseFloat(d) || 1;
  if (d.includes("year")) return Math.round(num * 365);
  if (d.includes("month")) return Math.round(num * 30);
  if (d.includes("day")) return Math.round(num);
  if (d.includes("one-time")) return 0;
  return 30;
}
