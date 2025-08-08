import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PGA One & Done",
  description: "Mobile-first preview UI (no auth, no DB)."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <div className="container py-6">{children}</div>
      </body>
    </html>
  )
}
