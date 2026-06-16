"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Archive, LayoutDashboard, Wallet } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/archive", label: "Archive", icon: Archive },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
        <Wallet size={18} strokeWidth={2.25} />
      </span>
      <span className="text-base font-semibold tracking-tight text-gray-900">
        Loan Tracker
      </span>
    </Link>
  );
}

/** Left sidebar — desktop / large tablets only. */
export function DesktopSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:min-h-screen bg-white border-r border-gray-200 px-5 py-6">
      <Brand />
      <nav className="flex flex-col gap-1 mt-8">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                active
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.25 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto pt-6">
        <UserMenu />
      </div>
    </aside>
  );
}

/** Sticky top app bar — phones / small tablets only. */
export function MobileHeader() {
  return (
    <header className="md:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-white/90 backdrop-blur border-b border-gray-200">
      <Brand />
      <UserMenu />
    </header>
  );
}

/** Fixed bottom tab bar — phones / small tablets only. */
export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 flex bg-white/95 backdrop-blur border-t border-gray-200"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition ${
              active ? "text-emerald-700" : "text-gray-500"
            }`}
          >
            <Icon size={20} strokeWidth={active ? 2.25 : 2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
