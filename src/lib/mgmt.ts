export interface MembershipPlan {
  id: string;
  name: string;
  description: string | null;
  category: string;
  duration_days: number;
  fee: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Member {
  id: string;
  member_code: string;
  full_name: string;
  photo_url: string | null;
  dob: string | null;
  gender: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  plan_id: string | null;
  membership_start: string | null;
  membership_expiry: string | null;
  is_active: boolean;
  notes: string | null;
  created_at?: string;
}

export interface MemberPayment {
  id: string;
  member_id: string;
  receipt_no: string;
  plan_id: string | null;
  plan_name: string | null;
  amount: number;
  payment_method: string;
  period_start: string | null;
  period_end: string | null;
  notes: string | null;
  paid_at: string;
}

export interface AttendanceRow {
  id: string;
  member_id: string;
  check_in_at: string;
  check_in_date: string;
  method: string;
}

export interface OrgSettings {
  id: string;
  org_name: string;
  pool_info: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  receipt_footer: string | null;
  logo_url: string | null;
}

export const PAYMENT_METHODS = ["cash", "upi", "card"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const fmtINR = (n: number) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/** Today's date (Asia/Kolkata) as YYYY-MM-DD */
export const todayISO = () => {
  const d = new Date(Date.now() + 5.5 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
};

export const addDaysISO = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export const daysLeft = (expiry?: string | null) => {
  if (!expiry) return null;
  const a = new Date(`${todayISO()}T00:00:00Z`).getTime();
  const b = new Date(`${expiry}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86400000);
};

export const isExpired = (expiry?: string | null) => {
  const d = daysLeft(expiry);
  return d === null ? true : d < 0;
};

export const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso.length > 10 ? iso : `${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const fmtDateTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

export const genMemberCode = () => {
  const y = new Date().getFullYear().toString().slice(-2);
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `FSA${y}-${rand}`;
};

export const memberStatus = (m: Member): "active" | "expired" | "inactive" => {
  if (!m.is_active) return "inactive";
  return isExpired(m.membership_expiry) ? "expired" : "active";
};

export const toCsv = (rows: Record<string, unknown>[]) => {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
};

export const downloadCsv = (filename: string, rows: Record<string, unknown>[]) => {
  const csv = toCsv(rows);
  if (!csv) return false;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return true;
};

/** Monday is a holiday — count non-Monday days in a range (inclusive) */
export const countClassDays = (startISO: string, endISO: string) => {
  let count = 0;
  const start = new Date(`${startISO}T00:00:00Z`);
  const end = new Date(`${endISO}T00:00:00Z`);
  for (const d = start; d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    if (d.getUTCDay() !== 1) count++;
  }
  return count;
};
