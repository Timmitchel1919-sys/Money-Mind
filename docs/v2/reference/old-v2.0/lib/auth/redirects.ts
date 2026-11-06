export function sanitizeAuthRedirect(value:string|null|undefined,fallback="/dashboard"):string {
  if(!value||!value.startsWith("/")||value.startsWith("//"))return fallback;
  try { const url=new URL(value,"https://money-mind.local"); return url.origin==="https://money-mind.local"&&url.pathname.startsWith("/dashboard")?`${url.pathname}${url.search}${url.hash}`:fallback; } catch { return fallback; }
}
