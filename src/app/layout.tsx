import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import AIPanel from "@/components/AIPanel";

export const metadata: Metadata = {
  title: "AI Dashboard",
  description: "Production-grade AI dashboard shell."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-8">{children}</main>
          <AIPanel />
        </div>
      </body>
    </html>
  );
}
