import type { Metadata } from "next";
import Image from "next/image";
import { AuthScreen } from "@/components/auth-screen";

export const metadata: Metadata = {
  title: "Sign in · ReviewOS",
  description:
    "Sign in to ReviewOS to check applications and move strong cases to Review Ready.",
};

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center gap-5">
      <figure className="flex flex-col items-center gap-2">
        <Image
          src="/images/schmitz-stiftungen-logo.png"
          alt="Schmitz-Stiftungen logo"
          width={222}
          height={56}
          priority
        />
        <figcaption className="text-xs text-muted-foreground">
          Exercise prototype using synthetic data. Not commissioned or
          endorsed by Schmitz-Stiftungen.
        </figcaption>
      </figure>
      <AuthScreen initialMode="signin" />
    </div>
  );
}
