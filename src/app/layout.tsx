import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alumni on the Warpath | League Ledger",
  description: "The living record book for Alumni on the Warpath."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
