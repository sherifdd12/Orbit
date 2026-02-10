import type { Metadata } from "next";
import { AppLayout } from "@/components/layout/Sidebar";
import { Inter, Cairo } from "next/font/google";
import { cookies } from "next/headers";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { SettingsProvider } from "@/lib/context/SettingsContext";
import { Locale } from "@/lib/i18n/dictionaries";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const cairo = Cairo({ subsets: ["arabic"], weight: ["300", "400", "500", "600", "700"] });

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
  const rawLocale = cookieStore.get("NEXT_LOCALE")?.value || "en";
  const locale: Locale = rawLocale === "ar" ? "ar" : "en";
  const isRTL = locale === "ar";

  return (
    <html lang={locale} dir={isRTL ? "rtl" : "ltr"} className="light">
      <body className={`${locale === 'ar' ? cairo.className : inter.className} min-h-screen antialiased`}>
        <LanguageProvider initialLocale={locale}>
          <SettingsProvider>
            <AppLayout>{children}</AppLayout>
          </SettingsProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
