import type { Metadata } from "next";
import { AppLayout } from "@/components/layout/Sidebar";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { Locale } from "@/lib/i18n/dictionaries";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const runtime = 'edge';

export const metadata: Metadata = {
  title: "Orbit ERP - Management System",
  description: "Advanced ERP for Trading, Contracting, and Service Providers",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";
  const isRTL = locale === "ar";

  return (
    <html lang={locale} dir={isRTL ? "rtl" : "ltr"} className="light">
      <body className={`${inter.className} min-h-screen antialiased`}>
        <LanguageProvider initialLocale={locale}>
          <AppLayout>{children}</AppLayout>
        </LanguageProvider>
      </body>
    </html>
  );
}
