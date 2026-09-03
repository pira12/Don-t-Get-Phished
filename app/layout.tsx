import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { SessionProvider } from "@/net/session";

export const metadata: Metadata = {
  title: "Inbox Zero-Day — spot the phishing email",
  description:
    "A phishing-detection training game that looks like a real email client. Investigate emails with authentic inbox tools and classify each as phishing or legitimate.",
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
