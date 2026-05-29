import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InventoryCat — Admin Gudang",
  description: "Sistem manajemen inventaris toko cat",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
