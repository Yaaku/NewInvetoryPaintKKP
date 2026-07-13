"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn inline-flex items-center gap-1.5">
      <Printer className="h-4 w-4" />
      Cetak / Simpan PDF
    </button>
  );
}
