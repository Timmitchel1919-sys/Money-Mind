"use client";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";import { OnboardingGuard } from "@/components/profile/OnboardingGuard";import { useProfile } from "@/components/profile/ProfileProvider";
function Content(){const {profile}=useProfile();return profile?<OnboardingFlow initialProfile={profile}/>:null;}
export default function OnboardingPage(){return <OnboardingGuard><Content/></OnboardingGuard>;}
