import "./globals.css";
import type { Metadata } from "next";
import { appConfig } from "@/config/app";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ProfileProvider } from "@/components/profile/ProfileProvider";

export const metadata: Metadata = {
  title: {
    default: appConfig.productName,
    template: `%s | ${appConfig.name}`,
  },
  description: appConfig.description,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body><AuthProvider><ProfileProvider>{children}</ProfileProvider></AuthProvider></body>
    </html>
  );
}
