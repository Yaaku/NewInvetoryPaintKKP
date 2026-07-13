import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import ToastHost from "@/components/ToastHost";
import CommandPalette from "@/components/CommandPalette";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const canProcure = can(user.role, "procurement.manage");
  const canManageUsers = can(user.role, "users.manage");
  const canVerify = can(user.role, "stock.verify");
  const isStaff = user.role === "staff";

  const [reorderCount, poCount, opnameCount, expiredCount, validationCount] =
    await Promise.all([
      prisma.product.count({
        where: {
          isActive: true,
          currentStock: { lte: prisma.product.fields.minStock },
        },
      }),
      canProcure
        ? prisma.purchaseOrder.count({
            where: { status: { in: ["draft", "ordered"] } },
          })
        : Promise.resolve(0),
      prisma.stockOpname.count({ where: { status: "draft" } }),
      prisma.batch.count({
        where: { quantity: { gt: 0 }, expiryDate: { lt: new Date() } },
      }),
      canVerify
        ? prisma.stockMovement.count({
            where: {
              type: { in: ["INBOUND", "OUTBOUND"] },
              verificationStatus: "pending",
            },
          })
        : Promise.resolve(0),
    ]);

  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Lewati ke konten utama
      </a>
      <Sidebar
        canManageUsers={canManageUsers}
        canProcure={canProcure}
        canVerify={canVerify}
        isStaff={isStaff}
        badges={{
          reorder: reorderCount,
          purchaseOrders: poCount,
          opname: opnameCount,
          movements: expiredCount,
          validation: validationCount,
        }}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          userName={user.name}
          email={user.email}
          canManageUsers={canManageUsers}
          canProcure={canProcure}
          canVerify={canVerify}
          isStaff={isStaff}
        />
        <main id="main-content" className="flex-1 px-6 py-6 lg:px-8">{children}</main>
      </div>
      <ToastHost />
      <CommandPalette />
    </div>
  );
}
