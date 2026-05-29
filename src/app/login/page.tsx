import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const session = await getSession();
  if (session.userId) redirect("/dashboard");
  const sp = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-headline-lg font-sans tracking-tight text-on-surface">
            InventoryCat
          </h1>
          <p className="mt-1 text-label-caps font-sans uppercase text-on-surface-variant">
            Admin Gudang
          </p>
        </div>
        <div className="panel p-6">
          <LoginForm next={sp.next} error={sp.error} />
        </div>
        <p className="mt-4 text-center text-label-caps font-sans uppercase text-on-surface-variant/70">
          Versi 1.0 · MVP
        </p>
      </div>
    </div>
  );
}
