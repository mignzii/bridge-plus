import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Ajamaat Mobilité',
  description: 'Ajamaat Mobilité — Commandez vos repas en quelques clics. Livraison rapide et fiable directement chez vous.',
  icons: '/ajamaat-logo.jpeg',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
