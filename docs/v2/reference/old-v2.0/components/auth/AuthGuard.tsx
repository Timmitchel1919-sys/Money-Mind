"use client";
import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthLoadingScreen } from "@/components/auth/AuthLoadingScreen";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProfile } from "@/components/profile/ProfileProvider";
import { ProfileLoadingScreen } from "@/components/profile/ProfileLoadingScreen";

export function AuthGuard({children}:{children:ReactNode}){const {isLoading,isAuthenticated,isEmailVerified}=useAuth();const profileState=useProfile();const router=useRouter();const pathname=usePathname();useEffect(()=>{if(isLoading)return;if(!isAuthenticated){const next=encodeURIComponent(`${pathname}${window.location.search}`);router.replace(`/login?next=${next}`);}else if(!isEmailVerified)router.replace("/verify-email");else if(!profileState.isLoading&&!profileState.error&&!profileState.profile?.onboardingCompleted)router.replace("/onboarding");},[isAuthenticated,isEmailVerified,isLoading,pathname,profileState.error,profileState.isLoading,profileState.profile,router]);if(isLoading||!isAuthenticated||!isEmailVerified)return <AuthLoadingScreen/>;if(profileState.isLoading||profileState.error||!profileState.profile)return <ProfileLoadingScreen/>;if(!profileState.profile.onboardingCompleted)return <AuthLoadingScreen/>;return children;}
