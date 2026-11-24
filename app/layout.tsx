import type { Metadata } from "next"; import "./globals.css";
export const metadata: Metadata = { title: "Advocate Ashutosh Saini | Legal Information", description: "Professional profile and general legal information of Advocate Ashutosh Saini, Rohini, Delhi.", metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"), manifest: "/manifest.webmanifest", themeColor: "#080d18" };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
