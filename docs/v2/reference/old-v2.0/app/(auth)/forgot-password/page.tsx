import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { PublicOnlyGuard } from "@/components/auth/PublicOnlyGuard";
import { AuthShell } from "@/components/layout/AuthShell";
export default function ForgotPasswordPage(){return <PublicOnlyGuard><AuthShell title="Reset your password" description="Enter your email and we will send secure reset instructions."><ForgotPasswordForm/></AuthShell></PublicOnlyGuard>;}
