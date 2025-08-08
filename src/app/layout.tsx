import "./globals.css"; import type { Metadata } from "next";
export const metadata: Metadata = { title: "Toxic PGA One & Done", description: "Pick one golfer each week. Earn official money. Top the board." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en" className="dark"><body><div className="container py-6">{children}</div></body></html>)
}
