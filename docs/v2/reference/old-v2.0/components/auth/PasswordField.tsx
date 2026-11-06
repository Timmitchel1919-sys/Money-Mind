"use client";
import { Eye, EyeOff } from "lucide-react";
import { useState, type InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/Input";
export function PasswordField({label,error,helperText,...props}:{label:string;error?:string;helperText?:string}&Omit<InputHTMLAttributes<HTMLInputElement>,"type">){const [visible,setVisible]=useState(false);return <Input label={label} error={error} helperText={helperText} type={visible?"text":"password"} trailingControl={<button type="button" aria-label={visible?"Hide password":"Show password"} onClick={()=>setVisible((value)=>!value)} className="grid h-8 w-8 place-items-center rounded-lg text-[var(--mm-text-muted)] hover:text-[var(--mm-text-primary)]">{visible?<EyeOff aria-hidden size={16}/>:<Eye aria-hidden size={16}/>}</button>} {...props}/>;}
