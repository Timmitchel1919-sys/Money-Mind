"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { mapAuthError } from "@/lib/auth/errors";
import { sanitizeAuthRedirect } from "@/lib/auth/redirects";
import { loginWithEmail, loginWithGoogle } from "@/services/auth/auth-service";

export function LoginForm(){const router=useRouter();const [error,setError]=useState<string|null>(null);const [loading,setLoading]=useState<"email"|"google"|null>(null);async function complete(user:{emailVerified:boolean}){const next=sanitizeAuthRedirect(new URLSearchParams(window.location.search).get("next"));router.replace(user.emailVerified?next:"/verify-email");}
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setError(null);const data=new FormData(event.currentTarget);const email=String(data.get("email")??"");const password=String(data.get("password")??"");if(!email||!password){setError("Enter your email and password.");return;}setLoading("email");try{await complete(await loginWithEmail({email,password}));}catch(caught){setError(mapAuthError(caught));}finally{setLoading(null);}}
  async function google(){setError(null);setLoading("google");try{await complete(await loginWithGoogle());}catch(caught){setError(mapAuthError(caught));}finally{setLoading(null);}}
  return <form onSubmit={submit} className="grid gap-5" noValidate>{error?<AuthMessage message={error}/>:null}<Input name="email" label="Email" type="email" autoComplete="email" inputMode="email" required disabled={Boolean(loading)}/><PasswordField name="password" label="Password" autoComplete="current-password" required disabled={Boolean(loading)}/><div className="-mt-2 text-right"><Link href="/forgot-password" className="rounded-sm text-sm text-[var(--mm-primary)]">Forgot password?</Link></div><Button type="submit" loading={loading==="email"} disabled={Boolean(loading)} className="w-full">Sign In</Button><div className="flex items-center gap-3 text-xs text-[var(--mm-text-muted)]"><span className="h-px flex-1 bg-[var(--mm-glass-border-subtle)]"/>or<span className="h-px flex-1 bg-[var(--mm-glass-border-subtle)]"/></div><Button type="button" variant="outline" onClick={google} loading={loading==="google"} disabled={Boolean(loading)} className="w-full" leadingIcon={<span aria-hidden className="font-bold">G</span>}>Continue with Google</Button></form>;
}
