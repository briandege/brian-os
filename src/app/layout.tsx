import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Brian Ndege — Portfolio OS",
  description: "Full-stack developer, AI engineer, and cybersecurity specialist. Interactive OS-style portfolio.",
  openGraph: {
    title: "Brian Ndege — Portfolio OS",
    description: "Full-stack developer, AI engineer, and cybersecurity specialist.",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    title: "brian.os",
    statusBarStyle: "black-translucent",
  },
  themeColor: "#070708",
  viewport: {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
