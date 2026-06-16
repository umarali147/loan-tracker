"use client";

import { useAuthStore } from "@loan/core";
import { LogOut } from "lucide-react";

/** Signed-in user's email + sign-out (sidebar footer). */
export function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  if (!user) return null;

  const initial = user.email?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="md:border-t border-gray-200 md:pt-4">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold">
          {initial}
        </span>
        <span
          className="hidden md:block text-xs text-gray-500 truncate flex-1"
          title={user.email}
        >
          {user.email}
        </span>
        <button
          type="button"
          onClick={() => signOut()}
          title="Sign out"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
