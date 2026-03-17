import type { Metadata } from 'next';
import './globals.css';
import { SessionProvider } from '@/components/providers/session-provider';


export const metadata: Metadata = {
  title: 'UnivAI',
  description: 'The future of global higher education, powered by AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-body antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
