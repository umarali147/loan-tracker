import { useLoanStore } from "@loan/core";
import { useRouter } from "expo-router";
import { LoanForm } from "../../src/components/LoanForm";

export default function NewLoanScreen() {
  const router = useRouter();
  const addLoan = useLoanStore((s) => s.addLoan);

  return (
    <LoanForm
      submitLabel="Create loan"
      onCancel={() => router.back()}
      onSubmit={async (input) => {
        await addLoan(input);
        router.back();
      }}
    />
  );
}
