import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StorageProvider } from "@/components/StorageProvider";
import { AuthGate } from "@/components/AuthGate";
import { DesktopSidebar, MobileHeader, MobileTabBar } from "@/components/Nav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Loan Tracker",
  description: "Track informal loans with friends and family",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${inter.variable}`}>
      <body className="min-h-full bg-gray-50 text-gray-900">
        <AuthGate>
          <StorageProvider>
            <div className="min-h-screen md:flex">
              <DesktopSidebar />
              <div className="flex-1 flex flex-col min-w-0">
                <MobileHeader />
                <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 pb-24 md:px-10 md:py-10 md:pb-10">
                  {children}
                </main>
              </div>
              <MobileTabBar />
            </div>
          </StorageProvider>
        </AuthGate>
      </body>
    </html>
  );
}
