import assert from "node:assert/strict";
import { FirebaseError } from "firebase/app";
import { mapAuthError } from "../lib/auth/errors.ts";
import { sanitizeAuthRedirect } from "../lib/auth/redirects.ts";
import { mapFirebaseUser } from "../lib/auth/user-mapping.ts";

assert.equal(sanitizeAuthRedirect("/dashboard/accounts?view=active"),"/dashboard/accounts?view=active");
for(const unsafe of ["https://example.com","//example.com","/login","javascript:alert(1)",null])assert.equal(sanitizeAuthRedirect(unsafe),"/dashboard");
assert.equal(mapAuthError(new FirebaseError("auth/invalid-credential","Firebase internal detail")),"Incorrect email or password.");
assert.equal(mapAuthError(new FirebaseError("auth/unknown","Sensitive internal detail")),"Authentication could not be completed. Please try again.");
assert.deepEqual(mapFirebaseUser({uid:"user-1",email:"person@example.com",displayName:"Person Example",photoURL:null,emailVerified:true}),{uid:"user-1",email:"person@example.com",displayName:"Person Example",photoURL:null,isEmailVerified:true});
console.log("Authentication utility tests passed.");
