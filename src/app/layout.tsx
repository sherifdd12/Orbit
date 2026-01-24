import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/layout/Sidebar";

const inter = Inter({ subsets: ["latin"] });

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
