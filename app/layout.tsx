import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import SplashScreen from "@/components/SplashScreen";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WIRE — Workflow Intelligence & ROI Engine",
  description: "AI-powered workflow analyzer and project hub",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ backgroundColor: "#faf7f5" }}>
      <body className={`${inter.className} min-h-screen`} style={{ backgroundColor: "#faf7f5" }}>
        <NavBar />
        <SplashScreen />
        <main>{children}</main>
      </body>
    </html>
  );
}
