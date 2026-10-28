import type { Metadata } from 'next';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'Racha dos Horríveis — Portal Oficial & Estatísticas',
  description:
    'Site oficial do Racha dos Horríveis. Acompanhe estatísticas de partidas, artilharia, assistências e presença dos jogadores.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
