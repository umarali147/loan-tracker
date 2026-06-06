import { useLoanStore } from "@loan/core";
import { colors } from "@loan/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text, View } from "react-native";
import { LoanForm } from "../../../src/components/LoanForm";

export default function EditLoanScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const loan = useLoanStore((s) => s.loans.find((l) => l.id === id));
  const editLoan = useLoanStore((s) => s.editLoan);

  if (!loan) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <Text style={{ color: colors.textMuted }}>Loan not found.</Text>
      </View>
    );
  }

  return (
    <LoanForm
      submitLabel="Save changes"
      defaultValues={{
        contactName: loan.contactName,
        direction: loan.direction,
        principalAmount: loan.principalAmount,
        currency: loan.currency,
        dateIssued: loan.dateIssued.slice(0, 10),
        dateDue: loan.dateDue?.slice(0, 10),
        notes: loan.notes,
      }}
      onCancel={() => router.back()}
      onSubmit={async (input) => {
        await editLoan(loan.id, input);
        router.back();
      }}
    />
  );
}
