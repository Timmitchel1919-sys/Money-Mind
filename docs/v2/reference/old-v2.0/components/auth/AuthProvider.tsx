"use client";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { mapAuthError } from "@/lib/auth/errors";
import { mapFirebaseUser } from "@/lib/auth/user-mapping";
import { observeAuthState, refreshCurrentUser } from "@/services/auth/auth-service";
import type { AuthState, AuthUser } from "@/types/auth";
import { isFirebaseConfigured } from "@/lib/firebase/config";

interface AuthContextValue extends AuthState { refreshUser:()=>Promise<AuthUser|null>; }
const AuthContext=createContext<AuthContextValue|undefined>(undefined);

export function AuthProvider({children}:{children:ReactNode}){
  const [state,setState]=useState<AuthState>(()=>({user:null,isAuthenticated:false,isLoading:isFirebaseConfigured,isEmailVerified:false,configurationError:isFirebaseConfigured?null:"Authentication is unavailable because Firebase is not configured."}));
  useEffect(()=>{if(!isFirebaseConfigured)return;return observeAuthState((firebaseUser)=>{const user=firebaseUser?mapFirebaseUser(firebaseUser):null;setState({user,isAuthenticated:Boolean(user),isLoading:false,isEmailVerified:user?.isEmailVerified??false,configurationError:null});},(error)=>setState({user:null,isAuthenticated:false,isLoading:false,isEmailVerified:false,configurationError:mapAuthError(error)}));},[]);
  const value=useMemo<AuthContextValue>(()=>({...state,refreshUser:async()=>{const firebaseUser=await refreshCurrentUser();const user=firebaseUser?mapFirebaseUser(firebaseUser):null;setState((current)=>({...current,user,isAuthenticated:Boolean(user),isEmailVerified:user?.isEmailVerified??false}));return user;}}),[state]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error("useAuth must be used within AuthProvider.");return value;}
