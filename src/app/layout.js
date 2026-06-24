import { Geist, Geist_Mono } from "next/font/google";
import AuthInitializer from "@/components/auth/AuthInitializer";
import { AppShell } from "@/components/layout/AppShell";
import { StoreProvider } from "@/components/providers/StoreProvider";
import "katex/dist/katex.min.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Exam Buzz",
  description: "Exam Buzz admin dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <StoreProvider>
          <AuthInitializer />
          <AppShell>{children}</AppShell>
        </StoreProvider>
      </body>
    </html>
  );
}
