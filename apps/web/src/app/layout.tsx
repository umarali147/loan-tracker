import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { StorageProvider } from "@/components/StorageProvider";

export const metadata: Metadata = {
  title: "Loan Tracker",
  description: "Track informal loans with friends and family",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-900">
        <StorageProvider>
          <div className="min-h-screen flex flex-col md:flex-row">
            <aside className="md:w-60 md:min-h-screen bg-white border-b md:border-b-0 md:border-r border-slate-200 p-4 md:p-6">
              <h1 className="text-lg font-bold text-teal-700 mb-6">Loan Tracker</h1>
              <nav className="flex md:flex-col gap-2">
                <Link
                  href="/"
                  className="px-3 py-2 rounded-lg hover:bg-slate-100 font-medium text-sm"
                >
                  Dashboard
                </Link>
                <Link
                  href="/archive"
                  className="px-3 py-2 rounded-lg hover:bg-slate-100 font-medium text-sm"
                >
                  Archive
                </Link>
              </nav>
            </aside>
            <main className="flex-1 p-4 md:p-8 max-w-4xl w-full mx-auto">
              {children}
            </main>
          </div>
        </StorageProvider>
      </body>
    </html>
  );
}
