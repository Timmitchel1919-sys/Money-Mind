"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { mapAuthError } from "@/lib/auth/errors";
import { sendPasswordReset } from "@/services/auth/auth-service";
export function ForgotPasswordForm(){const [loading,setLoading]=useState(false);const [message,setMessage]=useState<{text:string;tone:"error"|"success"}|null>(null);async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const data=new FormData(event.currentTarget);const email=String(data.get("email")??"").trim();if(!/^\S+@\S+\.\S+$/.test(email)){setMessage({text:"Enter a valid email address.",tone:"error"});return;}setLoading(true);setMessage(null);try{await sendPasswordReset(email);setMessage({text:"If an account matches that email, a password reset link is on its way.",tone:"success"});}catch(caught){const mapped=mapAuthError(caught);setMessage(mapped.includes("not configured")?{text:mapped,tone:"error"}:{text:"If an account matches that email, a password reset link is on its way.",tone:"success"});}finally{setLoading(false);}}return <form onSubmit={submit} className="grid gap-5" noValidate>{message?<AuthMessage message={message.text} tone={message.tone}/>:null}<Input name="email" label="Email" type="email" autoComplete="email" inputMode="email" required disabled={loading}/><Button type="submit" loading={loading} className="w-full">Send Reset Link</Button><Link href="/login" className="rounded-sm text-center text-sm text-[var(--mm-primary)]">Back to sign in</Link></form>;}
