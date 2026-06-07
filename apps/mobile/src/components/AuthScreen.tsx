import {
  otpSchema,
  signInSchema,
  signUpSchema,
  useAuthStore,
  type OtpInput,
  type SignInInput,
  type SignUpInput,
} from "@loan/core";
import { Button, Input, colors, radius, spacing, typography } from "@loan/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Mode = "signin" | "signup";

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>("signin");
  const pendingEmail = useAuthStore((s) => s.pendingEmail);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Loan Tracker</Text>

        {pendingEmail ? (
          <VerifyStep />
        ) : (
          <>
            <View style={styles.tabs}>
              {(["signin", "signup"] as const).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => {
                    clearError();
                    setMode(m);
                  }}
                  style={[styles.tab, mode === m && styles.tabActive]}
                >
                  <Text style={[styles.tabLabel, mode === m && styles.tabLabelActive]}>
                    {m === "signin" ? "Sign in" : "Create account"}
                  </Text>
                </Pressable>
              ))}
            </View>
            {mode === "signin" ? <SignInStep /> : <SignUpStep />}
          </>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SignInStep() {
  const signIn = useAuthStore((s) => s.signIn);
  const submitting = useAuthStore((s) => s.submitting);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({ resolver: zodResolver(signInSchema) });

  const submit = handleSubmit(async ({ email, password }) => {
    try {
      await signIn(email, password);
    } catch {
      /* error surfaced via store */
    }
  });

  return (
    <View>
      <Controller
        control={control}
        name="email"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password?.message}
          />
        )}
      />
      <Button title={submitting ? "Please wait…" : "Sign in"} onPress={submit} disabled={submitting} />
    </View>
  );
}

function SignUpStep() {
  const signUp = useAuthStore((s) => s.signUp);
  const submitting = useAuthStore((s) => s.submitting);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({ resolver: zodResolver(signUpSchema) });

  const submit = handleSubmit(async ({ email, password }) => {
    try {
      await signUp(email, password);
    } catch {
      /* error surfaced via store */
    }
  });

  return (
    <View>
      <Controller
        control={control}
        name="email"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            label="Password"
            placeholder="8+ chars, mixed case, number, symbol"
            secureTextEntry
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password?.message}
          />
        )}
      />
      <Button
        title={submitting ? "Please wait…" : "Create account"}
        onPress={submit}
        disabled={submitting}
      />
    </View>
  );
}

function VerifyStep() {
  const verifySignUp = useAuthStore((s) => s.verifySignUp);
  const submitting = useAuthStore((s) => s.submitting);
  const pendingEmail = useAuthStore((s) => s.pendingEmail);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpInput>({ resolver: zodResolver(otpSchema) });

  const submit = handleSubmit(async ({ code }) => {
    try {
      await verifySignUp(code);
    } catch {
      /* error surfaced via store */
    }
  });

  return (
    <View style={{ marginTop: spacing.md }}>
      <Text style={styles.hint}>
        Enter the 4-digit code sent to {pendingEmail}.
      </Text>
      <Controller
        control={control}
        name="code"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            label="Verification code"
            placeholder="1234"
            keyboardType="number-pad"
            maxLength={4}
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.code?.message}
          />
        )}
      />
      <Button title={submitting ? "Please wait…" : "Verify"} onPress={submit} disabled={submitting} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  tabs: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  tabActive: { backgroundColor: colors.primary },
  tabLabel: { ...typography.label, color: colors.textMuted },
  tabLabelActive: { color: colors.primaryText },
  hint: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  error: {
    ...typography.body,
    color: colors.danger,
    backgroundColor: colors.dangerMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
});
