import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth-screen";

export const metadata: Metadata = {
  title: "Register · ReviewOS",
  description:
    "Create an applicant account on ReviewOS to submit evidence for foundation review.",
};

export default function RegisterPage() {
  return <AuthScreen initialMode="signup" />;
}
