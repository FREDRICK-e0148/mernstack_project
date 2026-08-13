import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { QrCode, Download } from "lucide-react";

interface MemberQrCardProps {
  memberId: string;
  name?: string | null;
}

/** Unique check-in QR for the logged-in member, encoding their member ID. */
const MemberQrCard = ({ memberId, name }: MemberQrCardProps) => {
  const [open, setOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    if (!memberId || memberId === "—") return;
    QRCode.toDataURL(memberId, { width: 480, margin: 1 }).then(setQrUrl).catch(() => setQrUrl(""));
  }, [memberId]);

  const download = () => {
    if (!qrUrl) return;
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = `${memberId}-qr.png`;
    a.click();
  };

  return (
    <>
      <Card className="bg-card/5 backdrop-blur-xl border-primary/40 shadow-lg shadow-primary/20">
        <CardContent className="p-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Show my check-in QR code"
            className="w-14 h-14 rounded-lg bg-white p-1 flex items-center justify-center shrink-0"
          >
            {qrUrl ? (
              <img src={qrUrl} alt={`Check-in QR code for member ${memberId}`} className="w-full h-full" />
            ) : (
              <QrCode className="w-6 h-6 text-sport-dark" />
            )}
          </button>
          <div>
            <p className="text-primary/80 text-[10px] uppercase tracking-[0.3em] font-semibold">My QR</p>
            <p className="text-xs text-muted-foreground max-w-[11rem]">Scan at reception to check in</p>
            <Button
              variant="link"
              onClick={() => setOpen(true)}
              className="h-auto p-0 text-xs text-primary uppercase tracking-wider"
            >
              View / download
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-sport-dark border-primary/30 max-w-xs">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl tracking-wider text-sport-dark-foreground">My Check-in QR</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Show this at the reception desk for contactless check-in.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center space-y-3">
            {qrUrl && <img src={qrUrl} alt={`Check-in QR code for member ${memberId}`} className="mx-auto rounded-lg bg-white p-2 w-56 h-56" />}
            <p className="font-mono text-primary tracking-wider">{memberId}</p>
            {name && <p className="text-sm text-muted-foreground">{name}</p>}
            <Button onClick={download} disabled={!qrUrl} className="w-full bg-sport-energy hover:bg-sport-energy/90 text-sport-energy-foreground uppercase tracking-wider text-xs">
              <Download className="w-4 h-4 mr-1" /> Download PNG
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MemberQrCard;
