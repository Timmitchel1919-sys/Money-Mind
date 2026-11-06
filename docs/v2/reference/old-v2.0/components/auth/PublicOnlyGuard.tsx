"use client";
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AuthLoadingScreen } from "@/components/auth/AuthLoadingScreen";
import { useAuth } from "@/components/auth/AuthProvider";
export function PublicOnlyGuard({children}:{children:ReactNode}){const {isLoading,isAuthenticated,isEmailVerified}=useAuth();const router=useRouter();useEffect(()=>{if(!isLoading&&isAuthenticated)router.replace(isEmailVerified?"/dashboard":"/verify-email");},[isAuthenticated,isEmailVerified,isLoading,router]);if(isLoading||isAuthenticated)return <AuthLoadingScreen/>;return children;}
