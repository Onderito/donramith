import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Don Ramith | Confidence & Social Skills Coach",
  description: "Build real confidence, approach authentically, and create genuine connections with Don Ramith.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
