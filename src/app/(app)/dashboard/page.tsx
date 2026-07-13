import { requireCurrentUser } from "@/lib/auth";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import OwnerDashboard from "@/components/dashboard/OwnerDashboard";
import ManagerDashboard from "@/components/dashboard/ManagerDashboard";
import StaffDashboard from "@/components/dashboard/StaffDashboard";

export const dynamic = "force-dynamic";

/** Routes each role to its own dashboard view. */
export default async function DashboardPage() {
  const user = await requireCurrentUser();

  switch (user.role) {
    case "owner":
      return <OwnerDashboard name={user.name} />;
    case "manager":
      return <ManagerDashboard name={user.name} />;
    case "staff":
      return <StaffDashboard name={user.name} />;
    default:
      return <AdminDashboard title="Ringkasan Dashboard" />;
  }
}
