import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { AppShell } from "@/components/layout/AppShell";
import { StoreProvider } from "@/components/providers/StoreProvider";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
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

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const serverToken = cookieStore.get(AUTH_COOKIE_NAME)?.value || null;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <StoreProvider serverToken={serverToken}>
          <AppShell>{children}</AppShell>
        </StoreProvider>
      </body>
    </html>
  );
}
