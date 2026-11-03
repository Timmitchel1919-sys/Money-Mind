"use client";
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AuthLoadingScreen } from "@/components/auth/AuthLoadingScreen";
import { useAuth } from "@/components/auth/AuthProvider";
export function VerificationGuard({children}:{children:ReactNode}){const {isLoading,isAuthenticated,isEmailVerified}=useAuth();const router=useRouter();useEffect(()=>{if(isLoading)return;if(!isAuthenticated)router.replace("/login");else if(isEmailVerified)router.replace("/dashboard");},[isAuthenticated,isEmailVerified,isLoading,router]);if(isLoading||!isAuthenticated||isEmailVerified)return <AuthLoadingScreen/>;return children;}
