import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MultiplayerProvider } from "../../contexts/multiplayer-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "XXXo The Game",
  description: "Een strategische variant van tic-tac-toe op een 5x5 bord",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body className={inter.className}>
        <MultiplayerProvider>{children}</MultiplayerProvider>
      </body>
    </html>
  );
}
