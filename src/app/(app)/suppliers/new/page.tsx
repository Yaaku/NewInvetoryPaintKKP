import { requireCapability } from "@/lib/auth";
import SupplierForm from "../SupplierForm";

export const dynamic = "force-dynamic";

export default async function NewSupplierPage() {
  await requireCapability("catalog.manage");
  return (
    <div className="space-y-6">
      <h1 className="text-headline-lg font-sans">Supplier Baru</h1>
      <SupplierForm />
    </div>
  );
}
