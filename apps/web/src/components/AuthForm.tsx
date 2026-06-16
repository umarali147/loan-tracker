"use client";

import {
  otpSchema,
  signInSchema,
  signUpSchema,
  useAuthStore,
  type OtpInput,
  type SignInInput,
  type SignUpInput,
} from "@loan/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Wallet } from "lucide-react";

type Mode = "signin" | "signup";

const field =
  "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500";
const errorText = "text-sm text-rose-600 mt-1";

export function AuthForm() {
  const [mode, setMode] = useState<Mode>("signin");
  const pendingEmail = useAuthStore((s) => s.pendingEmail);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <div className="flex flex-col items-center text-center mb-2">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm mb-3">
            <Wallet size={22} strokeWidth={2.25} />
          </span>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            Loan Tracker
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Sign in to track your loans
          </p>
        </div>

        {pendingEmail ? (
          <VerifyStep />
        ) : (
          <>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden my-6 text-sm font-semibold">
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    clearError();
                    setMode(m);
                  }}
                  className={`flex-1 py-2 transition ${
                    mode === m
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {m === "signin" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>
            {mode === "signin" ? <SignInStep /> : <SignUpStep />}
          </>
        )}

        {error && (
          <p className="mt-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function SignInStep() {
  const signIn = useAuthStore((s) => s.signIn);
  const submitting = useAuthStore((s) => s.submitting);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({ resolver: zodResolver(signInSchema) });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    try {
      await signIn(email, password);
    } catch {
      /* error surfaced via store */
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div>
        <label className="block text-sm font-semibold mb-1">Email</label>
        <input {...register("email")} type="email" autoComplete="email" className={field} />
        {errors.email && <p className={errorText}>{errors.email.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1">Password</label>
        <input
          {...register("password")}
          type="password"
          autoComplete="current-password"
          className={field}
        />
        {errors.password && <p className={errorText}>{errors.password.message}</p>}
      </div>
      <SubmitButton submitting={submitting} label="Sign in" />
    </form>
  );
}

function SignUpStep() {
  const signUp = useAuthStore((s) => s.signUp);
  const submitting = useAuthStore((s) => s.submitting);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({ resolver: zodResolver(signUpSchema) });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    try {
      await signUp(email, password);
    } catch {
      /* error surfaced via store */
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div>
        <label className="block text-sm font-semibold mb-1">Email</label>
        <input {...register("email")} type="email" autoComplete="email" className={field} />
        {errors.email && <p className={errorText}>{errors.email.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1">Password</label>
        <input
          {...register("password")}
          type="password"
          autoComplete="new-password"
          className={field}
        />
        {errors.password && <p className={errorText}>{errors.password.message}</p>}
      </div>
      <SubmitButton submitting={submitting} label="Create account" />
    </form>
  );
}

function VerifyStep() {
  const verifySignUp = useAuthStore((s) => s.verifySignUp);
  const submitting = useAuthStore((s) => s.submitting);
  const pendingEmail = useAuthStore((s) => s.pendingEmail);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpInput>({ resolver: zodResolver(otpSchema) });

  const onSubmit = handleSubmit(async ({ code }) => {
    try {
      await verifySignUp(code);
    } catch {
      /* error surfaced via store */
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 mt-6">
      <p className="text-sm text-gray-600">
        Enter the 4-digit code sent to <span className="font-semibold">{pendingEmail}</span>.
      </p>
      <div>
        <input
          {...register("code")}
          inputMode="numeric"
          maxLength={4}
          placeholder="1234"
          className={`${field} text-center tracking-[0.5em] text-lg`}
        />
        {errors.code && <p className={errorText}>{errors.code.message}</p>}
      </div>
      <SubmitButton submitting={submitting} label="Verify" />
    </form>
  );
}

function SubmitButton({ submitting, label }: { submitting: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={submitting}
      className="mt-1 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg disabled:opacity-50"
    >
      {submitting ? "Please wait…" : label}
    </button>
  );
}
