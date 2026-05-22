import type React from "react";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NativeShellInit } from "@/components/layout/NativeShellInit";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "XXXo The Game",
  description: "A strategic tic-tac-toe variant on a 5x5 board",
  applicationName: "XXXo",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "XXXo",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0D1117",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        <NativeShellInit />
        {children}
      </body>
    </html>
  );
}
