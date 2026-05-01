import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Next.js 14 ላይ አስተማማኝ የሆነውን Inter ፎንት እንጠቀማለን
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Stephen AI Dashboard",
  description: "Voice AI Management Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-black text-white`}>
        {children}
      </body>
    </html>
  );
}