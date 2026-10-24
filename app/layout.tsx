import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FestivAI | GenAI Celebration & Event Planner",
  description: "GenAI-powered planning assistant for weddings, birthdays, and community events on Cloudflare Workers, D1 & R2.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎉</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen selection:bg-fuchsia-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
