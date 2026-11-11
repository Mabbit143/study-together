import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Study Together",
  description: "An accessible AI study group with grounded and prepared offline support.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
