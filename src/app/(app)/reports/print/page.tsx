import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/auth";
import { formatDate, formatDateTime, formatNumber } from "@/lib/utils";
import PrintButton from "../PrintButton";

export const dynamic = "force-dynamic";

const TITLES = {
  masuk: "Laporan Barang Masuk",
  keluar: "Laporan Barang Keluar",
  kartu: "Laporan Kartu Stok",
} as const;

type Jenis = keyof typeof TITLES;

export default async function PrintReportPage({
  searchParams,
}: {
  searchParams: Promise<{ jenis?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const user = await requireCurrentUser();
  const jenis: Jenis = sp.jenis === "keluar" || sp.jenis === "kartu" ? sp.jenis : "masuk";

  const fromDate = sp.from ? new Date(sp.from) : new Date(Date.now() - 30 * 86_400_000);
  const toDate = sp.to ? new Date(sp.to) : new Date();
  toDate.setHours(23, 59, 59);

  const movements = await prisma.stockMovement.findMany({
    where: {
      createdAt: { gte: fromDate, lte: toDate },
      ...(jenis === "masuk" ? { type: "INBOUND" } : {}),
      ...(jenis === "keluar" ? { type: "OUTBOUND" } : {}),
    },
    include: {
      product: { select: { name: true, sku: true, unit: true } },
      batch: { include: { supplier: { select: { name: true } } } },
      user: { select: { name: true } },
    },
    orderBy: [{ createdAt: "asc" }],
  });

  const totalQty = movements.reduce((s, m) => s + Math.abs(m.quantity), 0);

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <Link href="/reports" className="btn-ghost inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Laporan
        </Link>
        <PrintButton />
      </div>

      <div className="print-area mx-auto max-w-4xl rounded border border-line bg-white p-8 text-black shadow-sm">
        <header className="border-b-2 border-black pb-3 text-center">
          <div className="text-[20px] font-bold uppercase tracking-wide">Berger Paint</div>
          <div className="text-[12px]">Sistem Informasi Persediaan Barang</div>
        </header>

        <div className="mt-4 text-center">
          <h1 className="text-[16px] font-bold uppercase underline">{TITLES[jenis]}</h1>
          <div className="mt-1 text-[12px]">
            Periode: {formatDate(fromDate)} s.d. {formatDate(toDate)}
          </div>
        </div>

        <table className="mt-4 w-full border-collapse text-[11.5px] [&_td]:border [&_td]:border-black [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-black [&_th]:px-2 [&_th]:py-1">
          <thead>
            <tr className="text-center font-semibold">
              <th>No</th>
              <th>Tanggal</th>
              <th>Produk (SKU)</th>
              <th>Batch</th>
              {jenis === "masuk" ? <th>Supplier</th> : null}
              {jenis === "keluar" ? <th>Alasan</th> : null}
              {jenis === "kartu" ? <th>Tipe</th> : null}
              <th>Qty</th>
              {jenis === "kartu" ? (
                <>
                  <th>Stok Sebelum</th>
                  <th>Stok Sesudah</th>
                </>
              ) : null}
              <th>Petugas</th>
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-4 text-center">
                  Tidak ada transaksi pada periode ini.
                </td>
              </tr>
            ) : (
              movements.map((m, i) => (
                <tr key={m.id}>
                  <td className="text-center">{i + 1}</td>
                  <td>{formatDate(m.createdAt)}</td>
                  <td>
                    {m.product.name}{" "}
                    <span className="font-mono text-[10px]">({m.product.sku})</span>
                  </td>
                  <td className="font-mono text-[10.5px]">{m.batch?.batchNumber ?? "—"}</td>
                  {jenis === "masuk" ? <td>{m.batch?.supplier?.name ?? "—"}</td> : null}
                  {jenis === "keluar" ? <td>{m.reason}</td> : null}
                  {jenis === "kartu" ? <td className="text-center">{m.type}</td> : null}
                  <td className="text-right font-mono">
                    {jenis === "kartu" ? m.quantity : Math.abs(m.quantity)} {m.product.unit}
                  </td>
                  {jenis === "kartu" ? (
                    <>
                      <td className="text-right font-mono">{m.stockBefore}</td>
                      <td className="text-right font-mono">{m.stockAfter}</td>
                    </>
                  ) : null}
                  <td>{m.user.name}</td>
                </tr>
              ))
            )}
          </tbody>
          {movements.length > 0 && jenis !== "kartu" ? (
            <tfoot>
              <tr className="font-semibold">
                <td colSpan={4} className="text-right">
                  Total
                </td>
                <td className="text-right font-mono">{formatNumber(totalQty)} unit</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          ) : null}
        </table>

        <div className="mt-8 flex items-start justify-between text-[12px]">
          <div>
            <div>Dicetak pada: {formatDateTime(new Date())}</div>
            <div>Jumlah transaksi: {formatNumber(movements.length)}</div>
          </div>
          <div className="text-center">
            <div>Dicetak oleh,</div>
            <div className="mt-14 font-semibold underline">{user.name}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
