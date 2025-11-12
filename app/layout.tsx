import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FestiveOverlay } from "@/components/FestiveOverlay";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Secret Santa - Family Gift Exchange",
  description: "Organize your family Secret Santa gift exchange with automatic draw validation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className={`${inter.className} overflow-x-hidden`}>
        <FestiveOverlay />
        {children}
      </body>
    </html>
  );
}

