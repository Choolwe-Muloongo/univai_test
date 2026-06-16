import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import 'katex/dist/katex.min.css';
import './globals.css';
import './mobile-student-course-fixes.css';
import './mobile-admin-manual-builder.css';
import './enhanced-lesson-player.css';
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

function PolicyFooter() {
  return (
    <footer className="border-t bg-background px-4 py-4 text-center text-xs text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <span>UnivAI policies</span>
        <Link href="/terms" className="font-semibold text-primary hover:underline">Terms</Link>
        <Link href="/privacy" className="font-semibold text-primary hover:underline">Privacy</Link>
        <Link href="/payment-rules" className="font-semibold text-primary hover:underline">Payments</Link>
        <Link href="/affiliate-terms" className="font-semibold text-primary hover:underline">Affiliates</Link>
        <Link href="/policies" className="font-semibold text-primary hover:underline">All policies</Link>
      </div>
    </footer>
  );
}

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
          <PolicyFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
