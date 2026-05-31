import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import ToastHost from "@/components/ToastHost";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const canManageUsers = can(user.role, "users.manage");
  const canProcure = can(user.role, "procurement.manage");

  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Lewati ke konten utama
      </a>
      <Sidebar canManageUsers={canManageUsers} canProcure={canProcure} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          userName={user.name}
          email={user.email}
          canManageUsers={canManageUsers}
          canProcure={canProcure}
        />
        <main
          id="main-content"
          className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6"
        >
          {children}
        </main>
      </div>
      <ToastHost />
    </div>
  );
}
