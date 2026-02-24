import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthProvider } from "@/components/providers/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "SwixAI – Voice Agents",
  description: "KI-gestützte Voice Agents für Ihr Unternehmen",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="de">
      <body className="antialiased">
        <AuthProvider session={session}>{children}</AuthProvider>
      </body>
    </html>
  );
}
