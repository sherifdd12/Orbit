import type { Metadata } from "next";
import { AppLayout } from "@/components/layout/Sidebar";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const runtime = 'edge';

export const metadata: Metadata = {
  title: "Orbit ERP - Management System",
  description: "Advanced ERP for Trading, Contracting, and Service Providers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className={`${inter.className} min-h-screen antialiased`}>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
