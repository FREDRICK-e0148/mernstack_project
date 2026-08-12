import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Loader2, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRoles } from "@/hooks/useRoles";
import OverviewTab from "@/components/mgmt/OverviewTab";
import MembersTab from "@/components/mgmt/MembersTab";
import PlansTab from "@/components/mgmt/PlansTab";
import PaymentsTab from "@/components/mgmt/PaymentsTab";
import CheckInTab from "@/components/mgmt/CheckInTab";
import ReportsTab from "@/components/mgmt/ReportsTab";
import SettingsTab from "@/components/mgmt/SettingsTab";
import AttendanceHeatmap from "@/components/mgmt/AttendanceHeatmap";
import AuditLogTab from "@/components/mgmt/AuditLogTab";

const StaffPortalPage = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { isAdmin, canManage, loading } = useRoles();

  if (loading) {
    return (
      <div className="min-h-screen bg-sport-dark flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="min-h-screen bg-sport-dark flex flex-col items-center justify-center gap-4 px-4 text-center">
        <Shield className="w-10 h-10 text-primary" />
        <h1 className="font-display text-3xl text-sport-dark-foreground tracking-wider">STAFF ACCESS ONLY</h1>
        <p className="text-muted-foreground text-sm">Sign in with an administrator or reception staff account.</p>
        <Button onClick={() => navigate("/admin-login")} className="bg-sport-energy hover:bg-sport-energy/90 text-sport-energy-foreground uppercase tracking-wider text-xs">
          Go to staff login
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sport-dark relative">
      <div className="absolute inset-0 diagonal-stripe opacity-10 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-secondary" />

      <div className="container mx-auto px-4 py-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-3 flex-wrap mb-6">
          <div>
            <h1 className="font-display text-4xl text-sport-dark-foreground tracking-wider">RECEPTION DESK</h1>
            <p className="text-primary text-xs uppercase tracking-[0.3em] font-semibold">Friends Sports Academy</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="uppercase text-[10px] border-primary/40 text-primary">
              {isAdmin ? "Administrator" : "Reception staff"}
            </Badge>
            {isAdmin && (
              <Button size="sm" variant="outline" onClick={() => navigate("/admin")} className="border-primary/30 text-primary text-xs uppercase">
                Admin dashboard
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => { signOut(); navigate("/"); }} className="border-primary/30 text-muted-foreground text-xs uppercase">
              <LogOut className="w-3 h-3 mr-1" /> Logout
            </Button>
          </div>
        </motion.div>

        <Tabs defaultValue="overview">
          <TabsList className="bg-card/10 border border-primary/20 flex-wrap h-auto">
            <TabsTrigger value="overview" className="text-xs uppercase tracking-wider">Dashboard</TabsTrigger>
            <TabsTrigger value="members" className="text-xs uppercase tracking-wider">Members</TabsTrigger>
            <TabsTrigger value="checkin" className="text-xs uppercase tracking-wider">Check-in</TabsTrigger>
            <TabsTrigger value="payments" className="text-xs uppercase tracking-wider">Payments</TabsTrigger>
            <TabsTrigger value="plans" className="text-xs uppercase tracking-wider">Plans</TabsTrigger>
            <TabsTrigger value="reports" className="text-xs uppercase tracking-wider">Reports</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs uppercase tracking-wider">Settings</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="overview"><OverviewTab /></TabsContent>
            <TabsContent value="members"><MembersTab isAdmin={isAdmin} /></TabsContent>
            <TabsContent value="checkin"><CheckInTab /></TabsContent>
            <TabsContent value="payments"><PaymentsTab /></TabsContent>
            <TabsContent value="plans"><PlansTab isAdmin={isAdmin} /></TabsContent>
            <TabsContent value="reports"><ReportsTab /></TabsContent>
            <TabsContent value="settings"><SettingsTab isAdmin={isAdmin} /></TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default StaffPortalPage;
