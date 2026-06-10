import type { Metadata, Viewport } from 'next';
import 'katex/dist/katex.min.css';
import './globals.css';
import './mobile-student-course-fixes.css';
import { AffiliateReferralCapture } from '@/components/providers/affiliate-referral-capture';
import { ClientErrorReporter } from '@/components/providers/client-error-reporter';
import { GlobalLoadingProvider } from '@/components/providers/global-loading-provider';
import { SessionProvider } from '@/components/providers/session-provider';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'UnivAI',
  description: 'AI-powered learning, formal programmes, short courses and protected Class View.',
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
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
          <AffiliateReferralCapture />
          <ClientErrorReporter />
          <GlobalLoadingProvider><SessionProvider>{children}</SessionProvider></GlobalLoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
