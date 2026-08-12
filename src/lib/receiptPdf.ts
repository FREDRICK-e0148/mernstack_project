import jsPDF from "jspdf";
import { fmtDate, fmtDateTime, type Member, type MemberPayment, type OrgSettings } from "@/lib/mgmt";

/** Amount in plain ASCII (jsPDF core fonts have no ₹ glyph) */
const rupees = (n: number) => `Rs. ${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const buildReceiptPdf = (payment: MemberPayment, member: Member | undefined, org: OrgSettings | null) => {
  const doc = new jsPDF({ unit: "pt", format: [420, 620] });
  const W = 420;
  const center = (text: string, y: number) => doc.text(text, W / 2, y, { align: "center" });
  let y = 48;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  center((org?.org_name ?? "Friends Sports Academy").toUpperCase(), y);
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110);
  if (org?.address) {
    for (const line of doc.splitTextToSize(org.address, 300) as string[]) {
      center(line, y);
      y += 12;
    }
  }
  const contact = [org?.phone, org?.email].filter(Boolean).join("  ·  ");
  if (contact) {
    center(contact, y);
    y += 12;
  }

  y += 8;
  doc.setTextColor(30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  center("PAYMENT RECEIPT", y);
  y += 14;
  doc.setDrawColor(200);
  doc.line(40, y, W - 40, y);
  y += 22;

  const row = (label: string, value: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(label, 40, y);
    doc.setTextColor(20);
    doc.setFont("helvetica", "bold");
    doc.text(value || "-", W - 40, y, { align: "right" });
    y += 20;
  };

  row("Receipt no.", payment.receipt_no);
  row("Date", fmtDateTime(payment.paid_at));
  row("Member", member?.full_name ?? "-");
  row("Member ID", member?.member_code ?? "-");
  if (member?.phone) row("Phone", member.phone);
  row("Plan", payment.plan_name ?? "-");
  row("Valid", `${fmtDate(payment.period_start)} - ${fmtDate(payment.period_end)}`);
  row("Method", payment.payment_method.toUpperCase());
  if (payment.notes) row("Notes", payment.notes);

  y += 4;
  doc.line(40, y, W - 40, y);
  y += 24;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(20);
  doc.text("Amount paid", 40, y);
  doc.text(rupees(Number(payment.amount)), W - 40, y, { align: "right" });
  y += 30;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(130);
  if (org?.receipt_footer) {
    for (const line of doc.splitTextToSize(org.receipt_footer, 320) as string[]) {
      center(line, y);
      y += 11;
    }
  }
  center("This is a computer generated receipt.", y + 6);

  return doc;
};

export const downloadReceiptPdf = (payment: MemberPayment, member: Member | undefined, org: OrgSettings | null) => {
  buildReceiptPdf(payment, member, org).save(`${payment.receipt_no}.pdf`);
};

/** Opens the native share sheet when available, otherwise falls back to download. */
export const shareReceiptPdf = async (payment: MemberPayment, member: Member | undefined, org: OrgSettings | null) => {
  const doc = buildReceiptPdf(payment, member, org);
  const blob = doc.output("blob") as Blob;
  const file = new File([blob], `${payment.receipt_no}.pdf`, { type: "application/pdf" });
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: `Receipt ${payment.receipt_no}` });
    return true;
  }
  doc.save(`${payment.receipt_no}.pdf`);
  return false;
};
