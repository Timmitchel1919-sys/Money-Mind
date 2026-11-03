export interface AuthUser { uid:string; email:string|null; displayName:string|null; photoURL:string|null; isEmailVerified:boolean; }
export interface AuthState { user:AuthUser|null; isAuthenticated:boolean; isLoading:boolean; isEmailVerified:boolean; configurationError:string|null; }
export interface LoginInput { email:string; password:string; }
export interface RegisterInput extends LoginInput { fullName:string; }
