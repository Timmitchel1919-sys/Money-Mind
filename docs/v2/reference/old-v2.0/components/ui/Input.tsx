"use client";

import { Search } from "lucide-react";
import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface FieldMeta { label: string; helperText?: string; error?: string; leadingIcon?: ReactNode; trailingControl?: ReactNode; }
type InputProps = FieldMeta & InputHTMLAttributes<HTMLInputElement>;
const fieldClass="min-h-11 w-full rounded-[var(--mm-radius-md)] border border-[var(--mm-glass-border-default)] bg-[var(--mm-surface-subtle)] px-3.5 text-sm text-[var(--mm-text-primary)] placeholder:text-[var(--mm-text-muted)] transition-colors hover:border-[var(--mm-glass-border-strong)] focus:border-[var(--mm-primary)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-45 read-only:bg-transparent";

export function Input({ label, helperText, error, leadingIcon, trailingControl, id: suppliedId, className, ...props }: InputProps) {
  const generated=useId(); const id=suppliedId ?? generated; const messageId=`${id}-message`;
  return <label htmlFor={id} className="grid gap-2"><span className="mm-label text-[var(--mm-text-secondary)]">{label}</span><span className="relative flex items-center">{leadingIcon && <span aria-hidden className="absolute left-3.5 text-[var(--mm-text-muted)]">{leadingIcon}</span>}<input id={id} aria-invalid={Boolean(error)} aria-describedby={(helperText||error)?messageId:undefined} className={cn(fieldClass,leadingIcon&&"pl-10",trailingControl&&"pr-11",error&&"border-[var(--mm-danger)]",className)} {...props}/>{trailingControl&&<span className="absolute right-1.5">{trailingControl}</span>}</span>{(helperText||error)&&<span id={messageId} role={error?"alert":undefined} className={cn("mm-caption",error&&"text-[var(--mm-danger)]")}>{error??helperText}</span>}</label>;
}
export function SearchInput(props: Omit<InputProps,"leadingIcon"|"type">) { return <Input type="search" leadingIcon={<Search size={16}/>} {...props}/>; }
type TextareaProps=FieldMeta&TextareaHTMLAttributes<HTMLTextAreaElement>;
export function Textarea({label,helperText,error,id:suppliedId,className,...props}:TextareaProps){const generated=useId();const id=suppliedId??generated;const messageId=`${id}-message`;return <label htmlFor={id} className="grid gap-2"><span className="mm-label text-[var(--mm-text-secondary)]">{label}</span><textarea id={id} aria-invalid={Boolean(error)} aria-describedby={(helperText||error)?messageId:undefined} className={cn(fieldClass,"min-h-28 resize-y py-3",error&&"border-[var(--mm-danger)]",className)} {...props}/>{(helperText||error)&&<span id={messageId} role={error?"alert":undefined} className={cn("mm-caption",error&&"text-[var(--mm-danger)]")}>{error??helperText}</span>}</label>}
