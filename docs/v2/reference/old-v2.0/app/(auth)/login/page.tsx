import { AuthShell } from "@/components/layout/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { PublicOnlyGuard } from "@/components/auth/PublicOnlyGuard";

export default function LoginPage() {
  return (
    <PublicOnlyGuard><AuthShell
      title="Welcome back"
      description="Sign in to continue to your financial command center."
      alternateHref="/register"
      alternateLabel="Need an account? Register"
    >
      <LoginForm/>
    </AuthShell></PublicOnlyGuard>
  );
}
