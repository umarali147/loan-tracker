"use client";

import { useAuthStore } from "@loan/core";

/** Shows the signed-in user's email and a sign-out button (sidebar footer). */
export function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  if (!user) return null;

  return (
    <div className="mt-auto pt-6 border-t border-slate-200 md:border-t-0">
      <p className="text-xs text-slate-500 truncate" title={user.email}>
        {user.email}
      </p>
      <button
        type="button"
        onClick={() => signOut()}
        className="mt-2 text-sm font-semibold text-teal-700 hover:text-teal-800"
      >
        Sign out
      </button>
    </div>
  );
}
