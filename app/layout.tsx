import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FestiveOverlay } from "@/components/FestiveOverlay";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Secret Santa - Family Gift Exchange",
  description: "Organize your family Secret Santa gift exchange with automatic draw validation",
};

// Separate viewport export (metadata.viewport is deprecated in Next 15).
// viewportFit "cover" enables env(safe-area-inset-*) on iPhones, which the
// floating admin panel uses to stay clear of the home indicator.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
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

