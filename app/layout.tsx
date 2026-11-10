import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Product Research",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk">
      <body>
        <header>
          <Link href="/">Ніші</Link>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
