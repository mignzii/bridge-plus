import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bridge+',
  description: 'Découvrez une expérience culinaire unique avec Bridge+. Des plats délicieux livrés rapidement et en toute sécurité directement chez vous.',
  icons: ''
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
