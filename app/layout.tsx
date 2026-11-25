import type {Metadata,Viewport} from "next";
import {headers} from "next/headers";
import "./globals.css";
export const metadata:Metadata={title:"Advocate Ashutosh Saini | Legal Information",description:"Professional profile and general legal information of Advocate Ashutosh Saini, Rohini, Delhi.",metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000"),manifest:"/manifest.webmanifest"};
export const viewport:Viewport={themeColor:"#080d18"};
export default async function RootLayout({children}:{children:React.ReactNode}){
 const requestHeaders=await headers();
 const lang=requestHeaders.get("x-site-language")==="hi"?"hi":"en";
 return <html lang={lang}><body>{children}</body></html>;
}