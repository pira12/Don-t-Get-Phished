import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { SessionProvider } from "@/net/session";

export const metadata: Metadata = {
  title: "Don't Get Phished — spot the phishing email",
  description:
    "Don't Get Phished is a training game that looks like a real inbox. Investigate emails with authentic tools and classify each as phishing or legitimate — and learn the real signals that keep you safe.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="gmail" data-mode="light" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
