import type { Metadata } from "next";
import { Cinzel, Sora } from "next/font/google";
import "./globals.css";
import "./crea8x-upgrade.css";

const display = Cinzel({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
  display: "swap"
});

const interfaceFont = Sora({
  subsets: ["latin"],
  variable: "--font-interface",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap"
});

export const metadata: Metadata = {
  title: { default: "CREA8X 3.0 — Design the World of 2100", template: "%s · CREA8X 3.0" },
  description: "CREA8X 3.0 is a cinematic UI/UX competition challenging undergraduates to imagine 2100 and design what comes next.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://cre8x-3-scrollytelling.vercel.app"),
  openGraph: {
    title: "CREA8X 3.0 — Design the World of 2100",
    description: "Imagine 2100. Design what comes next.",
    images: [{ url: "/assets/cre8x-origin.png", width: 1890, height: 1134 }]
  },
  twitter: { card: "summary_large_image", images: ["/assets/cre8x-origin.png"] }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${interfaceFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
