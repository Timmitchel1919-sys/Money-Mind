"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { mapAuthError } from "@/lib/auth/errors";
import { loginWithGoogle, registerWithEmail } from "@/services/auth/auth-service";

export function RegisterForm(){const router=useRouter();const [error,setError]=useState<string|null>(null);const [loading,setLoading]=useState<"email"|"google"|null>(null);
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setError(null);const data=new FormData(event.currentTarget);const fullName=String(data.get("fullName")??"").trim();const email=String(data.get("email")??"").trim();const password=String(data.get("password")??"");const confirmation=String(data.get("confirmation")??"");if(!fullName){setError("Enter your full name.");return;}if(!/^\S+@\S+\.\S+$/.test(email)){setError("Enter a valid email address.");return;}if(password.length<8){setError("Use at least 8 characters for your password.");return;}if(password!==confirmation){setError("Passwords do not match.");return;}setLoading("email");try{await registerWithEmail({fullName,email,password});router.replace("/verify-email");}catch(caught){setError(mapAuthError(caught));}finally{setLoading(null);}}
  async function google(){setError(null);setLoading("google");try{const user=await loginWithGoogle();router.replace(user.emailVerified?"/dashboard":"/verify-email");}catch(caught){setError(mapAuthError(caught));}finally{setLoading(null);}}
  return <form onSubmit={submit} className="grid gap-5" noValidate>{error?<AuthMessage message={error}/>:null}<Input name="fullName" label="Full Name" autoComplete="name" required disabled={Boolean(loading)}/><Input name="email" label="Email" type="email" autoComplete="email" inputMode="email" required disabled={Boolean(loading)}/><PasswordField name="password" label="Password" autoComplete="new-password" helperText="Use at least 8 characters." required disabled={Boolean(loading)}/><PasswordField name="confirmation" label="Confirm Password" autoComplete="new-password" required disabled={Boolean(loading)}/><Button type="submit" loading={loading==="email"} disabled={Boolean(loading)} className="w-full">Create Account</Button><div className="flex items-center gap-3 text-xs text-[var(--mm-text-muted)]"><span className="h-px flex-1 bg-[var(--mm-glass-border-subtle)]"/>or<span className="h-px flex-1 bg-[var(--mm-glass-border-subtle)]"/></div><Button type="button" variant="outline" onClick={google} loading={loading==="google"} disabled={Boolean(loading)} className="w-full" leadingIcon={<span aria-hidden className="font-bold">G</span>}>Continue with Google</Button></form>;
}
