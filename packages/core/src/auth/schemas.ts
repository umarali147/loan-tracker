import { z } from "zod";

const email = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});
export type SignInInput = z.infer<typeof signInSchema>;

/** Mirrors the backend password_policy: 8+ chars, upper/lower/number/special. */
export const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/[0-9]/, "Add a number")
  .regex(/[^A-Za-z0-9]/, "Add a special character");

export const signUpSchema = z.object({
  email,
  password: passwordSchema,
});
export type SignUpInput = z.infer<typeof signUpSchema>;

/** Backend otp_config.code_length is 4. In debug mode the code is always 1234. */
export const otpSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Enter the 4-digit code"),
});
export type OtpInput = z.infer<typeof otpSchema>;
