import type {Metadata,Viewport} from "next";
import {headers} from "next/headers";
import "./globals.css";

const siteUrl=process.env.NEXT_PUBLIC_SITE_URL||"https://ashu-website-two.vercel.app";
export const metadata:Metadata={
 title:{default:"Advocate Ashutosh Saini | Legal Information",template:"%s | Advocate Ashutosh Saini"},
 description:"Professional profile and general legal information of Advocate Ashutosh Saini, Rohini, Delhi.",
 metadataBase:new URL(siteUrl),
 manifest:"/manifest.webmanifest",
 applicationName:"Advocate Ashutosh Saini",
 openGraph:{type:"website",siteName:"Advocate Ashutosh Saini",title:"Advocate Ashutosh Saini | Legal Information",description:"Professional profile and general legal information from Rohini, Delhi.",url:siteUrl},
 twitter:{card:"summary",title:"Advocate Ashutosh Saini | Legal Information",description:"Professional profile and general legal information from Rohini, Delhi."},
};
export const viewport:Viewport={themeColor:"#080d18",width:"device-width",initialScale:1};
export default async function RootLayout({children}:{children:React.ReactNode}){
 const requestHeaders=await headers();
 const lang=requestHeaders.get("x-site-language")==="hi"?"hi":"en";
 return <html lang={lang}><body>{children}</body></html>;
}
