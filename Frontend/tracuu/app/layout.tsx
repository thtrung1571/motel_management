import type { Metadata } from "next";
import "./globals.css";
import { Lexend } from "next/font/google";

const lexend = Lexend({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Tra cứu khách hàng",
  description: "Tra cứu biển số, CCCD hoặc tên khách hàng nhanh chóng",
  metadataBase: new URL("https://example.com")
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="bg-slate-950">
      <body className={`${lexend.className} min-h-screen`}>{children}</body>
    </html>
  );
}
