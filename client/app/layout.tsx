import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ComplaintProvider } from "@/context/ComplaintContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SIA-QME FAB",
  description: "Sistema Integrado de Acompanhamento de Queixas Musculoesqueléticas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          <ComplaintProvider>
            {children}
          </ComplaintProvider>
        </AuthProvider>
      </body>
    </html>
  );
}