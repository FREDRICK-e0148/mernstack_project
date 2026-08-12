import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { fmtDate, todayISO, type AttendanceRow } from "@/lib/mgmt";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const WEEKS = 26;

const shiftISO = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const monthLabel = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { month: "short", year: "numeric" });

const AttendanceHeatmap = () => {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [monthOffset, setMonthOffset] = useState(0);

  const today = todayISO();
  const rangeStart = useMemo(() => {
    const start = new Date(`${today}T00:00:00Z`);
    start.setUTCDate(start.getUTCDate() - (WEEKS * 7 - 1));
    start.setUTCDate(start.getUTCDate() - start.getUTCDay()); // align to Sunday
    return start.toISOString().slice(0, 10);
  }, [today]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("attendance")
        .select("check_in_date")
        .gte("check_in_date", shiftISO(rangeStart, -400))
        .order("check_in_date");
      const map: Record<string, number> = {};
      for (const r of (data ?? []) as Pick<AttendanceRow, "check_in_date">[]) {
        map[r.check_in_date] = (map[r.check_in_date] ?? 0) + 1;
      }
      setCounts(map);
      setLoading(false);
    };
    load();
  }, [rangeStart]);

  const max = Math.max(1, ...Object.values(counts));

  const level = (n: number) => {
    if (!n) return 0;
    const r = n / max;
    if (r > 0.75) return 4;
    if (r > 0.5) return 3;
    if (r > 0.25) return 2;
    return 1;
  };

  const levelClass = [
    "bg-primary/5 border-primary/10",
    "bg-primary/25 border-primary/20",
    "bg-primary/45 border-primary/30",
    "bg-primary/70 border-primary/40",
    "bg-primary border-primary",
  ];

  const grid = useMemo(() => {
    const cols: { iso: string; count: number; future: boolean }[][] = [];
    for (let w = 0; w < WEEKS; w++) {
      const col: { iso: string; count: number; future: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const iso = shiftISO(rangeStart, w * 7 + d);
        col.push({ iso, count: counts[iso] ?? 0, future: iso > today });
      }
      cols.push(col);
    }
    return cols;
  }, [counts, rangeStart, today]);

  const monthMarkers = useMemo(
    () =>
      grid.map((col, i) => {
        const first = col[0].iso;
        const prev = i > 0 ? grid[i - 1][0].iso : "";
        return first.slice(5, 7) !== prev.slice(5, 7) ? monthLabel(first).split(" ")[0] : "";
      }),
    [grid],
  );

  // Selected calendar month
  const monthAnchor = useMemo(() => {
    const d = new Date(`${today.slice(0, 8)}01T00:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() + monthOffset);
    return d;
  }, [today, monthOffset]);

  const monthDays = useMemo(() => {
    const y = monthAnchor.getUTCFullYear();
    const m = monthAnchor.getUTCMonth();
    const first = new Date(Date.UTC(y, m, 1));
    const total = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const cells: ({ iso: string; day: number } | null)[] = Array.from({ length: first.getUTCDay() }, () => null);
    for (let i = 1; i <= total; i++) {
      cells.push({ iso: new Date(Date.UTC(y, m, i)).toISOString().slice(0, 10), day: i });
    }
    return cells;
  }, [monthAnchor]);

  const monthTotal = monthDays.reduce((s, c) => s + (c ? counts[c.iso] ?? 0 : 0), 0);
  const activeDays = monthDays.filter((c) => c && (counts[c.iso] ?? 0) > 0).length;

  const weekdayTotals = useMemo(() => {
    const totals = Array(7).fill(0);
    const days = Array(7).fill(0);
    for (const col of grid) {
      for (let d = 0; d < 7; d++) {
        if (col[d].future) continue;
        totals[d] += col[d].count;
        days[d] += 1;
      }
    }
    return totals.map((t, d) => ({ day: d, total: t, avg: days[d] ? t / days[d] : 0 }));
  }, [grid]);

  const busiestWeekday = weekdayTotals.reduce((a, b) => (b.avg > a.avg ? b : a), weekdayTotals[0]);
  const busiestDay = Object.entries(counts).reduce<[string, number]>((a, b) => (b[1] > a[1] ? b : a), ["", 0]);
  const maxAvg = Math.max(0.001, ...weekdayTotals.map((w) => w.avg));

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <Card className="bg-card/10 border-primary/20">
        <CardContent className="p-4 flex flex-wrap gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Check-ins (26 weeks)</p>
            <p className="font-display text-3xl text-sport-dark-foreground tracking-wider">
              {grid.flat().reduce((s, c) => s + c.count, 0)}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Busiest day</p>
            <p className="font-display text-3xl text-sport-dark-foreground tracking-wider">{busiestDay[1] || 0}</p>
            <p className="text-xs text-muted-foreground">{busiestDay[0] ? fmtDate(busiestDay[0]) : "—"}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Busiest weekday</p>
            <p className="font-display text-3xl text-sport-dark-foreground tracking-wider">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][busiestWeekday.day]}
            </p>
            <p className="text-xs text-muted-foreground">{busiestWeekday.avg.toFixed(1)} avg / day</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/10 border-primary/20">
        <CardContent className="p-4 space-y-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Attendance heatmap · last 26 weeks</p>
          <div className="overflow-x-auto pb-1">
            <div className="inline-block min-w-max">
              <div className="flex gap-[3px] ml-6 mb-1">
                {monthMarkers.map((m, i) => (
                  <span key={i} className="w-3 text-[9px] text-muted-foreground overflow-visible whitespace-nowrap">{m}</span>
                ))}
              </div>
              <div className="flex gap-[3px]">
                <div className="flex flex-col gap-[3px] mr-1">
                  {DAY_LABELS.map((d, i) => (
                    <span key={i} className="h-3 w-4 text-[9px] leading-3 text-muted-foreground">{i % 2 ? d : ""}</span>
                  ))}
                </div>
                {grid.map((col, w) => (
                  <div key={w} className="flex flex-col gap-[3px]">
                    {col.map((cell) => (
                      <motion.div
                        key={cell.iso}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: cell.future ? 0.15 : 1, scale: 1 }}
                        transition={{ delay: Math.min(w * 0.008, 0.25) }}
                        title={`${fmtDate(cell.iso)} · ${cell.count} check-in${cell.count === 1 ? "" : "s"}`}
                        className={`w-3 h-3 rounded-[3px] border ${levelClass[level(cell.count)]}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>Less</span>
            {levelClass.map((c, i) => <span key={i} className={`w-3 h-3 rounded-[3px] border ${c}`} />)}
            <span>More</span>
            <span className="ml-auto">Peak: {max} / day</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card/10 border-primary/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold text-sport-dark-foreground">{monthLabel(monthAnchor.toISOString().slice(0, 10))}</p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="outline" onClick={() => setMonthOffset((o) => o - 1)} className="h-7 w-7 border-primary/30 text-primary">
                  <ChevronLeft className="w-3 h-3" />
                </Button>
                <Button size="icon" variant="outline" disabled={monthOffset >= 0} onClick={() => setMonthOffset((o) => o + 1)} className="h-7 w-7 border-primary/30 text-primary">
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <span key={i} className="text-[10px] uppercase text-muted-foreground">{d}</span>
              ))}
              {monthDays.map((c, i) =>
                c ? (
                  <div
                    key={c.iso}
                    title={`${fmtDate(c.iso)} · ${counts[c.iso] ?? 0} check-ins`}
                    className={`aspect-square rounded-md border flex flex-col items-center justify-center ${levelClass[level(counts[c.iso] ?? 0)]} ${c.iso > today ? "opacity-30" : ""}`}
                  >
                    <span className="text-[10px] text-sport-dark-foreground/80 leading-none">{c.day}</span>
                    <span className="text-[11px] font-semibold text-sport-dark-foreground leading-none">{counts[c.iso] ?? 0 ? counts[c.iso] : ""}</span>
                  </div>
                ) : (
                  <div key={`e${i}`} />
                ),
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {monthTotal} check-ins · {activeDays} active day{activeDays === 1 ? "" : "s"} (Mondays are holidays)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/10 border-primary/20">
          <CardContent className="p-4 space-y-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Average check-ins by weekday</p>
            <div className="space-y-2">
              {weekdayTotals.map((w) => (
                <div key={w.day} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-8">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][w.day]}</span>
                  <div className="flex-1 h-3 rounded-full bg-primary/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(w.avg / maxAvg) * 100}%` }}
                      transition={{ duration: 0.6 }}
                      className="h-full bg-gradient-to-r from-primary to-sport-energy"
                    />
                  </div>
                  <span className="text-xs text-sport-dark-foreground w-10 text-right">{w.avg.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AttendanceHeatmap;
