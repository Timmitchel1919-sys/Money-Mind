import { AuthShell } from "@/components/layout/AuthShell";
import { PublicOnlyGuard } from "@/components/auth/PublicOnlyGuard";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <PublicOnlyGuard><AuthShell
      title="Create your account"
      description="Create a secure home for your connected financial life."
      alternateHref="/login"
      alternateLabel="Already have an account? Sign in"
    >
      <RegisterForm/>
    </AuthShell></PublicOnlyGuard>
  );
}
