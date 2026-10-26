import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AuthModal } from "@/components/AuthModal";

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
    <html lang="en">
      <body className="bg-[#f2f0eb] text-[#292827] antialiased min-h-screen selection:bg-[#d4c7ff] selection:text-[#292827]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#421d24] focus:text-white focus:rounded-lg focus:shadow-md focus:text-xs focus:font-semibold"
        >
          Skip to main content
        </a>
        <AuthProvider>
          {children}
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}
