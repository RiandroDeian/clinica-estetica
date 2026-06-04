import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/theme/theme-provider";

export const metadata: Metadata = {
  title: "Moncie Estética",
  description:
    "Clínica de estética premium. Agendamentos rápidos, atendimento premium e tecnologia para cuidar da sua autoestima.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <ThemeProvider>
          {children}

          <Toaster
            position="top-right"
            richColors
            closeButton
          />
        </ThemeProvider>
      </body>
    </html>
  );
}