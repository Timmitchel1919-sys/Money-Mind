import type { ReactNode } from "react";
export function AppWorkspace({ children, width="wide" }: { children: ReactNode; width?: "standard"|"wide" }) { return <main id="main-content" className="mm-app-content" data-width={width}>{children}</main>; }
