import type { Metadata } from 'next';
import { Nova_Square, Tektur } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { Footer, Navbar } from '@/components/shared';

const nova_square = Nova_Square({
  weight: '400', // Add this - required property
  subsets: ['latin'],
});

const tektur = Tektur({
  weight: '400', // Add this - required property
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'RAG System - Document Chat',
  description: 'Chat with your documents using AI',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${tektur.className} bg-black`}>
        <Navbar />
        <main className="pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
