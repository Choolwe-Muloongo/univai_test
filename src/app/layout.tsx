import type { Metadata } from 'next';
import 'katex/dist/katex.min.css';
import './globals.css';
import { SessionProvider } from '@/components/providers/session-provider';
import { ThemeProvider } from '@/components/theme-provider';


export const metadata: Metadata = {
  title: 'UnivAI',
  description: 'AI-powered learning, formal programmes, short courses and protected Class View.',
  icons: {
    icon: '/images/brand/univai-logo-mark-transparent.png',
    apple: '/images/brand/univai-logo-mark-transparent.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}