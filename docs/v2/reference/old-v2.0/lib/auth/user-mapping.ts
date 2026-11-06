import type { User } from "firebase/auth";
import type { AuthUser } from "@/types/auth";
export function mapFirebaseUser(user:User):AuthUser{return{uid:user.uid,email:user.email,displayName:user.displayName,photoURL:user.photoURL,isEmailVerified:user.emailVerified};}
