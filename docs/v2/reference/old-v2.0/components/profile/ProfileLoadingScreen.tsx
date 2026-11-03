"use client";
import { ErrorState } from "@/components/ui/EmptyState";import { LoadingState } from "@/components/ui/Skeleton";import { useProfile } from "@/components/profile/ProfileProvider";
export function ProfileLoadingScreen(){const {error,refresh}=useProfile();return <main className="grid min-h-screen place-items-center px-5">{error?<ErrorState description={error} retry={{label:"Try again",onClick:()=>{void refresh();}}}/>:<LoadingState label="Loading your Money Mind profile"/>}</main>;}
