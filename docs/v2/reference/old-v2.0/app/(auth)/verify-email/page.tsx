import { VerificationGuard } from "@/components/auth/VerificationGuard";
import { VerifyEmailPanel } from "@/components/auth/VerifyEmailPanel";
import { AuthShell } from "@/components/layout/AuthShell";
export default function VerifyEmailPage(){return <VerificationGuard><AuthShell title="Verify your email" description="Confirm your email address before entering your protected Money Mind workspace."><VerifyEmailPanel/></AuthShell></VerificationGuard>;}
