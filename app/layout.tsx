import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { cookies } from "next/headers";
import { AppHeader } from "@/components/app-header";
import { AUTH_COOKIE } from "@/lib/auth";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Product Research",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const signedIn = Boolean((await cookies()).get(AUTH_COOKIE)?.value);
  return (
    <html lang="uk" className={manrope.variable}>
      <body className="min-h-screen antialiased">
        <AppHeader signedIn={signedIn} />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">{children}</main>
      </body>
    </html>
  );
}
